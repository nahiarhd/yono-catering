import assert from "assert";
import { buildTally } from "../tally";

function testTallyOnlyCountsEating() {
  const responses = [
    { wants: true, swapDish: null, note: "Pedas", user: { name: "Raihan" } },
    { wants: false, swapDish: null, note: null, user: { name: "Iqbal" } },
    { wants: true, swapDish: null, note: null, user: { name: "Budi" } },
  ];

  const tally = buildTally("Ayam Penyet", responses);

  assert.strictEqual(tally.total, 2, "Only 2 members are eating");
  assert.strictEqual(tally.eatingCount, 2);
  assert.strictEqual(tally.notEatingCount, 1);
  assert.strictEqual(tally.breakdown.length, 1);
  assert.strictEqual(tally.breakdown[0].count, 2);
  assert.strictEqual(tally.breakdown[0].dish, "Ayam Penyet");
  assert.strictEqual(tally.notes.length, 1);
  assert.strictEqual(tally.notes[0].name, "Raihan");
  assert.strictEqual(tally.notes[0].note, "Pedas");
}

function testTallyAllSkip() {
  const responses = [
    { wants: false, swapDish: null, note: "Puasa", user: { name: "Iqbal" } },
  ];

  const tally = buildTally("Ikan Bakar", responses);

  assert.strictEqual(tally.total, 0);
  assert.strictEqual(tally.eatingCount, 0);
  assert.strictEqual(tally.notEatingCount, 1);
  assert.strictEqual(tally.breakdown.length, 0);
}

function testTallyEmpty() {
  const tally = buildTally("Bebek Goreng", []);
  assert.strictEqual(tally.total, 0);
  assert.strictEqual(tally.eatingCount, 0);
  assert.strictEqual(tally.notEatingCount, 0);
}

function testTallyWithSubMenuVariants() {
  const responses = [
    { wants: true, swapDish: "Bakmi Goreng", note: "Pedas", user: { name: "Raihan" } },
    { wants: true, swapDish: "Bakmi Goreng", note: null, user: { name: "Pram" } },
    { wants: true, swapDish: "Nasi Goreng", note: "Sedang", user: { name: "Iqbal" } },
    { wants: false, swapDish: null, note: null, user: { name: "Haq" } },
  ];

  const tally = buildTally("Bakmi Jogja", responses);
  assert.strictEqual(tally.total, 3);
  assert.strictEqual(tally.breakdown.length, 2);

  const bakmiGoreng = tally.breakdown.find((b) => b.dish === "Bakmi Goreng");
  assert.strictEqual(bakmiGoreng?.count, 2);

  const nasiGoreng = tally.breakdown.find((b) => b.dish === "Nasi Goreng");
  assert.strictEqual(nasiGoreng?.count, 1);
}

function testTallyWithDishAndVariantCombination() {
  const responses = [
    { wants: true, swapDish: "Bakmi Goreng (Pedas)", note: null, user: { name: "Raihan" } },
    { wants: true, swapDish: "Bakmi Goreng (Tidak Pedas)", note: null, user: { name: "Pram" } },
    { wants: true, swapDish: "Nasi Goreng (Pedas)", note: "tanpa timun", user: { name: "Iqbal" } },
  ];

  const tally = buildTally("Bakmi godok, Bakmi goreng, Nasi goreng", responses);
  assert.strictEqual(tally.total, 3);
  assert.strictEqual(tally.breakdown.length, 3);
  assert.strictEqual(tally.breakdown.find((b) => b.dish === "Bakmi Goreng (Pedas)")?.count, 1);
  assert.strictEqual(tally.breakdown.find((b) => b.dish === "Bakmi Goreng (Tidak Pedas)")?.count, 1);
  assert.strictEqual(tally.breakdown.find((b) => b.dish === "Nasi Goreng (Pedas)")?.count, 1);
}

function testTallyWithAddOns() {
  const responses = [
    { wants: true, swapDish: "Ayam Geprek", addOns: "Telor Dadar, Kerupuk", note: null, user: { name: "Raihan" } },
    { wants: true, swapDish: "Ayam Geprek", addOns: "Telor Dadar", note: null, user: { name: "Pram" } },
    { wants: true, swapDish: "Ayam Geprek", addOns: null, note: null, user: { name: "Iqbal" } },
    { wants: false, swapDish: null, addOns: "Telor Dadar", note: null, user: { name: "Sita" } },
  ];

  const tally = buildTally("Ayam Geprek", responses);
  assert.strictEqual(tally.total, 3);
  assert.strictEqual(tally.addOnBreakdown.length, 2);

  const telor = tally.addOnBreakdown.find((a) => a.name === "Telor Dadar");
  assert.strictEqual(telor?.count, 2);
  assert.deepStrictEqual(telor?.users, ["Raihan", "Pram"]);

  const kerupuk = tally.addOnBreakdown.find((a) => a.name === "Kerupuk");
  assert.strictEqual(kerupuk?.count, 1);
  assert.deepStrictEqual(kerupuk?.users, ["Raihan"]);
}

testTallyOnlyCountsEating();
testTallyAllSkip();
testTallyEmpty();
testTallyWithSubMenuVariants();
testTallyWithDishAndVariantCombination();
testTallyWithAddOns();
console.log("tally.test.ts ok");
