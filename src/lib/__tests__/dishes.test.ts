import assert from "assert";
import { parseDefaultDishes, normalizeDishKey, dishLabelForKey } from "../dishes";

async function main() {
  assert.strictEqual(normalizeDishKey("  Nasi Padang "), "nasi padang");

  // Backward compatibility: array of strings
  const stringDishes = ["Ayam Bakar", "Nasi Padang", "Ayam bakar"];
  const parsedFromString = parseDefaultDishes(stringDishes);
  assert.strictEqual(parsedFromString.length, 2);
  assert.deepStrictEqual(parsedFromString[0], { name: "Ayam Bakar", note: null, subDishes: [] });
  assert.deepStrictEqual(parsedFromString[1], { name: "Nasi Padang", note: null, subDishes: [] });

  // New format: objects with notes & subDishes
  const objectDishes = [
    {
      name: "Bakmi Jogja",
      note: "Jl. Kaliurang",
      subDishes: ["Bakmi Goreng", "Bakmi Godhog", "Nasi Goreng"],
    },
    { name: "Soto Betawi", note: "Daging + emping" },
    { name: "bakmi jogja", note: "Duplicate should be skipped" },
  ];
  const parsedFromObjects = parseDefaultDishes(objectDishes);
  assert.strictEqual(parsedFromObjects.length, 2);
  assert.strictEqual(parsedFromObjects[0].name, "Bakmi Jogja");
  assert.strictEqual(parsedFromObjects[0].note, "Jl. Kaliurang");
  assert.deepStrictEqual(parsedFromObjects[0].subDishes, [
    "Bakmi Goreng",
    "Bakmi Godhog",
    "Nasi Goreng",
  ]);
  assert.strictEqual(parsedFromObjects[1].name, "Soto Betawi");
  assert.deepStrictEqual(parsedFromObjects[1].subDishes, []);

  // parseSubDishes string parsing
  const { parseSubDishes } = await import("../dishes");
  assert.deepStrictEqual(
    parseSubDishes("Bakmi Goreng, Bakmi Godhog , Nasi Goreng, bakmi goreng"),
    ["Bakmi Goreng", "Bakmi Godhog", "Nasi Goreng"]
  );
  assert.deepStrictEqual(parseSubDishes(""), []);
  assert.deepStrictEqual(parseSubDishes(null), []);

  // Mixed items
  const mixed = ["Mie Goreng", { name: "Nasi Uduk", note: "Telur balado + bihun" }];
  const parsedMixed = parseDefaultDishes(mixed);
  assert.strictEqual(parsedMixed.length, 2);
  assert.deepStrictEqual(parsedMixed[0], { name: "Mie Goreng", note: null, subDishes: [] });
  assert.deepStrictEqual(parsedMixed[1], {
    name: "Nasi Uduk",
    note: "Telur balado + bihun",
    subDishes: [],
  });

  // dishLabelForKey
  assert.strictEqual(dishLabelForKey(parsedFromObjects, "soto betawi"), "Soto Betawi");
  assert.strictEqual(dishLabelForKey(["Bebek Goreng"], "bebek goreng"), "Bebek Goreng");

  console.log("dishes.test.ts ok");
}

main();
