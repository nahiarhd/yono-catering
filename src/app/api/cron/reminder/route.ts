import { NextResponse } from "next/server";
import { deletePastMenus } from "@/lib/menu-data";
import { checkAndSendReminders } from "@/lib/reminder-service";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  const isAuthValid = Boolean(secret && auth === `Bearer ${secret}`);
  const querySecret = url.searchParams.get("secret");
  const isQuerySecretValid = Boolean(secret && querySecret === secret);

  if (!isAuthValid && !isQuerySecretValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const force = url.searchParams.get("force") === "true";

  try {
    await deletePastMenus();
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