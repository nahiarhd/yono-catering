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

testTallyOnlyCountsEating();
testTallyAllSkip();
testTallyEmpty();
console.log("tally.test.ts ok");
