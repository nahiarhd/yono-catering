import assert from "assert";
import { db } from "../db";
import { formatAnnouncementMessage } from "../telegram";

async function main() {
  const testAdminName = `Admin Test ${Date.now()}`;

  // 1. Create a test admin user
  const admin = await db.user.create({
    data: {
      name: testAdminName,
      pinHash: "dummy-hash",
      role: "admin",
    },
  });
  assert.ok(admin.id);

  try {
    // 2. Create an announcement
    const title = "Pengumuman Menu Spesial";
    const message = "Malam ini ada menu bebek goreng sambal korek!";
    const announcement = await db.announcement.create({
      data: {
        title,
        message,
        sentCount: 5,
        failedCount: 0,
        authorId: admin.id,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    assert.ok(announcement.id);
    assert.strictEqual(announcement.title, title);
    assert.strictEqual(announcement.message, message);
    assert.strictEqual(announcement.sentCount, 5);
    assert.strictEqual(announcement.failedCount, 0);
    assert.strictEqual(announcement.author?.name, testAdminName);

    // 3. Format telegram announcement
    const formatted = formatAnnouncementMessage({
      title: announcement.title,
      message: announcement.message,
      appUrl: "https://katering.test",
    });
    assert.ok(formatted.includes("PENGUMUMAN MENU SPESIAL"));
    assert.ok(formatted.includes("Malam ini ada menu bebek goreng sambal korek!"));
    assert.ok(formatted.includes("https://katering.test/home"));
    assert.ok(!formatted.includes("—"), "Must not contain em dash");

    // 4. Query announcements list
    const list = await db.announcement.findMany({
      where: { id: announcement.id },
      include: { author: true },
    });
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].id, announcement.id);

    // 5. Delete announcement
    await db.announcement.delete({ where: { id: announcement.id } });
    const checkDeleted = await db.announcement.findUnique({ where: { id: announcement.id } });
    assert.strictEqual(checkDeleted, null);

    console.log("announcement.test.ts ok");
  } finally {
    // Clean up test admin
    await db.user.delete({ where: { id: admin.id } });
  }
}

main().catch((err) => {
  console.error("announcement.test.ts failed:", err);
  process.exit(1);
});
