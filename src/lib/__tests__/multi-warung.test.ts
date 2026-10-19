import assert from "assert";
import { db } from "../db";
import { getMenuDay, saveResponse, upsertMenu } from "../menu-data";
import { parseDateKey } from "../dates";

async function main() {
  // Far-future day so the test never touches real menus
  const dateKey = "2099-01-02";
  const user = await db.user.create({
    data: { name: `Test Warung ${Date.now()}`, pinHash: "x", role: "member" },
  });

  try {
    const base = { note: null, cutoffOverride: null };
    const manis = await upsertMenu(dateKey, null, { ...base, vendor: "Ayam Bakar Manis", dish: "Ayam Bakar" });
    const asin = await upsertMenu(dateKey, null, { ...base, vendor: "Ayam Bakar Asin", dish: "Ayam Bakar" });
    assert.notStrictEqual(manis.id, asin.id, "two warungs on one day are separate menus");

    // Re-posting the same warung updates it instead of adding a third
    await upsertMenu(dateKey, null, { ...base, vendor: "Ayam Bakar Manis", dish: "Ayam Bakar Madu" });
    const day = await getMenuDay(dateKey, asin.id);
    assert.strictEqual(day.menus.length, 2);
    assert.strictEqual(day.menu?.id, asin.id, "menuId picks the warung");
    assert.strictEqual(day.menus[0].dish, "Ayam Bakar Madu");

    // Ordering at the second warung drops the order at the first
    await saveResponse(manis, user.id, { wants: true, swapDish: null, addOns: null });
    await saveResponse(asin, user.id, { wants: true, swapDish: null, addOns: null, note: "pedas" });
    const responses = await db.response.findMany({ where: { userId: user.id } });
    assert.deepStrictEqual(responses.map((r) => [r.menuId, r.note]), [[asin.id, "pedas"]]);
  } finally {
    await db.menu.deleteMany({ where: { date: parseDateKey(dateKey) } });
    await db.user.delete({ where: { id: user.id } });
  }

  console.log("multi-warung.test.ts ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
