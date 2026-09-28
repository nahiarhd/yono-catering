const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

function tz() {
  return process.env.HOUSEHOLD_TZ ?? "Asia/Jakarta";
}

function todayKey(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz() }).format(now);
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Pre-hashed bcrypt hash for PIN "1234"
const PIN_1234_HASH = "$2b$10$8wQwJE8c0/aa84b92v9zwuL.ZWrKKw2F9Jy9SEFq5VrPGi8HfVMHu";

async function main() {
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
    { name: "Pak Yono", role: "yono" },
    { name: "Raihan", role: "admin" },
    { name: "Iqbal", role: "member" },
    { name: "Budi", role: "member" },
    { name: "Siti", role: "member" },
  ];

  const userMap = new Map();
  for (const u of users) {
    const record = await db.user.upsert({
      where: { name: u.name },
      create: { name: u.name, pinHash: PIN_1234_HASH, role: u.role },
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

  console.log("✅ Seed selesai: 5 pengguna (PIN: 1234), menu hari ini, dan respon pesanan tersimpan.");
}

main()
  .catch((e) => {
    console.error("❌ Seed gagal:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
