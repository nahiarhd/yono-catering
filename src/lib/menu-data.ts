import { db } from "./db";
import { getSettings } from "./settings";
import { isResponsesLocked } from "./cutoff";
import { parseDateKey } from "./dates";

/** All warung menus for a day, plus the one picked by menuId (or the first). */
export async function getMenuDay(dateKey: string, menuId?: string | null) {
  const settings = await getSettings();
  const menus = await db.menu.findMany({
    where: { date: parseDateKey(dateKey) },
    orderBy: { createdAt: "asc" },
    include: {
      responses: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });
  const menu = menus.find((m) => m.id === menuId) ?? menus[0] ?? null;

  const locked = menu
    ? isResponsesLocked(
        dateKey,
        settings.standingCutoff,
        menu.cutoffOverride,
      )
    : false;

  return { settings, menus, menu, locked };
}

export type MenuFields = {
  vendor: string;
  dish: string;
  subDishes?: string | null;
  addOns?: string | null;
  note: string | null;
  cutoffOverride: string | null;
};

/** Updates menuId when given, else upserts the day's menu for that warung. */
export async function upsertMenu(dateKey: string, menuId: string | null, fields: MenuFields) {
  if (menuId) return db.menu.update({ where: { id: menuId }, data: fields });
  const date = parseDateKey(dateKey);
  return db.menu.upsert({
    where: { date_vendor: { date, vendor: fields.vendor } },
    create: { date, ...fields },
    update: fields,
  });
}

/** A member eats from one warung per day, so saving here drops their answer at the other warungs. */
export async function saveResponse(
  menu: { id: string; date: Date },
  userId: string,
  data: { wants: boolean; swapDish: string | null; addOns: string | null; note?: string | null },
) {
  await db.$transaction([
    db.response.deleteMany({
      where: { userId, menu: { date: menu.date }, menuId: { not: menu.id } },
    }),
    db.response.upsert({
      where: { menuId_userId: { menuId: menu.id, userId } },
      create: { menuId: menu.id, userId, ...data },
      update: data,
    }),
  ]);
}
