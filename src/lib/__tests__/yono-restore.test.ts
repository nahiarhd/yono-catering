import assert from "assert";
import { id } from "../id";
import { buildTally } from "../tally";

function testIdStringsNoEmDash() {
  assert.strictEqual(id.yono.restoreNotEating, "Kembalikan");
  assert.ok(!id.yono.restoreNotEating.includes("—"), "Must not contain em dash");
  assert.ok(!id.yono.restoringNotEating.includes("—"), "Must not contain em dash");
  assert.ok(!id.yono.restoreNotEatingHint.includes("—"), "Must not contain em dash");

  const aria = id.yono.restoreNotEatingAria("User A");
  assert.strictEqual(aria, "Kembalikan User A ke daftar belum absen");
  assert.ok(!aria.includes("—"), "Must not contain em dash");
}

function testResetMemberResponseSimulation() {
  const eaters = [
    { id: "u1", name: "User A" },
    { id: "u2", name: "User B" },
  ];

  // Simulating initial state: User A marked as not eating, User B marked as eating
  let responses = [
    { userId: "u1", wants: false, swapDish: null, note: null, user: { name: "User A" } },
    { userId: "u2", wants: true, swapDish: null, note: null, user: { name: "User B" } },
  ];

  let respondedUserIds = new Set(responses.map((r) => r.userId));
  let pendingUsers = eaters.filter((e) => !respondedUserIds.has(e.id));
  let tally = buildTally("Ayam Goreng", responses);

  assert.strictEqual(pendingUsers.length, 0, "No pending users initially");
  assert.strictEqual(tally.eatingCount, 1);
  assert.strictEqual(tally.notEatingCount, 1);

  // Pak Yono resets User A (deleting response for u1)
  responses = responses.filter((r) => r.userId !== "u1");
  respondedUserIds = new Set(responses.map((r) => r.userId));
  pendingUsers = eaters.filter((e) => !respondedUserIds.has(e.id));
  tally = buildTally("Ayam Goreng", responses);

  assert.strictEqual(pendingUsers.length, 1, "User A is now back in pending users");
  assert.strictEqual(pendingUsers[0].name, "User A");
  assert.strictEqual(tally.eatingCount, 1);
  assert.strictEqual(tally.notEatingCount, 0, "Not eating count is now 0");
}

testIdStringsNoEmDash();
testResetMemberResponseSimulation();
console.log("yono-restore.test.ts ok");
