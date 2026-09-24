import assert from "assert";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "../whatsapp";

function testAllAnswered() {
  const msg = buildWhatsAppMessage({
    dateDisplay: "Kamis, 24 September 2026",
    dish: "Ayam Bakar Madu",
    note: "Pilihan ganti: Telur Balado",
    cutoff: "08:00",
    breakdown: [
      { dish: "Ayam Bakar Madu", count: 2 },
      { dish: "Telur Balado", count: 1 },
    ],
    totalPortions: 3,
    orders: [
      { name: "Raihan", dish: "Ayam Bakar Madu", isSwap: false, note: "Porsi banyak" },
      { name: "Iqbal", dish: "Telur Balado", isSwap: true, note: "Sambal pisah" },
      { name: "Pak Yono", dish: "Ayam Bakar Madu", isSwap: false, note: null },
    ],
    pendingMembers: [],
  });

  assert.ok(msg.includes("*REKAP KATERING PAK YONO*"));
  assert.ok(msg.includes("Menu Utama: *Ayam Bakar Madu*"));
  assert.ok(msg.includes("Catatan Menu: Pilihan ganti: Telur Balado"));
  assert.ok(msg.includes("• Ayam Bakar Madu: 2 porsi"));
  assert.ok(msg.includes("• Telur Balado: 1 porsi"));
  assert.ok(msg.includes("*Total: 3 porsi*"));
  assert.ok(msg.includes("1. Raihan: Ayam Bakar Madu [Catatan: Porsi banyak]"));
  assert.ok(msg.includes("2. Iqbal: Telur Balado (Ganti) [Catatan: Sambal pisah]"));
  assert.ok(!msg.includes("BELUM MEMILIH"));
  assert.ok(!msg.includes("—"), "Must not contain em dash");

  const url = buildWhatsAppUrl(msg);
  assert.ok(url.startsWith("https://api.whatsapp.com/send?text="));
  assert.ok(url.includes("REKAP"));
}

function testWithPendingMembers() {
  const msg = buildWhatsAppMessage({
    dateDisplay: "Kamis, 24 September 2026",
    dish: "Bebek Goreng",
    note: null,
    cutoff: "08:00",
    breakdown: [{ dish: "Bebek Goreng", count: 1 }],
    totalPortions: 1,
    orders: [{ name: "Raihan", dish: "Bebek Goreng", isSwap: false, note: null }],
    pendingMembers: ["Iqbal", "Budi"],
  });

  assert.ok(msg.includes("*BELUM MEMILIH (2 orang):*"));
  assert.ok(msg.includes("• Iqbal"));
  assert.ok(msg.includes("• Budi"));
  assert.ok(!msg.includes("—"), "Must not contain em dash");
}

function testEmptyOrders() {
  const msg = buildWhatsAppMessage({
    dateDisplay: "Jumat, 25 September 2026",
    dish: "Soto Betawi",
    note: null,
    cutoff: null,
    breakdown: [],
    totalPortions: 0,
    orders: [],
    pendingMembers: ["Raihan", "Iqbal"],
  });

  assert.ok(msg.includes("Belum ada pesanan masuk"));
  assert.ok(msg.includes("(Belum ada anggota yang memilih)"));
  assert.ok(msg.includes("*BELUM MEMILIH (2 orang):*"));
  assert.ok(!msg.includes("—"), "Must not contain em dash");
}

testAllAnswered();
testWithPendingMembers();
testEmptyOrders();
console.log("whatsapp.test.ts ok");
