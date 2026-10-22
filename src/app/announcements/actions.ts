"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireStrictAdmin } from "@/lib/auth";
import { id } from "@/lib/id";
import {
  getAppUrl,
  formatAnnouncementMessage,
  sendTelegramBroadcast,
} from "@/lib/telegram";
import { recordTelegramDelivery } from "@/lib/telegram-status";

export type AnnouncementActionState = {
  ok?: boolean;
  error?: string;
  sentCount?: number;
  failedCount?: number;
};

export async function sendAnnouncementAction(
  _prev: AnnouncementActionState,
  formData: FormData
): Promise<AnnouncementActionState> {
  const admin = await requireStrictAdmin();

  const title = String(formData.get("title") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();

  if (!message || message.length < 3) {
    return { ok: false, error: id.announcements.errorEmpty };
  }

  const activeMembers = await db.user.findMany({
    where: {
      active: true,
      telegramChatId: { not: null },
    },
    select: { id: true, telegramChatId: true },
  });

  const chatIds = activeMembers
    .map((m) => m.telegramChatId?.trim())
    .filter((cid): cid is string => Boolean(cid && cid.length > 0));

  if (chatIds.length === 0) {
    return {
      ok: false,
      error: id.announcements.noRecipients,
    };
  }

  const appUrl = getAppUrl();
  const broadcastText = formatAnnouncementMessage({
    title,
    message,
    appUrl,
  });

  let sentCount = 0;
  let failedCount = 0;

  try {
    const sent = await sendTelegramBroadcast(chatIds, broadcastText);
    sentCount = sent.sentCount;
    failedCount = sent.failedCount;
    await recordTelegramDelivery(sent.reached, sent.unreachable);
  } catch (err) {
    console.error("Gagal mengirim broadcast pengumuman:", err);
    return {
      ok: false,
      error: id.announcements.errorFailed,
    };
  }

  await db.announcement.create({
    data: {
      title,
      message,
      sentCount,
      failedCount,
      authorId: admin.id,
    },
  });

  revalidatePath("/announcements");
  return {
    ok: true,
    sentCount,
    failedCount,
  };
}

export async function deleteAnnouncementAction(
  announcementId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireStrictAdmin();
  try {
    await db.announcement.delete({ where: { id: announcementId } });
    revalidatePath("/announcements");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
