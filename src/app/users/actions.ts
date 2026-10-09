"use server";

import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireStrictAdmin, hashPin } from "@/lib/auth";
import { broadcastRealtime } from "@/lib/realtime";
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
  const rawGroupId = String(formData.get("groupId") ?? "").trim();
  const groupId = rawGroupId || null;

  if (!name || !pin) return { error: id.errors.namePinRequired };
  if (pin.length < 4) return { error: id.errors.pinMinLength };

  if (groupId) {
    const groupExists = await db.group.findUnique({ where: { id: groupId } });
    if (!groupExists) return { error: id.errors.groupNotFound };
  }

  if (telegramChatId && !/^-?\d+$/.test(telegramChatId)) {
    return {
      error:
        "Telegram ID harus berupa angka Chat ID (contoh: 123456789), bukan username @. Buka bot @yonocateringbot dan ketik /start untuk melihat Chat ID.",
    };
  }

  const exists = await db.user.findUnique({ where: { name } });
  if (exists) return { error: id.errors.nameTaken };

  await db.user.create({
    data: { name, pinHash: await hashPin(pin), role, telegramChatId, groupId },
  });

  revalidatePath("/users");
  revalidatePath("/login");
  revalidatePath("/settings");
  broadcastRealtime("revalidate");
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

  if (telegramChatId && !/^-?\d+$/.test(telegramChatId)) {
    return {
      error:
        "Telegram ID harus berupa angka Chat ID (contoh: 123456789), bukan username @. Buka bot @yonocateringbot dan ketik /start untuk melihat Chat ID.",
    };
  }

  if (!memberId) return { error: id.errors.memberNotFound };

  const target = await db.user.findUnique({ where: { id: memberId } });
  if (!target) return { error: id.errors.memberNotFound };

  await db.user.update({
    where: { id: memberId },
    data: { telegramChatId },
  });

  revalidatePath("/users");
  broadcastRealtime("revalidate");
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
  broadcastRealtime("revalidate");
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
  broadcastRealtime("revalidate");
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
  revalidatePath("/login");
  broadcastRealtime("revalidate");
  return { ok: true };
}

export async function createGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStrictAdmin();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: id.errors.groupNameRequired };

  const existing = await db.group.findFirst({
    where: { name: { equals: name } },
  });
  if (existing) return { error: id.errors.groupNameTaken };

  await db.group.create({
    data: { name },
  });

  revalidatePath("/users");
  revalidatePath("/login");
  broadcastRealtime("revalidate");
  return { ok: true };
}

export async function deleteGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStrictAdmin();

  const groupId = String(formData.get("groupId") ?? "").trim();
  if (!groupId) return { error: id.errors.groupNotFound };

  const existing = await db.group.findUnique({ where: { id: groupId } });
  if (!existing) return { error: id.errors.groupNotFound };

  await db.group.delete({
    where: { id: groupId },
  });

  revalidatePath("/users");
  revalidatePath("/login");
  broadcastRealtime("revalidate");
  return { ok: true };
}

export async function updateUserGroupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireStrictAdmin();

  const memberId = String(formData.get("memberId") ?? "").trim();
  const rawGroupId = String(formData.get("groupId") ?? "").trim();
  const groupId = rawGroupId === "" ? null : rawGroupId;

  if (!memberId) return { error: id.errors.memberNotFound };

  const target = await db.user.findUnique({ where: { id: memberId } });
  if (!target) return { error: id.errors.memberNotFound };

  if (groupId) {
    const groupExists = await db.group.findUnique({ where: { id: groupId } });
    if (!groupExists) return { error: id.errors.groupNotFound };
  }

  await db.user.update({
    where: { id: memberId },
    data: { groupId },
  });

  revalidatePath("/users");
  revalidatePath("/login");
  broadcastRealtime("revalidate");
  return { ok: true };
}

