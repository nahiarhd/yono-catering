import assert from "assert";
import { buildReport } from "../report";
import { parseDateKey } from "../dates";

const user = (id: string, role = "member", group: string | null = null) => ({
  id,
  name: id,
  role,
  group: group ? { name: group } : null,
});

const report = buildReport([
  {
    id: "m1",
    date: parseDateKey("2026-10-01"),
    vendor: "Warung A",
    dish: "Bakmi",
    note: null,
    responses: [
      { wants: true, swapDish: null, addOns: "Telur", note: null, user: user("Ani", "member", "IT") },
      { wants: true, swapDish: null, addOns: " Telur ", note: "pedas", user: user("Budi") },
      { wants: false, swapDish: null, addOns: null, note: null, user: user("Cici") },
      { wants: true, swapDish: null, addOns: null, note: null, user: user("Yono", "yono") },
    ],
  },
  {
    id: "m2",
    date: parseDateKey("2026-10-01"),
    vendor: "Warung B",
    dish: "Soto",
    note: null,
    responses: [{ wants: true, swapDish: "Soto (Ayam)", addOns: null, note: null, user: user("Cici") }],
  },
  {
    id: "m3",
    date: parseDateKey("2026-10-02"),
    vendor: "Bakmi",
    dish: "Bakmi",
    note: null,
    responses: [{ wants: true, swapDish: null, addOns: null, note: null, user: user("Ani", "member", "IT") }],
  },
]);

// Two warungs on one day count as one catering day
assert.strictEqual(report.totalDays, 2);
assert.strictEqual(report.totalPortions, 4);
assert.deepStrictEqual(
  report.days.map((d) => [d.dateKey, d.portions, d.warungs.length]),
  [
    ["2026-10-02", 1, 1],
    ["2026-10-01", 3, 2],
  ],
);
const warungA = report.days[1].warungs[0];
assert.strictEqual(warungA.label, "Warung A · Bakmi");
assert.deepStrictEqual(warungA.items, [{ label: "Bakmi + Telur", count: 2 }]);
assert.deepStrictEqual(warungA.skipped, ["Cici"]);
assert.strictEqual(report.days[0].warungs[0].label, "Bakmi");

// Yono is left out; Cici skipped one warung but ate at the other
assert.deepStrictEqual(
  report.people.map((p) => [p.name, p.group, p.eaten, p.skipped]),
  [
    ["Ani", "IT", 2, 0],
    ["Budi", null, 1, 0],
    ["Cici", null, 1, 1],
  ],
);

assert.deepStrictEqual(buildReport([]), { days: [], people: [], totalPortions: 0, totalDays: 0 });
console.log("report.test.ts ok");
