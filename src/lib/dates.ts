// ponytail: single household timezone via env, not per-user
function tz() {
  return process.env.HOUSEHOLD_TZ ?? "Asia/Jakarta";
}

export function getHouseholdTz() {
  return tz();
}

/** YYYY-MM-DD in household timezone */
export function todayKey(now = new Date()): string {
  return formatDateKey(now);
}

export function formatDateKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz() }).format(date);
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dayFormatter(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("id-ID", { timeZone: tz(), ...options });
}

/** Judul halaman — Senin, 23 Juni 2026 */
export function formatDisplayDate(key: string): string {
  return dayFormatter({
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDateKey(key));
}

/** Banner kalender — Senin, 23 Juni */
export function formatDayHeading(key: string): string {
  return dayFormatter({
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseDateKey(key));
}

/** Nama hari saja — Senin */
export function formatWeekdayName(key: string): string {
  return dayFormatter({ weekday: "long" }).format(parseDateKey(key));
}

export function nowInHousehold(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz(),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hours: Number(get("hour")),
    minutes: Number(get("minute")),
    hhmm: `${get("hour")}:${get("minute")}`,
  };
}