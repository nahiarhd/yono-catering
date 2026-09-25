import assert from "assert";
import { parseDefaultDishes, normalizeDishKey, dishLabelForKey } from "../dishes";

async function main() {
  assert.strictEqual(normalizeDishKey("  Nasi Padang "), "nasi padang");

  // Backward compatibility: array of strings
  const stringDishes = ["Ayam Bakar", "Nasi Padang", "Ayam bakar"];
  const parsedFromString = parseDefaultDishes(stringDishes);
  assert.strictEqual(parsedFromString.length, 2);
  assert.deepStrictEqual(parsedFromString[0], { name: "Ayam Bakar", note: null });
  assert.deepStrictEqual(parsedFromString[1], { name: "Nasi Padang", note: null });

  // New format: objects with notes
  const objectDishes = [
    { name: "Nasi Padang", note: "Lauk: rendang, ayam pop, sambal ijo" },
    { name: "Soto Betawi", note: "Daging + emping" },
    { name: "nasi padang", note: "Duplicate should be skipped" },
  ];
  const parsedFromObjects = parseDefaultDishes(objectDishes);
  assert.strictEqual(parsedFromObjects.length, 2);
  assert.strictEqual(parsedFromObjects[0].name, "Nasi Padang");
  assert.strictEqual(parsedFromObjects[0].note, "Lauk: rendang, ayam pop, sambal ijo");
  assert.strictEqual(parsedFromObjects[1].name, "Soto Betawi");
  assert.strictEqual(parsedFromObjects[1].note, "Daging + emping");

  // Mixed items
  const mixed = ["Mie Goreng", { name: "Nasi Uduk", note: "Telur balado + bihun" }];
  const parsedMixed = parseDefaultDishes(mixed);
  assert.strictEqual(parsedMixed.length, 2);
  assert.deepStrictEqual(parsedMixed[0], { name: "Mie Goreng", note: null });
  assert.deepStrictEqual(parsedMixed[1], { name: "Nasi Uduk", note: "Telur balado + bihun" });

  // dishLabelForKey
  assert.strictEqual(dishLabelForKey(parsedFromObjects, "soto betawi"), "Soto Betawi");
  assert.strictEqual(dishLabelForKey(["Bebek Goreng"], "bebek goreng"), "Bebek Goreng");

  console.log("dishes.test.ts ok");
}

main();
