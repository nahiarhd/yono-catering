export type CalendarCell =
  | { type: "empty" }
  | { type: "day"; day: number; key: string; disabled?: boolean };

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Monday-first offset: 0 = Monday … 6 = Sunday */
export function firstWeekdayMonday(year: number, month: number): number {
  const sunday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  return sunday === 0 ? 6 : sunday - 1;
}

export function toDateKey(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function parseKeyParts(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { year: y, month: m - 1, day: d };
}

export function buildMonthGrid(
  year: number,
  month: number,
  minDateKey?: string,
): CalendarCell[] {
  const lead = firstWeekdayMonday(year, month);
  const total = daysInMonth(year, month);
  const cells: CalendarCell[] = [];
  for (let i = 0; i < lead; i++) cells.push({ type: "empty" });
  for (let day = 1; day <= total; day++) {
    const key = toDateKey(year, month, day);
    const disabled = Boolean(minDateKey && key < minDateKey);
    cells.push({ type: "day", day, key, disabled });
  }
  return cells;
}


export function formatMonthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}