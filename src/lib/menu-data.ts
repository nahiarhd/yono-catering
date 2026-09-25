import { db } from "./db";
import { getSettings } from "./settings";
import { isResponsesLocked, menuDateToKey } from "./cutoff";
import { parseDateKey, todayKey } from "./dates";

export async function deletePastMenus(minDateKey: string = todayKey()) {
  const minDate = parseDateKey(minDateKey);
  const pastMenus = await db.menu.findMany({
    where: { date: { lt: minDate } },
    select: { id: true },
  });

  if (pastMenus.length > 0) {
    const pastIds = pastMenus.map((m) => m.id);
    await db.response.deleteMany({
      where: { menuId: { in: pastIds } },
    });
    await db.menu.deleteMany({
      where: { id: { in: pastIds } },
    });
  }
}

export async function getMenuDay(dateKey: string) {
  await deletePastMenus();

  const settings = await getSettings();
  const menu = await db.menu.findUnique({
    where: { date: parseDateKey(dateKey) },
    include: {
      responses: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { user: { name: "asc" } },
      },
    },
  });

  const locked = menu
    ? isResponsesLocked(
        dateKey,
        settings.standingCutoff,
        menu.cutoffOverride,
      )
    : false;

  return { settings, menu, locked };
}


export async function upsertMenu(input: {
  dateKey: string;
  dish: string;
  note: string | null;
  cutoffOverride: string | null;
}) {
  return db.menu.upsert({
    where: { date: parseDateKey(input.dateKey) },
    create: {
      date: parseDateKey(input.dateKey),
      dish: input.dish,
      note: input.note,
      cutoffOverride: input.cutoffOverride,
    },
    update: {
      dish: input.dish,
      note: input.note,
      cutoffOverride: input.cutoffOverride,
    },
  });
}

export function menuDateKeyFromMenu(menu: { date: Date }) {
  return menuDateToKey(menu.date);
}