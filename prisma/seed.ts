import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { parseDateKey, todayKey } from "../src/lib/dates";

const db = new PrismaClient();

async function main() {
  const pinHash = await bcrypt.hash("1234", 10);

  await db.settings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      standingCutoff: "08:00",
      reminderTime: "07:00",
      defaultDishes: [
        "Ayam Bakar Madu",
        "Bebek Goreng Sambal Korek",
        "Nasi Goreng Spesial",
        "Ayam Geprek",
        "Telur Balado",
        "Soto Ayam",
      ],
    },
    update: {
      defaultDishes: [
        "Ayam Bakar Madu",
        "Bebek Goreng Sambal Korek",
        "Nasi Goreng Spesial",
        "Ayam Geprek",
        "Telur Balado",
        "Soto Ayam",
      ],
    },
  });

  const users = [
    { name: "Pak Yono", role: "yono" as const },
    { name: "Raihan", role: "admin" as const },
    { name: "Iqbal", role: "member" as const },
    { name: "Budi", role: "member" as const },
    { name: "Siti", role: "member" as const },
  ];

  const userMap = new Map<string, string>();
  for (const u of users) {
    const record = await db.user.upsert({
      where: { name: u.name },
      create: { name: u.name, pinHash, role: u.role },
      update: { role: u.role },
    });
    userMap.set(u.name, record.id);
  }

  // Seed menu hari ini dengan status semua sudah ngelist
  const todayDate = parseDateKey(todayKey());
  const menu = await db.menu.upsert({
    where: { date: todayDate },
    create: {
      date: todayDate,
      dish: "Ayam Bakar Madu + Lalapan & Sambal",
      note: "Pilihan menu ganti: Telur Balado / Tempe Orek",
      cutoffOverride: "08:30",
    },
    update: {
      dish: "Ayam Bakar Madu + Lalapan & Sambal",
      note: "Pilihan menu ganti: Telur Balado / Tempe Orek",
      cutoffOverride: "08:30",
    },
  });

  const responses = [
    {
      userName: "Raihan",
      wants: true,
      swapDish: null,
      note: "Porsi nasi banyak ya pak",
    },
    {
      userName: "Iqbal",
      wants: false,
      swapDish: "Telur Balado",
      note: "Sambal dipisah",
    },
    {
      userName: "Budi",
      wants: true,
      swapDish: null,
      note: "Tambah lalapan timun",
    },
    {
      userName: "Siti",
      wants: true,
      swapDish: null,
      note: null,
    },
  ];

  for (const r of responses) {
    const userId = userMap.get(r.userName);
    if (!userId) continue;
    await db.response.upsert({
      where: {
        menuId_userId: {
          menuId: menu.id,
          userId,
        },
      },
      create: {
        menuId: menu.id,
        userId,
        wants: r.wants,
        swapDish: r.swapDish,
        note: r.note,
      },
      update: {
        wants: r.wants,
        swapDish: r.swapDish,
        note: r.note,
      },
    });
  }

  console.log("Seed selesai: 5 pengguna, menu hari ini, dan respon pesanan tersimpan.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
