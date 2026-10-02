"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canOrder, requireUser } from "@/lib/auth";
import { getMenuDay } from "@/lib/menu-data";
import { normalizeDishKey, parseSubDishes, resolveMenuSelection } from "@/lib/dishes";
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
  if (!canOrder(user)) return { error: id.errors.cannotOrder };

  const dateKey = String(formData.get("dateKey") ?? "");
  const { wants, note } = parsePreferenceFields(formData);
  const saveAsPreference = String(formData.get("saveAsPreference") ?? "") === "yes";

  if (!dateKey || dateKey < todayKey()) return { error: id.errors.missingDay };

  const { menu, locked } = await getMenuDay(dateKey);
  if (!menu) return { error: id.errors.noMenu };
  if (locked) return { error: id.errors.locked };

  let swapDish: string | null = null;
  let addOns: string | null = null;
  if (wants) {
    const selection = resolveMenuSelection(menu, {
      selectedDish: String(formData.get("selectedDish") ?? ""),
      selectedVariant: String(formData.get("selectedVariant") ?? ""),
      addOns: String(formData.get("addOns") ?? ""),
    });
    if (selection === "dishRequired") return { error: "Silakan pilih salah satu menu masakan." };
    if (selection === "variantRequired") return { error: id.response.variantRequired };
    ({ swapDish, addOns } = selection);
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