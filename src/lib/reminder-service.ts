import { db } from "@/lib/db";
import { nowInHousehold, parseDateKey, todayKey } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { parseHHMM, effectiveCutoff } from "@/lib/cutoff";
import { sendPush } from "@/lib/push";
import {
  getAppUrl,
  formatReminderMessage,
  sendTelegramMessage,
} from "@/lib/telegram";

export interface ReminderResult {
  triggered: boolean;
  reason?: string;
  sentCount?: number;
  failedCount?: number;
  totalPending?: number;
}

export async function checkAndSendReminders(options?: {
  force?: boolean;
}): Promise<ReminderResult> {
  const force = options?.force ?? false;
  const settings = await getSettings();
  const dateKey = todayKey();

  const menu = await db.menu.findUnique({
    where: { date: parseDateKey(dateKey) },
    include: {
      responses: {
        select: { userId: true },
      },
    },
  });

  const appUrl = getAppUrl();

  // Jika belum ada menu hari ini
  if (!menu) {
    return {
      triggered: false,
      reason: "Menu hari ini belum diposting oleh Pak Yono.",
    };
  }

  // Jika tidak dipaksa dan pengingat hari ini sudah pernah terkirim
  if (!force && menu.reminderSentAt) {
    return {
      triggered: false,
      reason: `Pengingat hari ini sudah dikirim pada ${nowInHousehold(menu.reminderSentAt).hhmm} WIB.`,
    };
  }

  const cutoff = effectiveCutoff(settings.standingCutoff, menu.cutoffOverride);
  const parsedCutoff = parseHHMM(cutoff);
  const parsedReminder = parseHHMM(settings.reminderTime);
  const household = nowInHousehold();
  const nowMinutes = household.hours * 60 + household.minutes;

  // Pengecekan jam jika tidak dipaksa
  if (!force && parsedReminder && parsedCutoff) {
    const reminderMinutes = parsedReminder.hours * 60 + parsedReminder.minutes;
    const cutoffMinutes = parsedCutoff.hours * 60 + parsedCutoff.minutes;

    if (nowMinutes < reminderMinutes) {
      return {
        triggered: false,
        reason: `Belum waktunya pengingat (Dijadwalkan: ${settings.reminderTime} WIB, Sekarang: ${household.hhmm} WIB).`,
      };
    }

    if (nowMinutes >= cutoffMinutes) {
      return {
        triggered: false,
        reason: `Sudah melewati batas waktu katering (${cutoff} WIB).`,
      };
    }
  }

  // Klaim atomik sebelum kirim: scheduler 30 detik dan tombol tes bisa jalan bersamaan
  const claimed = await db.menu.updateMany({
    where: force ? { id: menu.id } : { id: menu.id, reminderSentAt: null },
    data: { reminderSentAt: new Date() },
  });
  if (claimed.count === 0) {
    return { triggered: false, reason: "Pengingat hari ini sedang/sudah dikirim." };
  }

  const respondedUserIds = new Set(menu.responses.map((r) => r.userId));
  const pendingMembers = await db.user.findMany({
    where: {
      role: { not: "yono" },
      id: { notIn: Array.from(respondedUserIds) },
    },
    select: { id: true, name: true, telegramChatId: true },
  });

  // Jika semua sudah merespons
  if (pendingMembers.length === 0) {
    return {
      triggered: true,
      sentCount: 0,
      totalPending: 0,
      reason: "Semua anggota sudah memilih menu hari ini.",
    };
  }

  // 1. Kirim Web Push (jika tersedia)
  try {
    await sendPush(
      pendingMembers.map((m) => m.id),
      {
        title: "Pengingat Katering Pak Yono",
        body: `Jangan lupa tentukan pilihan menu ${menu.dish} sebelum ${cutoff} WIB.`,
        url: "/home",
      }
    );
  } catch (err) {
    console.error("Gagal mengirim web push pengingat:", err);
  }

  // 2. Kirim pesan Telegram personal ke anggota yang memiliki Telegram Chat ID
  const withTelegram = pendingMembers.filter(
    (m) => m.telegramChatId && m.telegramChatId.trim().length > 0
  );

  let sentCount = 0;
  let failedCount = 0;

  if (withTelegram.length > 0) {
    const results = await Promise.allSettled(
      withTelegram.map((m) => {
        const text = formatReminderMessage({
          name: m.name,
          dish: menu.dish,
          cutoff,
          appUrl,
        });
        return sendTelegramMessage(m.telegramChatId!, text);
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value.ok) {
        sentCount++;
      } else {
        failedCount++;
      }
    }
  }

  return {
    triggered: true,
    sentCount,
    failedCount,
    totalPending: pendingMembers.length,
  };
}
