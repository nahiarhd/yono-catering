import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { db } from "./db";
import { signSession, verifySessionToken, type SessionPayload } from "./session";

const COOKIE = "yono_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export { verifySessionToken };

function pinVersion(pinHash: string) {
  return createHash("sha256").update(pinHash).digest("base64url").slice(0, 16);
}

export async function createSession(user: { id: string; role: Role; pinHash: string }) {
  const token = signSession({
    userId: user.id,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
    pv: pinVersion(user.pinHash),
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || pinVersion(user.pinHash) !== session.pv) return null;
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function isAdmin(user: { role: Role }): boolean {
  return user.role === "yono" || user.role === "admin";
}

export function isStrictAdmin(user: { role: Role }): boolean {
  return user.role === "admin";
}

export function canOrder(user: { role: Role }): boolean {
  return user.role === "member" || user.role === "admin";
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/home");
  return user;
}

export async function requireStrictAdmin() {
  const user = await requireUser();
  if (!isStrictAdmin(user)) redirect("/home");
  return user;
}

export async function requireYono() {
  const user = await requireUser();
  if (user.role !== "yono" && user.role !== "admin") redirect("/home");
  return user;
}

export async function verifyPin(pinHash: string, pin: string) {
  return bcrypt.compare(pin, pinHash);
}

export async function hashPin(pin: string) {
  return bcrypt.hash(pin, 10);
}