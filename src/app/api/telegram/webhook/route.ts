import { NextResponse } from "next/server";
import { escapeHtml, sendTelegramMessage } from "@/lib/telegram";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "yono-catering-telegram-webhook",
    status: "active",
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

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
      "Silakan salin ID di atas dan berikan ke Admin katering agar akunmu terhubung dengan notifikasi menu harian dan pengingat makan siang.",
    ].join("\n");

    await sendTelegramMessage(chatId, replyText);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error pada telegram webhook handler:", err);
    // Return 200 OK so Telegram does not continually retry a failing update
    return NextResponse.json({ ok: true, error: String(err) });
  }
}
