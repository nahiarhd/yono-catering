import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { nowInHousehold } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { deletePastMenus } from "@/lib/menu-data";
import { sendPush } from "@/lib/push";
import { id } from "@/lib/id";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  await deletePastMenus();
  const { hhmm } = nowInHousehold();
  if (hhmm !== settings.reminderTime) {
    return NextResponse.json({ skipped: true, now: hhmm, expected: settings.reminderTime });
  }

  const yono = await db.user.findFirst({ where: { role: "yono" }, select: { id: true } });
  if (yono) {
    await sendPush([yono.id], {
      title: id.push.morningTitle,
      body: id.push.morningBody,
      url: "/yono",
    });
  }

  return NextResponse.json({ ok: true });
}