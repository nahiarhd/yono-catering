import assert from "assert";
import { parseDefaultDishes, normalizeDishKey, dishLabelForKey } from "../dishes";

async function main() {
  assert.strictEqual(normalizeDishKey("  Nasi Padang "), "nasi padang");

  // Backward compatibility: array of strings
  const stringDishes = ["Ayam Bakar", "Nasi Padang", "Ayam bakar"];
  const parsedFromString = parseDefaultDishes(stringDishes);
  assert.strictEqual(parsedFromString.length, 2);
  assert.deepStrictEqual(parsedFromString[0], { warung: null, name: "Ayam Bakar", note: null, subDishes: [], addOns: [] });
  assert.deepStrictEqual(parsedFromString[1], { warung: null, name: "Nasi Padang", note: null, subDishes: [], addOns: [] });

  // New format: objects with warung, notes & subDishes & addOns
  const objectDishes = [
    {
      warung: "Warung Jogja",
      name: "Bakmi Jogja",
      note: "pedas / tidak pedas",
      subDishes: ["Bakmi Goreng", "Bakmi Godhog", "Nasi Goreng"],
      addOns: ["Telor Dadar", "Kerupuk"],
    },
    { name: "Soto Betawi", note: "Daging + emping" },
    { name: "bakmi jogja", note: "Duplicate should be skipped" },
  ];
  const parsedFromObjects = parseDefaultDishes(objectDishes);
  assert.strictEqual(parsedFromObjects.length, 2);
  assert.strictEqual(parsedFromObjects[0].warung, "Warung Jogja");
  assert.strictEqual(parsedFromObjects[0].name, "Bakmi Jogja");
  assert.strictEqual(parsedFromObjects[0].note, "pedas / tidak pedas");
  assert.deepStrictEqual(parsedFromObjects[0].subDishes, [
    "Bakmi Goreng",
    "Bakmi Godhog",
    "Nasi Goreng",
  ]);
  assert.deepStrictEqual(parsedFromObjects[0].addOns, [
    "Telor Dadar",
    "Kerupuk",
  ]);
  assert.strictEqual(parsedFromObjects[1].warung, null);
  assert.strictEqual(parsedFromObjects[1].name, "Soto Betawi");
  assert.deepStrictEqual(parsedFromObjects[1].subDishes, []);
  assert.deepStrictEqual(parsedFromObjects[1].addOns, []);

  // parseSubDishes string parsing
  const { parseSubDishes } = await import("../dishes");
  assert.deepStrictEqual(
    parseSubDishes("Bakmi Goreng, Bakmi Godhog , Nasi Goreng, bakmi goreng"),
    ["Bakmi Goreng", "Bakmi Godhog", "Nasi Goreng"]
  );
  assert.deepStrictEqual(parseSubDishes(""), []);
  assert.deepStrictEqual(parseSubDishes(null), []);

  // Mixed items
  const mixed = ["Mie Goreng", { warung: "Dapur Berkah", name: "Nasi Uduk", note: "Telur balado + bihun" }];
  const parsedMixed = parseDefaultDishes(mixed);
  assert.strictEqual(parsedMixed.length, 2);
  assert.deepStrictEqual(parsedMixed[0], { warung: null, name: "Mie Goreng", note: null, subDishes: [], addOns: [] });
  assert.deepStrictEqual(parsedMixed[1], {
    warung: "Dapur Berkah",
    name: "Nasi Uduk",
    note: "Telur balado + bihun",
    subDishes: [],
    addOns: [],
  });

  // dishLabelForKey
  assert.strictEqual(dishLabelForKey(parsedFromObjects, "soto betawi"), "Soto Betawi");
  // formatSubDishes
  const { formatSubDishes } = await import("../dishes");
  assert.strictEqual(formatSubDishes(["Bakmi Goreng", "Nasi Goreng"]), "Bakmi Goreng, Nasi Goreng");
  assert.strictEqual(formatSubDishes([]), "");
  assert.strictEqual(formatSubDishes(null), "");

  // Update simulation
  const dishesList = parseDefaultDishes(objectDishes);
  const targetIdx = dishesList.findIndex((d) => normalizeDishKey(d.name) === "bakmi jogja");
  assert.ok(targetIdx !== -1);
  dishesList[targetIdx] = {
    name: "Bakmi Jogja Spesial",
    note: "Porsi Jumbo",
    subDishes: ["Bakmi Nyemek"],
  };
  assert.strictEqual(dishesList[targetIdx].name, "Bakmi Jogja Spesial");
  assert.strictEqual(dishesList[targetIdx].note, "Porsi Jumbo");
  assert.deepStrictEqual(dishesList[targetIdx].subDishes, ["Bakmi Nyemek"]);

  console.log("dishes.test.ts ok");
}

main();
