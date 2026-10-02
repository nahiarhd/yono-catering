"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, verifyPin } from "@/lib/auth";
import { id } from "@/lib/id";
import { clearLoginFailures, loginLockMinutes, recordLoginFailure } from "@/lib/login-throttle";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "");

  if (!name || !pin) return { error: id.login.errorNamePin };

  const user = await db.user.findUnique({ where: { name } });
  if (!user) return { error: id.login.errorWrong };

  const lockMinutes = loginLockMinutes(user.id);
  if (lockMinutes > 0) return { error: id.login.errorLocked(lockMinutes) };

  if (!(await verifyPin(user.pinHash, pin))) {
    recordLoginFailure(user.id);
    return { error: id.login.errorWrong };
  }

  clearLoginFailures(user.id);
  await createSession(user);
  redirect(user.role === "yono" ? "/yono" : "/home");
}