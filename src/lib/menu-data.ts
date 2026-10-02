import { db } from "./db";
import { getSettings } from "./settings";
import { isResponsesLocked } from "./cutoff";
import { parseDateKey } from "./dates";

export async function getMenuDay(dateKey: string) {
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
  subDishes?: string | null;
  addOns?: string | null;
  note: string | null;
  cutoffOverride: string | null;
}) {
  return db.menu.upsert({
    where: { date: parseDateKey(input.dateKey) },
    create: {
      date: parseDateKey(input.dateKey),
      dish: input.dish,
      subDishes: input.subDishes,
      addOns: input.addOns,
      note: input.note,
      cutoffOverride: input.cutoffOverride,
    },
    update: {
      dish: input.dish,
      subDishes: input.subDishes,
      addOns: input.addOns,
      note: input.note,
      cutoffOverride: input.cutoffOverride,
    },
  });
}