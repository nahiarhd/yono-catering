import { createHmac, timingSafeEqual } from "crypto";
import type { Role } from "@prisma/client";

export type SessionPayload = {
  userId: string;
  role: Role;
  exp: number;
  /** Fingerprint of the PIN hash at login; changing the PIN invalidates the session */
  pv: string;
};

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return s;
}

export function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
  if (!payload.userId || !payload.role || !payload.exp || !payload.pv) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}