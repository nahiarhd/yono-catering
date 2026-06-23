import { nowInHousehold, parseDateKey } from "./dates";

export function parseHHMM(value: string): { hours: number; minutes: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

export function effectiveCutoff(
  standingCutoff: string,
  cutoffOverride: string | null | undefined,
): string {
  return cutoffOverride?.trim() || standingCutoff;
}

export function isResponsesLocked(
  menuDateKey: string,
  standingCutoff: string,
  cutoffOverride: string | null | undefined,
  now = new Date(),
): boolean {
  const household = nowInHousehold(now);
  if (menuDateKey < household.dateKey) return true;

  const cutoff = effectiveCutoff(standingCutoff, cutoffOverride);
  const parsed = parseHHMM(cutoff);
  if (!parsed) return false;

  if (menuDateKey > household.dateKey) return false;

  const nowMinutes = household.hours * 60 + household.minutes;
  const cutoffMinutes = parsed.hours * 60 + parsed.minutes;
  return nowMinutes >= cutoffMinutes;
}

export function menuDateToKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function isValidDateKey(key: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const d = parseDateKey(key);
  return !Number.isNaN(d.getTime());
}