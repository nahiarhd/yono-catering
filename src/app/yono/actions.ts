"use server";

import { db } from "@/lib/db";
import { requireYono } from "@/lib/auth";
import { parseHHMM, effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay, upsertMenu } from "@/lib/menu-data";
import { sendPush } from "@/lib/push";
import { getSettings } from "@/lib/settings";
import { id } from "@/lib/id";

export type ActionState = { error?: string; ok?: boolean };

export async function postMenuAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireYono();

  const dateKey = String(formData.get("dateKey") ?? "");
  const dish = String(formData.get("dish") ?? "").trim();
  const menuNote = String(formData.get("menuNote") ?? "").trim() || null;
  const cutoffRaw = String(formData.get("cutoffOverride") ?? "").trim();
  const cutoffOverride = cutoffRaw ? cutoffRaw : null;

  if (!dateKey) return { error: id.errors.missingDay };
  if (!dish) return { error: id.errors.dishRequired };
  if (cutoffOverride && !parseHHMM(cutoffOverride)) {
    return { error: id.errors.cutoffFormat };
  }

  const settings = await getSettings();
  const existing = await getMenuDay(dateKey);
  const menu = await upsertMenu({
    dateKey,
    dish,
    note: menuNote,
    cutoffOverride,
  });

  if (!existing.menu) {
    const cutoff = effectiveCutoff(settings.standingCutoff, cutoffOverride);
    const members = await db.user.findMany({
      where: { role: { not: "yono" } },
      select: { id: true },
    });
    await sendPush(members.map((m) => m.id), {
      title: id.push.menuTitle,
      body: id.push.menuBody(dish, cutoff),
      url: "/home",
    });
  }

  void menu;
  return { ok: true };
}