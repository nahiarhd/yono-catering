"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStrictAdmin, hashPin } from "@/lib/auth";
import { id } from "@/lib/id";

export type ActionState = { error?: string; ok?: boolean };

export async function addMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStrictAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const rawRole = String(formData.get("role") ?? "member").trim();
  const role: Role = rawRole === "admin" ? "admin" : "member";
  const telegramChatId = String(formData.get("telegramChatId") ?? "").trim() || null;

  if (!name || !pin) return { error: id.errors.namePinRequired };
  if (pin.length < 4) return { error: id.errors.pinMinLength };

  const exists = await db.user.findUnique({ where: { name } });
  if (exists) return { error: id.errors.nameTaken };

  await db.user.create({
    data: { name, pinHash: await hashPin(pin), role, telegramChatId },
  });

  revalidatePath("/users");
  revalidatePath("/settings");
  return { ok: true };
}

export async function updateTelegramIdAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStrictAdmin();

  const memberId = String(formData.get("memberId") ?? "");
  const telegramChatIdRaw = String(formData.get("telegramChatId") ?? "").trim();
  const telegramChatId = telegramChatIdRaw ? telegramChatIdRaw : null;

  if (!memberId) return { error: id.errors.memberNotFound };

  const target = await db.user.findUnique({ where: { id: memberId } });
  if (!target) return { error: id.errors.memberNotFound };

  await db.user.update({
    where: { id: memberId },
    data: { telegramChatId },
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function updateRoleAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentAdmin = await requireStrictAdmin();

  const memberId = String(formData.get("memberId") ?? "");
  const rawRole = String(formData.get("role") ?? "").trim();
  const nextRole: Role = rawRole === "admin" ? "admin" : "member";

  if (!memberId) return { error: id.errors.memberNotFound };

  if (memberId === currentAdmin.id) {
    return { error: id.errors.cannotChangeSelfRole };
  }

  const target = await db.user.findUnique({ where: { id: memberId } });
  if (!target) return { error: id.errors.memberNotFound };
  if (target.role === "yono") return { error: id.errors.cannotChangeYonoRole };

  await db.user.update({
    where: { id: memberId },
    data: { role: nextRole },
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function resetPinAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStrictAdmin();

  const memberId = String(formData.get("memberId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  if (!memberId || !pin) return { error: id.errors.memberPinRequired };
  if (pin.length < 4) return { error: id.errors.pinMinLength };

  const member = await db.user.findUnique({ where: { id: memberId } });
  if (!member) return { error: id.errors.memberNotFound };

  await db.user.update({
    where: { id: memberId },
    data: { pinHash: await hashPin(pin) },
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function removeMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currentAdmin = await requireStrictAdmin();
  const memberId = String(formData.get("memberId") ?? "");

  if (memberId === currentAdmin.id) {
    return { error: id.errors.cannotRemoveSelf };
  }

  const target = await db.user.findUnique({ where: { id: memberId } });
  if (!target) return { error: id.errors.memberNotFound };
  if (target.role === "yono") return { error: id.errors.cannotRemoveYono };

  await db.user.delete({ where: { id: memberId } });
  revalidatePath("/users");
  return { ok: true };
}
