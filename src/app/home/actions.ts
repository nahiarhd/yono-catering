"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getMenuDay } from "@/lib/menu-data";
import { normalizeDishKey } from "@/lib/dishes";
import { upsertDishPreference } from "@/lib/preferences";
import { todayKey } from "@/lib/dates";
import { id } from "@/lib/id";

export type ActionState = { error?: string; ok?: boolean };

function parsePreferenceFields(formData: FormData) {
  const wantsRaw = String(formData.get("wants") ?? "yes");
  const wants = wantsRaw === "yes";
  const note = String(formData.get("note") ?? "").trim() || null;
  return { wants, swapDish: null, note };
}

export async function submitResponseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const dateKey = String(formData.get("dateKey") ?? "");
  const { wants, note } = parsePreferenceFields(formData);
  const saveAsPreference = String(formData.get("saveAsPreference") ?? "") === "yes";

  if (!dateKey || dateKey < todayKey()) return { error: id.errors.missingDay };

  const { menu, locked } = await getMenuDay(dateKey);
  if (!menu) return { error: id.errors.noMenu };
  if (locked) return { error: id.errors.locked };

  await db.response.upsert({
    where: { menuId_userId: { menuId: menu.id, userId: user.id } },
    create: {
      menuId: menu.id,
      userId: user.id,
      wants,
      swapDish: null,
      note,
    },
    update: {
      wants,
      swapDish: null,
      note,
    },
  });

  if (saveAsPreference) {
    await upsertDishPreference(user.id, menu.dish, { wants, swapDish: null, note });
  }

  revalidatePath("/home");
  return { ok: true };
}

export async function saveDishPreferenceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const forDish = String(formData.get("forDish") ?? "").trim();
  const { wants, note } = parsePreferenceFields(formData);

  if (!forDish) return { error: id.errors.dishRequired };

  await upsertDishPreference(user.id, forDish, { wants, swapDish: null, note });

  revalidatePath("/home");
  revalidatePath("/preferences");
  return { ok: true };
}

export async function removeDishPreferenceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const forDish = String(formData.get("forDish") ?? "").trim();
  if (!forDish) return { error: id.errors.dishRequired };

  await db.dishPreference.deleteMany({
    where: { userId: user.id, forDish: normalizeDishKey(forDish) },
  });

  revalidatePath("/home");
  revalidatePath("/preferences");
  return { ok: true };
}