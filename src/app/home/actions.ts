"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getMenuDay } from "@/lib/menu-data";
import { normalizeDishKey, parseSubDishes } from "@/lib/dishes";
import { upsertDishPreference } from "@/lib/preferences";
import { todayKey } from "@/lib/dates";
import { broadcastRealtime } from "@/lib/realtime";
import { id } from "@/lib/id";

export type ActionState = { error?: string; ok?: boolean };

function parsePreferenceFields(formData: FormData) {
  const wantsRaw = String(formData.get("wants") ?? "yes");
  const wants = wantsRaw === "yes";
  const selectedDish = String(formData.get("selectedDish") ?? "").trim();
  const selectedVariant = String(formData.get("selectedVariant") ?? "").trim();
  const subDishRaw = String(formData.get("subDish") ?? formData.get("swapDish") ?? "").trim();
  const addOnsRaw = String(formData.get("addOns") ?? "").trim();
  const addOnsList = parseSubDishes(addOnsRaw);
  const addOns = wants && addOnsList.length > 0 ? addOnsList.join(", ") : null;

  let swapDish: string | null = null;
  if (wants) {
    if (selectedDish) {
      swapDish = selectedVariant ? `${selectedDish} (${selectedVariant})` : selectedDish;
    } else if (subDishRaw) {
      swapDish = subDishRaw;
    }
  }
  const note = String(formData.get("note") ?? "").trim() || null;
  return { wants, swapDish, addOns, note };
}

export async function submitResponseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const dateKey = String(formData.get("dateKey") ?? "");
  const { wants, swapDish, addOns, note } = parsePreferenceFields(formData);
  const saveAsPreference = String(formData.get("saveAsPreference") ?? "") === "yes";

  if (!dateKey || dateKey < todayKey()) return { error: id.errors.missingDay };

  const { menu, locked } = await getMenuDay(dateKey);
  if (!menu) return { error: id.errors.noMenu };
  if (locked) return { error: id.errors.locked };

  const dishOptions = parseSubDishes(menu.dish);
  const menuSubDishes = parseSubDishes(menu.subDishes);
  if (wants) {
    if (dishOptions.length > 1 && !swapDish) {
      return { error: "Silakan pilih salah satu menu masakan." };
    }
    if (menuSubDishes.length > 0 && !swapDish) {
      return { error: id.response.variantRequired };
    }
  }

  await db.response.upsert({
    where: { menuId_userId: { menuId: menu.id, userId: user.id } },
    create: {
      menuId: menu.id,
      userId: user.id,
      wants,
      swapDish,
      addOns,
      note,
    },
    update: {
      wants,
      swapDish,
      addOns,
      note,
    },
  });

  if (saveAsPreference) {
    await upsertDishPreference(user.id, menu.dish, { wants, swapDish, addOns, note });
  }

  revalidatePath("/home");
  broadcastRealtime("revalidate");
  return { ok: true };
}

export async function saveDishPreferenceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const forDish = String(formData.get("forDish") ?? "").trim();
  const { wants, swapDish, addOns, note } = parsePreferenceFields(formData);

  if (!forDish) return { error: id.errors.dishRequired };

  await upsertDishPreference(user.id, forDish, { wants, swapDish, addOns, note });

  revalidatePath("/home");
  revalidatePath("/preferences");
  broadcastRealtime("revalidate");
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
  broadcastRealtime("revalidate");
  return { ok: true };
}