import { db } from "./db";
import { getSettings } from "./settings";
import { isResponsesLocked, menuDateToKey } from "./cutoff";
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