import assert from "assert";
import {
  decodeOrder,
  encodeOrder,
  orderEntryKeyboard,
  orderSelection,
  renderOrderScreen,
  startOrder,
  type OrderState,
} from "../telegram-order";

const menu = { dish: "Nasi Ayam, Nasi Ikan", subDishes: "Goreng, Bakar", addOns: "Telur, Tempe, Sambal" };
const date = "2026-10-14";

function testEncodeRoundTripAndSize() {
  const s: OrderState = { date, wants: true, dish: 1, variant: 0, addOnMask: 5, addOnsDone: true };
  const data = encodeOrder(s, true);
  assert.ok(Buffer.byteLength(data) <= 64, "callback_data must fit Telegram's 64 bytes");
  assert.deepStrictEqual(decodeOrder(data), { state: s, save: true });
  const start = encodeOrder(startOrder(date));
  const decoded = decodeOrder(start)!;
  assert.strictEqual(decoded.save, false);
  assert.strictEqual(encodeOrder(decoded.state), start);
}

function testDecodeRejectsForgedData() {
  assert.strictEqual(decodeOrder(""), null);
  assert.strictEqual(decodeOrder("x:2026-10-14::::0:0"), null);
  assert.strictEqual(decodeOrder("o:not-a-date::::0:0"), null);
  assert.strictEqual(decodeOrder("o:2026-10-14:2:::0:0"), null);
  assert.strictEqual(decodeOrder("o:2026-10-14::::abc:0"), null);
  assert.strictEqual(decodeOrder("o:2026-10-14::::0:0:x"), null);
  assert.strictEqual(decodeOrder("o:2026-10-14::::0:0:s:extra"), null);
}

function testFlowWalksEveryStep() {
  let s = startOrder(date);
  const next = (label: string) => {
    const btn = renderOrderScreen(menu, s).keyboard.flat().find((b) => b.text.includes(label));
    assert.ok(btn?.callback_data, `button "${label}" missing`);
    const parsed = decodeOrder(btn.callback_data)!;
    s = parsed.state;
    return parsed.save;
  };

  assert.match(renderOrderScreen(menu, s).text, /Mau pesan/);
  next("Mau");
  assert.match(renderOrderScreen(menu, s).text, /Pilih menunya/);
  next("Nasi Ikan");
  assert.match(renderOrderScreen(menu, s).text, /Pilih variannya/);
  next("Bakar");
  assert.match(renderOrderScreen(menu, s).text, /add-on/);
  next("Telur");
  next("Sambal");
  next("Tempe");
  next("Tempe"); // toggled off again
  next("Lanjut");
  assert.match(renderOrderScreen(menu, s).text, /Nasi Ikan \(Bakar\) \+ Telur, Sambal/);
  assert.strictEqual(next("Simpan"), true);
  assert.deepStrictEqual(orderSelection(menu, s), {
    wants: true,
    swapDish: "Nasi Ikan (Bakar)",
    addOns: "Telur, Sambal",
  });
}

function testDeclineSkipsChoices() {
  const s = { ...startOrder(date), wants: false };
  assert.match(renderOrderScreen(menu, s).text, /Tidak pesan/);
  assert.deepStrictEqual(orderSelection(menu, s), { wants: false, swapDish: null, addOns: null });
}

function testSingleDishNoExtras() {
  const plain = { dish: "Soto", subDishes: null, addOns: null };
  const s = { ...startOrder(date), wants: true };
  assert.match(renderOrderScreen(plain, s).text, /Pesananmu: <b>Soto<\/b>/);
  assert.deepStrictEqual(orderSelection(plain, s), { wants: true, swapDish: null, addOns: null });
}

function testOutOfRangeIndexAsksAgain() {
  const s = { ...startOrder(date), wants: true, dish: 9 };
  assert.match(renderOrderScreen(menu, s).text, /Pilih menunya/);
  assert.strictEqual(orderSelection(menu, { ...s, variant: 0, addOnsDone: true }), null);
}

function testShowsCurrentOrder() {
  const text = renderOrderScreen(menu, startOrder(date), { wants: true, swapDish: "Nasi Ayam (Goreng)", addOns: null }).text;
  assert.match(text, /Pesananmu sekarang: <b>Nasi Ayam \(Goreng\)<\/b>/);
}

function testEntryKeyboardSkipsNonHttpsUrl() {
  assert.strictEqual(orderEntryKeyboard(date, "http://localhost:3000")[0].length, 1);
  assert.strictEqual(orderEntryKeyboard(date, "https://katering.coofis.id")[0][1].url, "https://katering.coofis.id/home");
}

testEncodeRoundTripAndSize();
testDecodeRejectsForgedData();
testFlowWalksEveryStep();
testDeclineSkipsChoices();
testSingleDishNoExtras();
testOutOfRangeIndexAsksAgain();
testShowsCurrentOrder();
testEntryKeyboardSkipsNonHttpsUrl();
console.log("telegram-order tests passed");
