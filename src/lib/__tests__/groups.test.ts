import assert from "assert";
import { db } from "../db";

async function main() {
  const testGroupName1 = `Test Group A ${Date.now()}`;
  const testGroupName2 = `Test Group B ${Date.now()}`;
  const testUserName = `Test User ${Date.now()}`;

  // 1. Create a group
  const group1 = await db.group.create({
    data: { name: testGroupName1 },
  });
  assert.ok(group1.id);
  assert.strictEqual(group1.name, testGroupName1);

  // 2. Cannot create duplicate group name
  try {
    await db.group.create({
      data: { name: testGroupName1 },
    });
    assert.fail("Should have thrown duplicate group error");
  } catch (err: unknown) {
    assert.ok(err);
  }

  // 3. Create a second group
  const group2 = await db.group.create({
    data: { name: testGroupName2 },
  });
  assert.ok(group2.id);

  // 4. Create a user assigned to group1
  const user = await db.user.create({
    data: {
      name: testUserName,
      pinHash: "dummy-hash",
      role: "member",
      groupId: group1.id,
    },
    include: {
      group: true,
    },
  });
  assert.strictEqual(user.groupId, group1.id);
  assert.strictEqual(user.group?.name, testGroupName1);

  // 5. Move user from group1 to group2
  const movedUser = await db.user.update({
    where: { id: user.id },
    data: { groupId: group2.id },
    include: { group: true },
  });
  assert.strictEqual(movedUser.groupId, group2.id);
  assert.strictEqual(movedUser.group?.name, testGroupName2);

  // 6. Unassign user from group (Tanpa Group)
  const unassignedUser = await db.user.update({
    where: { id: user.id },
    data: { groupId: null },
    include: { group: true },
  });
  assert.strictEqual(unassignedUser.groupId, null);
  assert.strictEqual(unassignedUser.group, null);

  // 7. Assign back to group1 and test delete group behavior (SetNull)
  await db.user.update({
    where: { id: user.id },
    data: { groupId: group1.id },
  });

  await db.group.delete({
    where: { id: group1.id },
  });

  const userAfterGroupDelete = await db.user.findUnique({
    where: { id: user.id },
  });
  assert.ok(userAfterGroupDelete);
  assert.strictEqual(userAfterGroupDelete.groupId, null, "User should remain and groupId become null");

  // Cleanup
  await db.user.delete({ where: { id: user.id } });
  await db.group.delete({ where: { id: group2.id } });

  console.log("groups.test.ts ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
