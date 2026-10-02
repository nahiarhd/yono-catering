import { NextResponse } from "next/server";
import { checkAndSendReminders } from "@/lib/reminder-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = url.searchParams.get("force") === "true";

  try {
    const result = await checkAndSendReminders({ force });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Gagal menjalankan cron reminder:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}