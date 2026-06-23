import { db } from "./db";
import { parseDefaultDishes } from "./dishes";

export async function getSettings() {
  let settings = await db.settings.findUnique({ where: { id: "singleton" } });
  if (!settings) {
    settings = await db.settings.create({
      data: {
        id: "singleton",
        standingCutoff: "08:00",
        reminderTime: "07:00",
        defaultDishes: [],
      },
    });
  }
  return settings;
}

export async function getDefaultDishes() {
  const settings = await getSettings();
  return parseDefaultDishes(settings.defaultDishes);
}