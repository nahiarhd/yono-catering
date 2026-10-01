export type WhatsAppOrder = {
  name: string;
  dish?: string;
  addOns?: string | null;
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
  addOnBreakdown?: Array<{ name: string; count: number }>;
  totalPortions: number;
  orders?: WhatsAppOrder[];
  pendingMembers?: string[];
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
  const eating = (payload.orders ?? []).filter((o) => o.wants !== false);
  if (eating.length > 0) {
    const portionCounts = new Map<string, number>();
    for (const o of eating) {
      const dish = o.dish?.trim() || payload.dish;
      const dishLabel = dish !== payload.dish ? (dish.startsWith("(") ? dish : `(${dish})`) : dish;
      const addOns = o.addOns?.trim() ? ` [+ ${o.addOns.trim()}]` : "";
      const note = o.note?.trim() ? ` [Catatan: ${o.note.trim()}]` : "";
      const key = `${dishLabel}${addOns}${note}`;
      portionCounts.set(key, (portionCounts.get(key) ?? 0) + 1);
    }
    for (const [item, count] of portionCounts.entries()) {
      lines.push(`• ${item}: ${count} porsi`);
    }
  } else if (payload.breakdown && payload.breakdown.length > 0) {
    for (const item of payload.breakdown) {
      lines.push(`• ${item.dish}: ${item.count} porsi`);
    }
  } else {
    lines.push("• Belum ada pesanan masuk");
  }
  lines.push(`*Total: ${payload.totalPortions} porsi*`);

  if (payload.addOnBreakdown && payload.addOnBreakdown.length > 0) {
    lines.push("");
    lines.push("*TAMBAHAN / ADD-ON:*");
    for (const item of payload.addOnBreakdown) {
      lines.push(`• ${item.name}: ${item.count} porsi`);
    }
  }
  lines.push("");
  lines.push("Terima kasih! Dapur Pak Yono");

  return lines.join("\n");
}

export function buildWhatsAppUrl(message: string): string {
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}
