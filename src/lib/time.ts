import { parseHHMM } from "./cutoff";

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
export const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
export const TIME_PRESETS = ["06:00", "07:00", "08:00", "09:00"] as const;

export function formatHHMM(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseTimeValue(value: string | null | undefined) {
  if (!value?.trim()) return { hours: 8, minutes: 0 };
  const parsed = parseHHMM(value.trim());
  if (!parsed) return { hours: 8, minutes: 0 };
  const minutes = MINUTES.includes(parsed.minutes)
    ? parsed.minutes
    : MINUTES.reduce((a, b) =>
        Math.abs(b - parsed.minutes) < Math.abs(a - parsed.minutes) ? b : a,
      );
  return { hours: parsed.hours, minutes };
}

export function applyPreset(preset: string) {
  const parsed = parseHHMM(preset);
  if (!parsed) return { hours: 8, minutes: 0 };
  return parsed;
}

export function stepHour(hours: number, delta: 1 | -1) {
  return (hours + delta + 24) % 24;
}

export function stepMinute(minutes: number, delta: 1 | -1) {
  const idx = MINUTES.indexOf(minutes);
  const base = idx === -1 ? 0 : idx;
  return MINUTES[(base + delta + MINUTES.length) % MINUTES.length];
}