"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireYono } from "@/lib/auth";
import { parseHHMM, effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay, saveResponse, upsertMenu } from "@/lib/menu-data";
import { getSettings } from "@/lib/settings";
import { todayKey } from "@/lib/dates";
import { id } from "@/lib/id";

import {
  getAppUrl,
  formatMenuBroadcastMessage,
  formatReminderMessage,
  sendTelegramBroadcast,
  sendTelegramMessage,
} from "@/lib/telegram";

import { flattenDishOptions, parseDishOptions, resolveMenuSelection } from "@/lib/dishes";
import { orderEntryKeyboard } from "@/lib/telegram-order";
import { broadcastRealtime } from "@/lib/realtime";
import { recordTelegramDelivery } from "@/lib/telegram-status";

export type ActionState = { error?: string; ok?: boolean; menuId?: string };

export async function postMenuAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const dateKey = String(formData.get("dateKey") ?? "");
  const menuId = String(formData.get("menuId") ?? "").trim() || null;
  const dishOptions = parseDishOptions(String(formData.get("dishOptions") ?? ""));
  const { dish, subDishes, addOns } = flattenDishOptions(dishOptions);
  // Same fallback as the preset cards: no warung name means the dish names the warung
  const vendor = String(formData.get("vendor") ?? "").trim() || dish;
  const menuNote = String(formData.get("menuNote") ?? "").trim() || null;
  const cutoffRaw = String(formData.get("cutoffOverride") ?? "").trim();
  const cutoffOverride = cutoffRaw ? cutoffRaw : null;

  if (!dateKey || dateKey < todayKey()) return { error: id.errors.missingDay };
  if (!dish) return { error: id.errors.dishRequired };
  if (cutoffOverride && !parseHHMM(cutoffOverride)) {
    return { error: id.errors.cutoffFormat };
  }

  const settings = await getSettings();
  const { menus } = await getMenuDay(dateKey);
  if (menus.some((m) => m.vendor === vendor && m.id !== menuId)) {
    return { error: id.errors.vendorTaken };
  }
  const isNew = !menuId && !menus.some((m) => m.vendor === vendor);
  const saved = await upsertMenu(dateKey, menuId, {
    vendor,
    dish,
    subDishes,
    addOns,
    dishOptions,
    note: menuNote,
    cutoffOverride,
  });

  if (isNew) {
    const cutoff = effectiveCutoff(settings.standingCutoff, cutoffOverride);
    const members = await db.user.findMany({
      where: { role: { not: "yono" }, active: true },
      select: { telegramChatId: true },
    });

    const telegramChatIds = members
      .map((m) => m.telegramChatId)
      .filter((cid): cid is string => Boolean(cid && cid.trim()));

    if (telegramChatIds.length > 0) {
      try {
        const broadcastText = formatMenuBroadcastMessage({
          dish,
          subDishes,
          addOns,
          cutoff,
          note: menuNote,
          appUrl: getAppUrl(),
        });
        const sent = await sendTelegramBroadcast(telegramChatIds, broadcastText, {
          inline_keyboard: orderEntryKeyboard(dateKey, getAppUrl()),
        });
        await recordTelegramDelivery(sent.reached, sent.unreachable);
      } catch (err) {
        console.error("Gagal mengirim broadcast Telegram:", err);
      }
    }
  }

  revalidatePath("/yono");
  revalidatePath("/home");
  broadcastRealtime("revalidate");
  return { ok: true, menuId: saved.id };
}

