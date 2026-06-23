"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireYono, hashPin } from "@/lib/auth";
import { parseHHMM } from "@/lib/cutoff";
import { normalizeDishKey, parseDefaultDishes } from "@/lib/dishes";
import { getSettings } from "@/lib/settings";
import { id } from "@/lib/id";

export type ActionState = { error?: string; ok?: boolean };

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const standingCutoff = String(formData.get("standingCutoff") ?? "").trim();
  const reminderTime = String(formData.get("reminderTime") ?? "").trim();

  if (!parseHHMM(standingCutoff) || !parseHHMM(reminderTime)) {
    return { error: id.errors.timeFormat };
  }

  await db.settings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", standingCutoff, reminderTime },
    update: { standingCutoff, reminderTime },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function addMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();

  if (!name || !pin) return { error: id.errors.namePinRequired };
  if (pin.length < 4) return { error: id.errors.pinMinLength };

  const exists = await db.user.findUnique({ where: { name } });
  if (exists) return { error: id.errors.nameTaken };

  await db.user.create({
    data: { name, pinHash: await hashPin(pin), role: "member" },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();
  const memberId = String(formData.get("memberId") ?? "");
  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member || member.role !== "member") return { error: id.errors.memberNotFound };
  await db.user.delete({ where: { id: memberId } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function resetPinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const memberId = String(formData.get("memberId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  if (!memberId || !pin) return { error: id.errors.memberPinRequired };

  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member) return { error: id.errors.memberNotFound };

  await db.user.update({
    where: { id: memberId },
    data: { pinHash: await hashPin(pin) },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function addDefaultDishAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const dish = String(formData.get("dish") ?? "").trim();
  if (!dish) return { error: id.errors.dishRequired };

  const settings = await getSettings();
  const dishes = parseDefaultDishes(settings.defaultDishes);
  const key = normalizeDishKey(dish);
  if (dishes.some((d) => normalizeDishKey(d) === key)) {
    return { error: id.errors.dishExists };
  }

  await db.settings.update({
    where: { id: "singleton" },
    data: { defaultDishes: [...dishes, dish] },
  });

  revalidatePath("/settings");
  revalidatePath("/yono");
  revalidatePath("/home");
  return { ok: true };
}

export async function removeDefaultDishAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const dish = String(formData.get("dish") ?? "").trim();
  if (!dish) return { error: id.errors.dishRequired };

  const settings = await getSettings();
  const dishes = parseDefaultDishes(settings.defaultDishes);
  const key = normalizeDishKey(dish);
  const next = dishes.filter((d) => normalizeDishKey(d) !== key);

  await db.settings.update({
    where: { id: "singleton" },
    data: { defaultDishes: next },
  });

  await db.dishPreference.deleteMany({ where: { forDish: key } });

  revalidatePath("/settings");
  revalidatePath("/yono");
  revalidatePath("/home");
  return { ok: true };
}