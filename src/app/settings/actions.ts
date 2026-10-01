"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin, requireUser, verifyPin, hashPin } from "@/lib/auth";
import { parseHHMM } from "@/lib/cutoff";
import { normalizeDishKey, parseDefaultDishes, parseSubDishes, formatSubDishes } from "@/lib/dishes";
import { todayKey, parseDateKey } from "@/lib/dates";
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

  // Sinkronkan menu aktif hari ini dan ke depan agar langsung mengikuti batas waktu baru
  const today = parseDateKey(todayKey());
  await db.menu.updateMany({
    where: { date: { gte: today } },
    data: { cutoffOverride: null },
  });

  revalidatePath("/settings");
  revalidatePath("/home");
  revalidatePath("/yono");
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
  const addOnsRaw = String(formData.get("addOns") ?? "").trim();
  const addOns = parseSubDishes(addOnsRaw);

  if (!dish) return { error: id.errors.dishRequired };

  const settings = await getSettings();
  const dishes = parseDefaultDishes(settings.defaultDishes);
  const key = normalizeDishKey(dish);
  if (dishes.some((d) => normalizeDishKey(d.name) === key)) {
    return { error: id.errors.dishExists };
  }

  await db.settings.update({
    where: { id: "singleton" },
    data: { defaultDishes: [...dishes, { warung, name: dish, note, subDishes, addOns }] },
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
  const addOnsRaw = String(formData.get("addOns") ?? "").trim();
  const addOns = parseSubDishes(addOnsRaw);

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
  nextDishes[targetIndex] = { warung, name: dish, note, subDishes, addOns };

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

  // Synchronize today's posted menu if it matches the dish/warung being updated
  const today = todayKey();
  const todayDate = parseDateKey(today);
  const currentMenu = await db.menu.findUnique({ where: { date: todayDate } });
  if (currentMenu) {
    const currentDishNorm = normalizeDishKey(currentMenu.dish);
    const origWarung = dishes[targetIndex].warung;
    const matchesOrig = currentDishNorm === origKey;
    const matchesNew = currentDishNorm === newKey;
    const matchesWarung = warung && currentDishNorm === normalizeDishKey(warung);
    const matchesOrigWarung = origWarung && currentDishNorm === normalizeDishKey(origWarung);

    if (matchesOrig || matchesNew || matchesWarung || matchesOrigWarung) {
      await db.menu.update({
        where: { date: todayDate },
        data: {
          dish,
          subDishes: subDishes.length > 0 ? formatSubDishes(subDishes) : null,
          addOns: addOns.length > 0 ? formatSubDishes(addOns) : null,
          note,
        },
      });
    }
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

export async function testTelegramReminderAction(): Promise<ActionState> {
  await requireAdmin();
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return {
      ok: false,
      error: "TELEGRAM_BOT_TOKEN belum diset di file .env. Silakan atur token bot terlebih dahulu.",
    };
  }

  const { checkAndSendReminders } = await import("@/lib/reminder-service");
  const result = await checkAndSendReminders({ force: true });

  revalidatePath("/settings");
  revalidatePath("/yono");

  if (!result.triggered && result.reason) {
    return { ok: false, error: result.reason };
  }

  if (result.sentCount === 0 && result.totalPending && result.totalPending > 0) {
    return {
      ok: false,
      error: `Ada ${result.totalPending} anggota belum merespons, namun tidak ada yang memiliki Telegram Chat ID terdaftar di halaman Pengguna.`,
    };
  }

  return {
    ok: true,
    message: `Pengingat berhasil diproses. Terkirim ke ${result.sentCount ?? 0} orang (Gagal: ${result.failedCount ?? 0}).`,
  };
}