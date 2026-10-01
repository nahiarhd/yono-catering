import assert from "assert";
import { parseHHMM, effectiveCutoff } from "../cutoff";

async function main() {
  // Test 1: effectiveCutoff fallback
  assert.strictEqual(effectiveCutoff("16:00", null), "16:00");
  assert.strictEqual(effectiveCutoff("16:00", ""), "16:00");
  assert.strictEqual(effectiveCutoff("16:00", "17:00"), "17:00");

  // Test 2: parseHHMM validation
  const reminder = parseHHMM("15:00");
  const cutoff = parseHHMM("16:00");
  assert(reminder !== null);
  assert(cutoff !== null);
  assert.strictEqual(reminder.hours * 60 + reminder.minutes, 900); // 15 * 60 = 900
  assert.strictEqual(cutoff.hours * 60 + cutoff.minutes, 960);     // 16 * 60 = 960

  // Test 3: Time window logic
  function isReminderWindow(nowHHMM: string, reminderHHMM: string, cutoffHHMM: string): boolean {
    const pNow = parseHHMM(nowHHMM);
    const pReminder = parseHHMM(reminderHHMM);
    const pCutoff = parseHHMM(cutoffHHMM);
    if (!pNow || !pReminder || !pCutoff) return false;
    const nowMin = pNow.hours * 60 + pNow.minutes;
    const remMin = pReminder.hours * 60 + pReminder.minutes;
    const cutMin = pCutoff.hours * 60 + pCutoff.minutes;
    return nowMin >= remMin && nowMin < cutMin;
  }

  assert.strictEqual(isReminderWindow("14:59", "15:00", "16:00"), false);
  assert.strictEqual(isReminderWindow("15:00", "15:00", "16:00"), true);
  assert.strictEqual(isReminderWindow("15:30", "15:00", "16:00"), true);
  assert.strictEqual(isReminderWindow("15:59", "15:00", "16:00"), true);
  assert.strictEqual(isReminderWindow("16:00", "15:00", "16:00"), false);
  assert.strictEqual(isReminderWindow("16:01", "15:00", "16:00"), false);

  console.log("reminder-service.test.ts ok");
}

main();
