import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nowInHousehold, parseDateKey, todayKey } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { effectiveCutoff } from "@/lib/cutoff";
import { deletePastMenus } from "@/lib/menu-data";
import { sendPush } from "@/lib/push";
import { id } from "@/lib/id";
import {
  getAppUrl,
  formatReminderMessage,
  sendTelegramMessage,
} from "@/lib/telegram";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  await deletePastMenus();
  const { hhmm } = nowInHousehold();
  if (hhmm !== settings.reminderTime) {
    return NextResponse.json({ skipped: true, now: hhmm, expected: settings.reminderTime });
  }

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

  if (!menu) {
    const yono = await db.user.findFirst({
      where: { role: "yono" },
      select: { id: true, telegramChatId: true },
    });
    if (yono) {
      await sendPush([yono.id], {
        title: id.push.morningTitle,
        body: id.push.morningBody,
        url: "/yono",
      });
      if (yono.telegramChatId) {
        await sendTelegramMessage(
          yono.telegramChatId,
          `👨‍🍳 <b>PENGINGAT PAK YONO</b>\n\nSelamat pagi Pak Yono! Menu katering hari ini belum diposting.\nYuk posting menu sekarang:\n👉 <a href="${appUrl}/yono">${appUrl}/yono</a>`
        );
      }
    }
  } else {
    const cutoff = effectiveCutoff(settings.standingCutoff, menu.cutoffOverride);
    const respondedUserIds = new Set(menu.responses.map((r) => r.userId));

    const pendingMembers = await db.user.findMany({
      where: {
        role: { not: "yono" },
        id: { notIn: Array.from(respondedUserIds) },
      },
      select: { id: true, name: true, telegramChatId: true },
    });

    if (pendingMembers.length > 0) {
      await sendPush(
        pendingMembers.map((m) => m.id),
        {
          title: "Pengingat Katering",
          body: `Jangan lupa isi pilihan menu ${menu.dish} sebelum ${cutoff}.`,
          url: "/home",
        }
      );

      const withTelegram = pendingMembers.filter(
        (m) => m.telegramChatId && m.telegramChatId.trim().length > 0
      );

      if (withTelegram.length > 0) {
        await Promise.allSettled(
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
      }
    }
  }

  return NextResponse.json({ ok: true });
}