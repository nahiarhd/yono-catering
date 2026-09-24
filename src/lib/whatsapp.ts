export type WhatsAppOrder = {
  name: string;
  dish: string;
  isSwap: boolean;
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
  if (payload.cutoff?.trim()) {
    lines.push(`Batas Waktu: ${payload.cutoff.trim()}`);
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

  lines.push(`*DAFTAR PESANAN (${payload.orders.length} orang):*`);
  if (payload.orders.length > 0) {
    payload.orders.forEach((o, i) => {
      const type = o.isSwap ? " (Ganti)" : "";
      const note = o.note?.trim() ? ` [Catatan: ${o.note.trim()}]` : "";
      lines.push(`${i + 1}. ${o.name}: ${o.dish}${type}${note}`);
    });
  } else {
    lines.push("(Belum ada anggota yang memilih)");
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
