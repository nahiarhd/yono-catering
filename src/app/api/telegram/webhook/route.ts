import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canOrder } from "@/lib/auth";
import { effectiveCutoff } from "@/lib/cutoff";
import { todayKey } from "@/lib/dates";
import { id } from "@/lib/id";
import { getMenuDay } from "@/lib/menu-data";
import { broadcastRealtime } from "@/lib/realtime";
import { callTelegram, escapeHtml, sendTelegramMessage } from "@/lib/telegram";
import {
  decodeOrder,
  orderSelection,
  renderOrderScreen,
  renderSavedScreen,
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
  const { menu, locked, settings } = await getMenuDay(state.date);
  if (!menu) return alert(id.errors.noMenu);
  if (locked) return alert(id.errors.locked);
  const current = menu.responses.find((r) => r.userId === user.id) ?? null;

  if (!save) return show(renderOrderScreen(menu, state, current));

  // shortcut: indexes are read against the menu at save time; if Yono edits the menu mid-flow the pick can shift. Upgrade by putting a menu version in callback_data if that happens.
  const picked = orderSelection(menu, state);
  if (!picked) return show(renderOrderScreen(menu, { ...state, wants: undefined }, current));

  await db.response.upsert({
    where: { menuId_userId: { menuId: menu.id, userId: user.id } },
    create: { menuId: menu.id, userId: user.id, ...picked, note: null },
    update: picked,
  });
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

    const replyText = [
      `Halo <b>${safeName}</b>! 👋`,
      "",
      "Chat ID Telegram kamu adalah:",
      `<code>${chatId}</code>`,
      "",
      "Silakan salin ID di atas dan berikan ke Admin katering agar akunmu terhubung dengan notifikasi menu harian dan pengingat makan malam.",
    ].join("\n");

    await sendTelegramMessage(chatId, replyText);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error pada telegram webhook handler:", err);
    // Return 200 OK so Telegram does not continually retry a failing update
    return NextResponse.json({ ok: true, error: String(err) });
  }
}