export async function pingTelegramRemindersAction(
  dateKey: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  await requireYono();

  const { menu, menus, settings } = await getMenuDay(dateKey);
  if (!menu) {
    return { ok: false, error: id.errors.noMenu };
  }

  const cutoff = effectiveCutoff(settings.standingCutoff, menu.cutoffOverride);
  const appUrl = getAppUrl();

  // Answering any warung counts as answered for the day
  const respondedUserIds = new Set(menus.flatMap((m) => m.responses.map((r) => r.userId)));

  const pendingMembers = await db.user.findMany({
    where: {
      role: { not: "yono" },
      active: true,
      id: { notIn: Array.from(respondedUserIds) },
      telegramChatId: { not: null },
    },
    select: { id: true, name: true, telegramChatId: true },
  });

  const validMembers = pendingMembers.filter(
    (m) => m.telegramChatId && m.telegramChatId.trim().length > 0
  );

  if (validMembers.length === 0) {
    return {
      ok: false,
      error: id.yono.pingTelegramEmpty,
    };
  }

  const results = await Promise.allSettled(
    validMembers.map((m) => {
      const text = formatReminderMessage({
        name: m.name,
        dish: menus.map((m) => m.dish).join(" / "),
        cutoff,
        appUrl,
      });
      return sendTelegramMessage(m.telegramChatId!, text, {
        replyMarkup: { inline_keyboard: orderEntryKeyboard(dateKey, appUrl) },
      });
    })
  );

  let sent = 0;
  const failureReasons: string[] = [];
  const reached: string[] = [];
  const unreachable: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const m = validMembers[i];
    if (r.status === "fulfilled" && r.value.ok) {
      sent++;
      reached.push(m.telegramChatId!);
    } else {
      if (r.status === "fulfilled" && r.value.unreachable) unreachable.push(m.telegramChatId!);
      const err =
        r.status === "fulfilled"
          ? r.value.error || "Gagal"
          : String((r as PromiseRejectedResult).reason);
      failureReasons.push(`${m.name}: ${err}`);
    }
  }

  await recordTelegramDelivery(reached, unreachable);

  if (sent === 0) {
    const firstReason = failureReasons[0] || "Pesan gagal terkirim";
    return {
      ok: false,
      error: `Pengingat gagal dikirim (${firstReason})`,
    };
  }

  if (failureReasons.length > 0) {
    return {
      ok: true,
      count: sent,
      error: `Terkirim ke ${sent} orang. Gagal ke ${failureReasons.length} orang (${failureReasons[0]}).`,
    };
  }

  return { ok: true, count: sent };
}

export async function recordMemberResponseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const dateKey = String(formData.get("dateKey") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const wantsRaw = String(formData.get("wants") ?? "yes");
  const wants = wantsRaw === "yes";
  const selectedDish = String(formData.get("selectedDish") ?? "").trim();
  const selectedVariant = String(formData.get("selectedVariant") ?? "").trim();
  const addOnsRaw = String(formData.get("addOns") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!dateKey || !userId) {
    return { error: "Data anggota tidak lengkap." };
  }

  const { menu } = await getMenuDay(dateKey, String(formData.get("menuId") ?? ""));
  if (!menu) {
    return { error: id.errors.noMenu };
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser) {
    return { error: id.errors.memberNotFound };
  }

  let swapDish: string | null = null;
  let addOns: string | null = null;
  if (wants) {
    const selection = resolveMenuSelection(menu, { selectedDish, selectedVariant, addOns: addOnsRaw });
    if (selection === "dishRequired") return { error: "Silakan pilih salah satu menu masakan." };
    if (selection === "variantRequired") return { error: id.response.variantRequired };
    ({ swapDish, addOns } = selection);
  }

  await saveResponse(menu, userId, {
    wants,
    swapDish,
    addOns,
    note,
  });

  revalidatePath("/yono");
  revalidatePath("/home");
  broadcastRealtime("revalidate");
  return { ok: true };
}

export async function resetMemberResponseAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const dateKey = String(formData.get("dateKey") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();

  if (!dateKey || !userId) {
    return { error: "Data anggota tidak lengkap." };
  }

  const { menu } = await getMenuDay(dateKey, String(formData.get("menuId") ?? ""));
  if (!menu) {
    return { error: id.errors.noMenu };
  }

  await db.response.deleteMany({
    where: {
      menuId: menu.id,
      userId,
    },
  });

  revalidatePath("/yono");
  revalidatePath("/home");
  broadcastRealtime("revalidate");
  return { ok: true };
}