import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";
import { getBotUsername, isUnreachable } from "./telegram";

export type TelegramStatus = "none" | "failed" | "ok";

export function telegramStatus(u: { telegramChatId: string | null; telegramFailedAt: Date | null }): TelegramStatus {
  if (!u.telegramChatId) return "none";
  return u.telegramFailedAt ? "failed" : "ok";
}

function linkSig(userId: string): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return createHmac("sha256", secret).update(`tg-link:${userId}`).digest("base64url").slice(0, 22);
}

// shortcut: the link never expires and anyone holding it can link their Telegram to this account; add a nonce column if links leak
/** t.me deep link that sends `/start <payload>`; the webhook links that chat to this user. */
export function telegramLinkUrl(userId: string): string {
  return `https://t.me/${getBotUsername()}?start=${userId}_${linkSig(userId)}`;
}

/** The user id a /start payload was signed for, or null when it was not made by telegramLinkUrl. */
export function verifyTelegramLinkPayload(payload: string): string | null {
  // cuid ids never contain "_", but the base64url signature can, so split on the first one
  const at = payload.indexOf("_");
  if (at <= 0) return null;
  const userId = payload.slice(0, at);
  const sig = Buffer.from(payload.slice(at + 1));
  const expected = Buffer.from(linkSig(userId));
  return sig.length === expected.length && timingSafeEqual(sig, expected) ? userId : null;
}

/** Keeps telegramFailedAt in step with the latest send so the users page shows who cannot be reached. */
export async function recordTelegramDelivery(reached: string[], unreachable: string[]) {
  await db.$transaction([
    db.user.updateMany({ where: { telegramChatId: { in: reached } }, data: { telegramFailedAt: null } }),
    db.user.updateMany({ where: { telegramChatId: { in: unreachable } }, data: { telegramFailedAt: new Date() } }),
  ]);
}

/**
 * Probes every linked chat with an invisible "typing" action: it fails exactly when a message would
 * (never started, blocked), without sending anything.
 */
export async function checkTelegramReachability(): Promise<{ ok: number; failed: number } | { error: string }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { error: "TELEGRAM_BOT_TOKEN belum diatur di server." };

  // Bounded by headcount of one office
  const users = await db.user.findMany({
    where: { telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  const chatIds = [...new Set(users.map((u) => u.telegramChatId!))];

  const results = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, action: "typing" }),
      });
      const data = await res.json();
      return data.ok ? "ok" : isUnreachable(String(data.description)) ? "unreachable" : "error";
    }),
  );

  const reached = chatIds.filter((_, i) => results[i].status === "fulfilled" && results[i].value === "ok");
  const unreachable = chatIds.filter(
    (_, i) => results[i].status === "fulfilled" && results[i].value === "unreachable",
  );
  await recordTelegramDelivery(reached, unreachable);
  return { ok: reached.length, failed: chatIds.length - reached.length };
}
