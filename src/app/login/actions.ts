"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, verifyPin } from "@/lib/auth";
import { id } from "@/lib/id";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!name || !pin) return { error: id.login.errorNamePin };

  const user = await db.user.findUnique({ where: { name } });
  if (!user || !(await verifyPin(user.pinHash, pin))) {
    return { error: id.login.errorWrong };
  }

  await createSession(user.id, user.role);
  redirect(user.role === "yono" ? "/yono" : "/home");
}