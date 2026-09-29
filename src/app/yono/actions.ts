"use server";

import { db } from "@/lib/db";
import { requireYono } from "@/lib/auth";
import { parseHHMM, effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay, upsertMenu } from "@/lib/menu-data";
import { sendPush } from "@/lib/push";
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

export type ActionState = { error?: string; ok?: boolean };

export async function postMenuAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const dateKey = String(formData.get("dateKey") ?? "");
  const dish = String(formData.get("dish") ?? "").trim();
  const menuNote = String(formData.get("menuNote") ?? "").trim() || null;
  const cutoffRaw = String(formData.get("cutoffOverride") ?? "").trim();
  const cutoffOverride = cutoffRaw ? cutoffRaw : null;

  if (!dateKey || dateKey < todayKey()) return { error: id.errors.missingDay };
  if (!dish) return { error: id.errors.dishRequired };
  if (cutoffOverride && !parseHHMM(cutoffOverride)) {
    return { error: id.errors.cutoffFormat };
  }

  const settings = await getSettings();
  const existing = await getMenuDay(dateKey);
  const menu = await upsertMenu({
    dateKey,
    dish,
    note: menuNote,
    cutoffOverride,
  });

  if (!existing.menu) {
    const cutoff = effectiveCutoff(settings.standingCutoff, cutoffOverride);
    const members = await db.user.findMany({
      where: { role: { not: "yono" } },
      select: { id: true, telegramChatId: true },
    });
    await sendPush(members.map((m) => m.id), {
      title: id.push.menuTitle,
      body: id.push.menuBody(dish, cutoff),
      url: "/home",
    });

    const telegramChatIds = members
      .map((m) => m.telegramChatId)
      .filter((cid): cid is string => Boolean(cid && cid.trim()));

    if (telegramChatIds.length > 0) {
      try {
        const broadcastText = formatMenuBroadcastMessage({
          dish,
          cutoff,
          note: menuNote,
          appUrl: getAppUrl(),
        });
        await sendTelegramBroadcast(telegramChatIds, broadcastText);
      } catch (err) {
        console.error("Gagal mengirim broadcast Telegram:", err);
      }
    }
  }

  void menu;
  return { ok: true };
}

export async function pingTelegramRemindersAction(
  dateKey: string
): Promise<{ ok: boolean; count?: number; error?: string }> {
  await requireYono();

  const { menu, settings } = await getMenuDay(dateKey);
  if (!menu) {
    return { ok: false, error: id.errors.noMenu };
  }

  const cutoff = effectiveCutoff(settings.standingCutoff, menu.cutoffOverride);
  const appUrl = getAppUrl();

  const nonYonoResponses = menu.responses.filter((r) => r.user.role !== "yono");
  const respondedUserIds = new Set(nonYonoResponses.map((r) => r.userId));

  const pendingMembers = await db.user.findMany({
    where: {
      role: { not: "yono" },
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
        dish: menu.dish,
        cutoff,
        appUrl,
      });
      return sendTelegramMessage(m.telegramChatId!, text);
    })
  );

  let sent = 0;
  const failureReasons: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const m = validMembers[i];
    if (r.status === "fulfilled" && r.value.ok) {
      sent++;
    } else {
      const err =
        r.status === "fulfilled"
          ? r.value.error || "Gagal"
          : String((r as PromiseRejectedResult).reason);
      failureReasons.push(`${m.name}: ${err}`);
    }
  }

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