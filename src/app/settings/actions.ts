"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin, requireStrictAdmin, requireUser, verifyPin, hashPin } from "@/lib/auth";
import { parseHHMM } from "@/lib/cutoff";
import { normalizeDishKey, parseDefaultDishes, parseSubDishes } from "@/lib/dishes";
import { getSettings } from "@/lib/settings";
import { id } from "@/lib/id";

export type ActionState = { error?: string; ok?: boolean; message?: string };

export async function updateOwnPinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const currentPin = String(formData.get("currentPin") ?? "").trim();
  const newPin = String(formData.get("newPin") ?? "").trim();
  const confirmPin = String(formData.get("confirmPin") ?? "").trim();

  if (!currentPin || !newPin || !confirmPin) {
    return { error: id.account.errorAllFieldsRequired };
  }

  const isCurrentValid = await verifyPin(user.pinHash, currentPin);
  if (!isCurrentValid) {
    return { error: id.account.errorCurrentPinWrong };
  }

  if (newPin.length < 4) {
    return { error: id.errors.pinMinLength };
  }

  if (newPin !== confirmPin) {
    return { error: id.account.errorPinMismatch };
  }

  await db.user.update({
    where: { id: user.id },
    data: { pinHash: await hashPin(newPin) },
  });

  revalidatePath("/preferences");
  revalidatePath("/settings");
  revalidatePath("/users");
  return { ok: true, message: id.account.pinUpdatedSuccess };
}

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

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
  await requireStrictAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const rawRole = String(formData.get("role") ?? "member").trim();
  const role: Role = rawRole === "admin" ? "admin" : "member";

  if (!name || !pin) return { error: id.errors.namePinRequired };
  if (pin.length < 4) return { error: id.errors.pinMinLength };

  const exists = await db.user.findUnique({ where: { name } });
  if (exists) return { error: id.errors.nameTaken };

  await db.user.create({
    data: { name, pinHash: await hashPin(pin), role },
  });

  revalidatePath("/settings");
  return { ok: true };
}

export async function removeMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentAdmin = await requireStrictAdmin();
  const memberId = String(formData.get("memberId") ?? "");
  if (memberId === currentAdmin.id) {
    return { error: id.errors.cannotRemoveSelf };
  }

  const target = await db.user.findUnique({ where: { id: memberId } });
  if (!target) return { error: id.errors.memberNotFound };
  if (target.role === "yono") return { error: id.errors.cannotRemoveYono };

  await db.user.delete({ where: { id: memberId } });
  revalidatePath("/settings");
  return { ok: true };
}

export async function resetPinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStrictAdmin();

  const memberId = String(formData.get("memberId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  if (!memberId || !pin) return { error: id.errors.memberPinRequired };
  if (pin.length < 4) return { error: id.errors.pinMinLength };

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
  await requireAdmin();

  const warung = String(formData.get("warung") ?? "").trim() || null;
  const dish = String(formData.get("dish") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const subDishesRaw = String(formData.get("subDishes") ?? "").trim();
  const subDishes = parseSubDishes(subDishesRaw);

  if (!dish) return { error: id.errors.dishRequired };

  const settings = await getSettings();
  const dishes = parseDefaultDishes(settings.defaultDishes);
  const key = normalizeDishKey(dish);
  if (dishes.some((d) => normalizeDishKey(d.name) === key)) {
    return { error: id.errors.dishExists };
  }

  await db.settings.update({
    where: { id: "singleton" },
    data: { defaultDishes: [...dishes, { warung, name: dish, note, subDishes }] },
  });

  revalidatePath("/settings");
  revalidatePath("/yono");
  revalidatePath("/home");
  revalidatePath("/preferences");
  return { ok: true };
}

export async function updateDefaultDishAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const originalDish = String(formData.get("originalDish") ?? "").trim();
  const warung = String(formData.get("warung") ?? "").trim() || null;
  const dish = String(formData.get("dish") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;
  const subDishesRaw = String(formData.get("subDishes") ?? "").trim();
  const subDishes = parseSubDishes(subDishesRaw);

  if (!originalDish || !dish) return { error: id.errors.dishRequired };

  const settings = await getSettings();
  const dishes = parseDefaultDishes(settings.defaultDishes);
  const origKey = normalizeDishKey(originalDish);
  const targetIndex = dishes.findIndex((d) => normalizeDishKey(d.name) === origKey);

  if (targetIndex === -1) {
    return { error: id.errors.dishNotFound };
  }

  const newKey = normalizeDishKey(dish);
  const duplicate = dishes.some(
    (d, idx) => idx !== targetIndex && normalizeDishKey(d.name) === newKey
  );
  if (duplicate) {
    return { error: id.errors.dishExists };
  }

  const nextDishes = [...dishes];
  nextDishes[targetIndex] = { warung, name: dish, note, subDishes };

  await db.settings.update({
    where: { id: "singleton" },
    data: { defaultDishes: nextDishes },
  });

  if (newKey !== origKey) {
    await db.dishPreference.updateMany({
      where: { forDish: origKey },
      data: { forDish: newKey },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/yono");
  revalidatePath("/home");
  revalidatePath("/preferences");
  return { ok: true };
}

export async function removeDefaultDishAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const dish = String(formData.get("dish") ?? "").trim();
  if (!dish) return { error: id.errors.dishRequired };

  const settings = await getSettings();
  const dishes = parseDefaultDishes(settings.defaultDishes);
  const key = normalizeDishKey(dish);
  const next = dishes.filter((d) => normalizeDishKey(d.name) !== key);

  await db.settings.update({
    where: { id: "singleton" },
    data: { defaultDishes: next },
  });

  await db.dishPreference.deleteMany({ where: { forDish: key } });

  revalidatePath("/settings");
  revalidatePath("/yono");
  revalidatePath("/home");
  revalidatePath("/preferences");
  return { ok: true };
}