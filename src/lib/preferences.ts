import { db } from "./db";
import { normalizeDishKey } from "./dishes";

export type PreferenceValue = {
  wants: boolean;
  swapDish: string | null;
  note: string | null;
};

export async function getUserDishPreferences(userId: string) {
  return db.dishPreference.findMany({
    where: { userId },
    orderBy: { forDish: "asc" },
  });
}

export async function getPreferenceForDish(userId: string, dish: string) {
  const key = normalizeDishKey(dish);
  if (!key) return null;
  return db.dishPreference.findUnique({
    where: { userId_forDish: { userId, forDish: key } },
  });
}

export function preferenceToInitial(pref: PreferenceValue | null | undefined) {
  if (!pref) return undefined;
  return {
    wants: pref.wants,
    swapDish: pref.swapDish,
    note: pref.note,
  };
}

export async function upsertDishPreference(
  userId: string,
  dish: string,
  value: PreferenceValue,
) {
  const forDish = normalizeDishKey(dish);
  if (!forDish) return;

  await db.dishPreference.upsert({
    where: { userId_forDish: { userId, forDish } },
    create: {
      userId,
      forDish,
      wants: value.wants,
      swapDish: value.wants ? null : value.swapDish?.trim() || null,
      note: value.note?.trim() || null,
    },
    update: {
      wants: value.wants,
      swapDish: value.wants ? null : value.swapDish?.trim() || null,
      note: value.note?.trim() || null,
    },
  });
}