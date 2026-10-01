import assert from "assert";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "../whatsapp";

function testAllAnswered() {
  const msg = buildWhatsAppMessage({
    dateDisplay: "Kamis, 24 September 2026",
    dish: "Ayam Bakar Madu",
    note: "Porsi ekstra sambal",
    cutoff: "08:00",
    breakdown: [{ dish: "Ayam Bakar Madu", count: 2 }],
    totalPortions: 2,
    orders: [
      { name: "Raihan", wants: true, note: "Porsi banyak" },
      { name: "Iqbal", wants: false, note: "Bawa bekal" },
      { name: "Pak Yono", wants: true, note: null },
    ],
    pendingMembers: [],
  });

  assert.ok(msg.includes("*REKAP KATERING PAK YONO*"));
  assert.ok(msg.includes("Menu Utama: *Ayam Bakar Madu*"));
  assert.ok(msg.includes("Catatan Menu: Porsi ekstra sambal"));
  assert.ok(msg.includes("• Ayam Bakar Madu: 2 porsi"));
  assert.ok(msg.includes("*Total: 2 porsi*"));
  assert.ok(msg.includes("1. Raihan [Catatan: Porsi banyak]"));
  assert.ok(msg.includes("2. Pak Yono"));
  assert.ok(msg.includes("*TIDAK IKUT MAKAN (1 orang):*"));
  assert.ok(msg.includes("• Iqbal [Catatan: Bawa bekal]"));
  assert.ok(!msg.includes("BELUM MEMILIH"));
  assert.ok(!msg.includes("Batas Waktu"));
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
  assert.ok(msg.includes("(Belum ada yang ikut makan)"));
  assert.ok(msg.includes("*BELUM MEMILIH (2 orang):*"));
  assert.ok(!msg.includes("—"), "Must not contain em dash");
}

function testWithSubDishes() {
  const msg = buildWhatsAppMessage({
    dateDisplay: "Jumat, 25 September 2026",
    dish: "Bakmi Jogja",
    note: null,
    cutoff: "08:00",
    breakdown: [
      { dish: "Bakmi Goreng", count: 2 },
      { dish: "Nasi Goreng", count: 1 },
    ],
    totalPortions: 3,
    orders: [
      { name: "Raihan", dish: "Bakmi Goreng", wants: true, note: "Pedas" },
      { name: "Pram", dish: "Bakmi Goreng", wants: true, note: null },
      { name: "Iqbal", dish: "Nasi Goreng", wants: true, note: "Gak pedes" },
    ],
    pendingMembers: [],
  });

  assert.ok(msg.includes("• Bakmi Goreng: 2 porsi"));
  assert.ok(msg.includes("• Nasi Goreng: 1 porsi"));
  assert.ok(msg.includes("1. Raihan (Bakmi Goreng) [Catatan: Pedas]"));
  assert.ok(msg.includes("2. Pram (Bakmi Goreng)"));
  assert.ok(msg.includes("3. Iqbal (Nasi Goreng) [Catatan: Gak pedes]"));
  assert.ok(!msg.includes("—"), "Must not contain em dash");
}

function testWithAddOns() {
  const msg = buildWhatsAppMessage({
    dateDisplay: "Jumat, 25 September 2026",
    dish: "Ayam Geprek",
    note: null,
    cutoff: "08:00",
    breakdown: [{ dish: "Ayam Geprek", count: 2 }],
    addOnBreakdown: [
      { name: "Telor Dadar", count: 2 },
      { name: "Kerupuk", count: 1 },
    ],
    totalPortions: 2,
    orders: [
      { name: "Raihan", dish: "Ayam Geprek", addOns: "Telor Dadar, Kerupuk", wants: true, note: "Sambal banyak" },
      { name: "Pram", dish: "Ayam Geprek", addOns: "Telor Dadar", wants: true, note: null },
    ],
    pendingMembers: [],
  });

  assert.ok(msg.includes("*TAMBAHAN / ADD-ON:*"));
  assert.ok(msg.includes("• Telor Dadar: 2 porsi"));
  assert.ok(msg.includes("• Kerupuk: 1 porsi"));
  assert.ok(msg.includes("1. Raihan [+ Telor Dadar, Kerupuk] [Catatan: Sambal banyak]"));
  assert.ok(msg.includes("2. Pram [+ Telor Dadar]"));
}

testAllAnswered();
testWithPendingMembers();
testEmptyOrders();
testWithSubDishes();
testWithAddOns();
console.log("whatsapp.test.ts ok");
