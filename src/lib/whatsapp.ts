export type WhatsAppOrder = {
  name: string;
  dish?: string;
  wants?: boolean;
  isSwap?: boolean;
  note: string | null;
};

export type WhatsAppPayload = {
  dateDisplay: string;
  dish: string;
  note?: string | null;
  cutoff?: string | null;
  breakdown: Array<{ dish: string; count: number }>;
  totalPortions: number;
  orders: WhatsAppOrder[];
  pendingMembers: string[];
};

export function buildWhatsAppMessage(payload: WhatsAppPayload): string {
  const lines: string[] = [];

  lines.push("*REKAP KATERING PAK YONO*");
  lines.push(`Tanggal: ${payload.dateDisplay}`);
  lines.push(`Menu Utama: *${payload.dish}*`);
  if (payload.note?.trim()) {
    lines.push(`Catatan Menu: ${payload.note.trim()}`);
  }
  lines.push("");

  lines.push("*RINGKASAN PORSI:*");
  if (payload.breakdown.length > 0) {
    for (const item of payload.breakdown) {
      lines.push(`• ${item.dish}: ${item.count} porsi`);
    }
  } else {
    lines.push("• Belum ada pesanan masuk");
  }
  lines.push(`*Total: ${payload.totalPortions} porsi*`);
  lines.push("");

  const eating = payload.orders.filter((o) => o.wants !== false);
  const notEating = payload.orders.filter((o) => o.wants === false);

  lines.push(`*DAFTAR IKUT MAKAN (${eating.length} orang):*`);
  if (eating.length > 0) {
    eating.forEach((o, i) => {
      const variant = o.dish && o.dish !== payload.dish ? ` (${o.dish})` : "";
      const note = o.note?.trim() ? ` [Catatan: ${o.note.trim()}]` : "";
      lines.push(`${i + 1}. ${o.name}${variant}${note}`);
    });
  } else {
    lines.push("(Belum ada yang ikut makan)");
  }

  if (notEating.length > 0) {
    lines.push("");
    lines.push(`*TIDAK IKUT MAKAN (${notEating.length} orang):*`);
    notEating.forEach((o) => {
      const note = o.note?.trim() ? ` [Catatan: ${o.note.trim()}]` : "";
      lines.push(`• ${o.name}${note}`);
    });
  }

  if (payload.pendingMembers.length > 0) {
    lines.push("");
    lines.push(`*BELUM MEMILIH (${payload.pendingMembers.length} orang):*`);
    payload.pendingMembers.forEach((name) => {
      lines.push(`• ${name}`);
    });
  }

  lines.push("");
  lines.push("Terima kasih! Dapur Pak Yono");

  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
