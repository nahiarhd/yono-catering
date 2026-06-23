import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const pinHash = await bcrypt.hash("1234", 10);

  await db.settings.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      standingCutoff: "08:00",
      reminderTime: "07:00",
      defaultDishes: ["bebek", "nasi goreng", "ayam goreng", "mie goreng"],
    },
    update: {
      defaultDishes: ["bebek", "nasi goreng", "ayam goreng", "mie goreng"],
    },
  });

  const users = [
    { name: "Pak Yono", role: "yono" as const },
    { name: "Raihan", role: "member" as const },
    { name: "Iqbal", role: "member" as const },
  ];

  for (const u of users) {
    await db.user.upsert({
      where: { name: u.name },
      create: { name: u.name, pinHash, role: u.role },
      update: {},
    });
  }

  console.log("Seed selesai");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
