import assert from "assert";
import { buildMonthGrid } from "../calendar";

async function main() {
  // September 2026: Month index 8
  // 2026-09-01 was a Tuesday (lead Monday offset = 1 empty cell)
  // Total days in September = 30
  const regularGrid = buildMonthGrid(2026, 8);
  assert.strictEqual(regularGrid.length, 1 + 30);
  assert.deepStrictEqual(regularGrid[0], { type: "empty" });
  assert.deepStrictEqual(regularGrid[1], { type: "day", day: 1, key: "2026-09-01", disabled: false });
  assert.deepStrictEqual(regularGrid[25], { type: "day", day: 25, key: "2026-09-25", disabled: false });

  // With minDateKey = "2026-09-25" (today):
  // Days 1 through 24 are rendered with disabled: true
  const filteredGrid = buildMonthGrid(2026, 8, "2026-09-25");
  assert.strictEqual(filteredGrid.length, 1 + 30);
  assert.deepStrictEqual(filteredGrid[0], { type: "empty" });

  // Day 1 to 24 should be day cells with disabled: true
  for (let d = 1; d <= 24; d++) {
    const key = `2026-09-${String(d).padStart(2, "0")}`;
    assert.deepStrictEqual(
      filteredGrid[d],
      { type: "day", day: d, key, disabled: true },
      `Day ${d} should be disabled`,
    );
  }

  // Day 25 (today) and subsequent days should have disabled: false
  assert.deepStrictEqual(filteredGrid[25], { type: "day", day: 25, key: "2026-09-25", disabled: false });
  assert.deepStrictEqual(filteredGrid[26], { type: "day", day: 26, key: "2026-09-26", disabled: false });
  assert.deepStrictEqual(filteredGrid[30], { type: "day", day: 30, key: "2026-09-30", disabled: false });


  console.log("calendar.test.ts ok");
}

main();
