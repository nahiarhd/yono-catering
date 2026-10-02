// ponytail: in-memory per process, fine for the single PM2 instance; move to DB if running >1 instance
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

const attempts = new Map<string, { fails: number; lockedUntil: number }>();

/** Minutes left on the lock, 0 when not locked. */
export function loginLockMinutes(userId: string, now = Date.now()): number {
  const a = attempts.get(userId);
  return a && a.lockedUntil > now ? Math.ceil((a.lockedUntil - now) / 60_000) : 0;
}

export function recordLoginFailure(userId: string, now = Date.now()) {
  const a = attempts.get(userId) ?? { fails: 0, lockedUntil: 0 };
  a.fails += 1;
  if (a.fails >= MAX_FAILS) {
    a.fails = 0;
    a.lockedUntil = now + LOCK_MS;
  }
  attempts.set(userId, a);
}

export function clearLoginFailures(userId: string) {
  attempts.delete(userId);
}
