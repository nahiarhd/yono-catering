import assert from "assert";

async function main() {
  process.env.HOUSEHOLD_TZ = "UTC";
  const { effectiveCutoff, isResponsesLocked, parseHHMM } = await import("../cutoff");

  assert.deepStrictEqual(parseHHMM("08:00"), { hours: 8, minutes: 0 });
  assert.strictEqual(parseHHMM("8:00"), null);

  assert.strictEqual(effectiveCutoff("08:00", "09:30"), "09:30");
  assert.strictEqual(effectiveCutoff("08:00", null), "08:00");

  const today = "2026-06-23";
  const before = new Date(`${today}T07:30:00.000Z`);
  const after = new Date(`${today}T08:30:00.000Z`);

  assert.strictEqual(isResponsesLocked(today, "08:00", null, before), false);
  assert.strictEqual(isResponsesLocked(today, "08:00", null, after), true);
  assert.strictEqual(isResponsesLocked("2026-06-22", "08:00", null, after), true);
  assert.strictEqual(isResponsesLocked("2026-06-24", "08:00", null, before), false);

  console.log("cutoff.test.ts ok");
}

main();