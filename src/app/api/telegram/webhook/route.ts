import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canOrder } from "@/lib/auth";
import { effectiveCutoff, isResponsesLocked } from "@/lib/cutoff";
import { todayKey } from "@/lib/dates";
import { id } from "@/lib/id";
import { getMenuDay, saveResponse } from "@/lib/menu-data";
import { broadcastRealtime } from "@/lib/realtime";
import { callTelegram, escapeHtml, sendTelegramMessage } from "@/lib/telegram";
import { verifyTelegramLinkPayload } from "@/lib/telegram-status";
import {
  decodeOrder,
  orderSelection,
  renderOrderScreen,
  renderSavedScreen,
  renderWarungScreen,
  type InlineKeyboard,
} from "@/lib/telegram-order";

type CallbackQuery = {
  id: string;
  from: { id: number };
  data?: string;
  message?: { message_id: number; chat: { id: number } };
};

async function handleOrderCallback(cq: CallbackQuery) {
  // Alert is the only reply Telegram shows without touching the message, so errors go there
  const alert = (text: string) =>
    callTelegram("answerCallbackQuery", { callback_query_id: cq.id, text, show_alert: true });
  const show = async (screen: { text: string; keyboard: InlineKeyboard }) => {
    await callTelegram("editMessageText", {
      chat_id: cq.message!.chat.id,
      message_id: cq.message!.message_id,
      text: screen.text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: { inline_keyboard: screen.keyboard },
    });
    await callTelegram("answerCallbackQuery", { callback_query_id: cq.id });
  };

  const parsed = decodeOrder(cq.data ?? "");
  if (!parsed || !cq.message) return alert("Tombol ini sudah tidak berlaku.");
  const { state, save } = parsed;

  // from.id is set by Telegram, not the client, so it is the trusted identity here
  const users = await db.user.findMany({
    where: { telegramChatId: String(cq.from.id) },
    select: { id: true, role: true },
    take: 2,
  });
  if (users.length === 0) return alert("Akun Telegram ini belum terhubung. Kirim /start lalu berikan Chat ID ke Admin.");
  if (users.length > 1) return alert("Chat ID ini terhubung ke lebih dari satu akun. Minta Admin memperbaikinya.");
  const user = users[0];
  if (!canOrder(user)) return alert(id.errors.cannotOrder);

  if (state.date < todayKey()) return alert("Menu ini sudah lewat.");
  const { menus, settings } = await getMenuDay(state.date);
  if (menus.length === 0) return alert(id.errors.noMenu);
  if (state.menu === undefined && menus.length > 1) {
    const at = menus.find((m) => m.responses.some((r) => r.userId === user.id));
    const response = at?.responses.find((r) => r.userId === user.id);
    return show(renderWarungScreen(menus, state, at && response ? { menu: at, response } : null));
  }
  const menu = menus[state.menu ?? 0];
  if (!menu) return alert("Tombol ini sudah tidak berlaku.");
  if (isResponsesLocked(state.date, settings.standingCutoff, menu.cutoffOverride)) return alert(id.errors.locked);
  const current = menu.responses.find((r) => r.userId === user.id) ?? null;

  if (!save) return show(renderOrderScreen(menu, state, current));

  // shortcut: warung/dish indexes are read against today's menus at save time; if Yono edits the menu mid-flow the pick can shift. Upgrade by putting a menu version in callback_data if that happens.
  const picked = orderSelection(menu, state);
  if (!picked) return show(renderOrderScreen(menu, { ...state, wants: undefined }, current));

  await saveResponse(menu, user.id, picked);
  revalidatePath("/home");
  broadcastRealtime("revalidate");

  const cutoff = effectiveCutoff(settings.standingCutoff, menu.cutoffOverride);
  return show(renderSavedScreen(menu, picked, state.date, cutoff));
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "yono-catering-telegram-webhook",
    status: "active",
  });
}

export async function POST(request: Request) {
  // Same value as `secret_token` passed to Telegram's setWebhook
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (body?.callback_query) {
      await handleOrderCallback(body.callback_query);
      return NextResponse.json({ ok: true });
    }

    const message = body?.message;
    if (!message || !message.chat?.id) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const chatId = String(message.chat.id);
    const firstName = message.from?.first_name || message.chat.first_name || "kamu";
    const safeName = escapeHtml(firstName);

    // "/start <payload>" comes from the link on the Pengaturan/Pengguna page
    const startPayload = /^\/start\s+(\S+)/.exec(String(message.text ?? ""))?.[1];
    const linkUserId = startPayload && message.chat.type === "private" ? verifyTelegramLinkPayload(startPayload) : null;
    const linkUser = linkUserId
      ? await db.user.findUnique({ where: { id: linkUserId }, select: { id: true, name: true } })
      : null;
    if (linkUser) {
      // One chat belongs to one account, or the order buttons cannot tell who is ordering
      await db.$transaction([
        db.user.updateMany({
          where: { telegramChatId: chatId, id: { not: linkUser.id } },
          data: { telegramChatId: null },
        }),
        db.user.update({
          where: { id: linkUser.id },
          data: { telegramChatId: chatId, telegramFailedAt: null },
        }),
      ]);
      revalidatePath("/users");
      revalidatePath("/settings");
      await sendTelegramMessage(
        chatId,
        `Halo <b>${safeName}</b>! Telegram kamu sudah terhubung ke akun <b>${escapeHtml(linkUser.name)}</b>. Menu dan pengingat makan malam akan dikirim ke sini.`,
      );
      return NextResponse.json({ ok: true });
    }

    const replyText = [
      `Halo <b>${safeName}</b>! 👋`,
      "",
      "Chat ID Telegram kamu adalah:",
      `<code>${chatId}</code>`,
      "",
      "Silakan salin ID di atas dan berikan ke Admin katering agar akunmu terhubung dengan notifikasi menu harian dan pengingat makan malam.",
      "Oh iya untuk PIN di web:",
      `<code> <b>1234</b> </code>`,
      "Bisa di reset kok hehe di pengaturan ya!!"
    ].join("\n");

    await sendTelegramMessage(chatId, replyText);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error pada telegram webhook handler:", err);
    // Return 200 OK so Telegram does not continually retry a failing update
    return NextResponse.json({ ok: true, error: String(err) });
  }
}
