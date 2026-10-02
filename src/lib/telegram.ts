export function getAppUrl(): string {
  const raw = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return raw.trim().replace(/\/+$/, "");
}

export function getBotUsername(): string {
  const raw = process.env.TELEGRAM_BOT_USERNAME || "yonocateringbot";
  return raw.trim().replace(/^@/, "");
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatMenuBroadcastMessage({
  dish,
  subDishes,
  addOns,
  cutoff,
  note,
  appUrl,
}: {
  dish: string;
  subDishes?: string | null;
  addOns?: string | null;
  cutoff: string;
  note?: string | null;
  appUrl: string;
}): string {
  const safeDish = escapeHtml(dish);
  const safeCutoff = escapeHtml(cutoff);
  const safeNote = note?.trim() ? escapeHtml(note.trim()) : null;
  const safeSubDishes = subDishes?.trim() ? escapeHtml(subDishes.trim()) : null;
  const safeAddOns = addOns?.trim() ? escapeHtml(addOns.trim()) : null;

  const lines = [
    "🔔 <b>MENU HARI INI DIPOSTING!</b>",
    "",
    `🍽️ Menu: <b>${safeDish}</b>`,
  ];

  if (safeSubDishes) {
    lines.push(`🍲 Pilihan Varian: <b>${safeSubDishes}</b>`);
  }

  if (safeAddOns) {
    lines.push(`🍳 Pilihan Add-on: <b>${safeAddOns}</b>`);
  }

  if (safeNote) {
    lines.push(`📝 Catatan: ${safeNote}`);
  }

  lines.push(`⏰ Batas Waktu: <b>${safeCutoff} WIB</b>`);
  lines.push("");
  lines.push("Yuk langsung pilih makan siang kamu sebelum batas waktu:");
  lines.push(`👉 <a href="${appUrl}/home">${appUrl}/home</a>`);

  return lines.join("\n");
}

export function formatReminderMessage({
  name,
  dish,
  cutoff,
  appUrl,
}: {
  name: string;
  dish: string;
  cutoff: string;
  appUrl: string;
}): string {
  const safeName = escapeHtml(name);
  const safeDish = escapeHtml(dish);
  const safeCutoff = escapeHtml(cutoff);

  const lines = [
    "⏳ <b>PENGINGAT KATERING PAK YONO</b>",
    "",
    `Halo <b>${safeName}</b>! Kamu belum menentukan pilihan menu katering hari ini (<b>${safeDish}</b>).`,
    `Batas waktu jawaban sampai jam <b>${safeCutoff} WIB</b>.`,
    "",
    "Jangan sampai kelewatan ya, tentukan pilihanmu sekarang di:",
    `👉 <a href="${appUrl}/home">${appUrl}/home</a>`,
  ];

  return lines.join("\n");
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: { parseMode?: "HTML" | "Markdown" }
): Promise<{ ok: boolean; error?: string; messageId?: number }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN tidak terkonfigurasi di environment.");
    return {
      ok: false,
      error: "TELEGRAM_BOT_TOKEN belum terbaca (pastikan sudah restart PM2 dengan --update-env)",
    };
  }

  const cleanChatId = chatId ? chatId.trim() : "";
  if (!cleanChatId) {
    return { ok: false, error: "Chat ID tidak valid (kosong)" };
  }

  if (!/^-?\d+$/.test(cleanChatId)) {
    return {
      ok: false,
      error: `Chat ID "${cleanChatId}" bukan angka. Telegram tidak bisa kirim ke @username. Buka @${getBotUsername()} dan ketik /start untuk melihat Chat ID angka.`,
    };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text,
        parse_mode: options?.parseMode ?? "HTML",
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      let desc: string = data.description || "Gagal mengirim pesan Telegram";
      if (desc.includes("bot can't initiate conversation")) {
        desc = `User belum pernah klik /start di bot @${getBotUsername()}`;
      } else if (desc.includes("chat not found")) {
        desc = `Chat ID "${cleanChatId}" tidak ditemukan di Telegram`;
      } else if (desc.includes("bot was blocked by the user")) {
        desc = "Bot diblokir oleh user";
      }
      return { ok: false, error: desc };
    }

    return { ok: true, messageId: data.result?.message_id };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

export async function sendTelegramBroadcast(
  chatIds: string[],
  text: string
): Promise<{ sentCount: number; failedCount: number }> {
  const validChatIds = Array.from(new Set(chatIds.map((c) => c.trim()).filter(Boolean)));
  if (validChatIds.length === 0) {
    return { sentCount: 0, failedCount: 0 };
  }

  let sentCount = 0;
  let failedCount = 0;

  const results = await Promise.allSettled(
    validChatIds.map((chatId) => sendTelegramMessage(chatId, text))
  );

  for (const r of results) {
    if (r.status === "fulfilled" && r.value.ok) {
      sentCount++;
    } else {
      failedCount++;
    }
  }

  return { sentCount, failedCount };
}
