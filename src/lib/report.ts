import { formatDateKey } from "./dates";

type ReportInputMenu = {
  id: string;
  date: Date;
  vendor: string;
  dish: string;
  note: string | null;
  responses: {
    wants: boolean;
    swapDish: string | null;
    addOns: string | null;
    note: string | null;
    user: { id: string; name: string; role: string; group: { name: string } | null };
  }[];
};

export type ReportOrder = { name: string; item: string; note: string | null };

export type ReportWarung = {
  id: string;
  label: string;
  note: string | null;
  portions: number;
  /** Same item = same dish + add-ons, so the kitchen can read counts straight off */
  items: { label: string; count: number }[];
  orders: ReportOrder[];
  skipped: string[];
};

export type ReportDay = { dateKey: string; portions: number; warungs: ReportWarung[] };

export type ReportPerson = {
  name: string;
  group: string | null;
  eaten: number;
  skipped: number;
  dates: string[];
};

/** Turns a date range of menus into per-day and per-person recaps; Pak Yono's own answers are left out. */
export function buildReport(menus: ReportInputMenu[]) {
  const days = new Map<string, ReportDay>();
  const people = new Map<string, ReportPerson>();

  for (const menu of menus) {
    const dateKey = formatDateKey(menu.date);
    const day = days.get(dateKey) ?? { dateKey, portions: 0, warungs: [] };
    days.set(dateKey, day);

    const responses = menu.responses.filter((r) => r.user.role !== "yono");
    const items = new Map<string, number>();
    const orders: ReportOrder[] = [];
    const skipped: string[] = [];

    for (const r of responses) {
      const person = people.get(r.user.id) ?? {
        name: r.user.name,
        group: r.user.group?.name ?? null,
        eaten: 0,
        skipped: 0,
        dates: [],
      };
      people.set(r.user.id, person);

      if (!r.wants) {
        person.skipped++;
        skipped.push(r.user.name);
        continue;
      }
      const dish = r.swapDish?.trim() || menu.dish;
      const item = r.addOns?.trim() ? `${dish} + ${r.addOns.trim()}` : dish;
      items.set(item, (items.get(item) ?? 0) + 1);
      orders.push({ name: r.user.name, item, note: r.note?.trim() || null });
      person.eaten++;
      person.dates.push(dateKey);
    }

    day.portions += orders.length;
    day.warungs.push({
      id: menu.id,
      label: menu.vendor && menu.vendor !== menu.dish ? `${menu.vendor} · ${menu.dish}` : menu.dish,
      note: menu.note,
      portions: orders.length,
      items: [...items].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
      orders,
      skipped,
    });
  }

  const dayList = [...days.values()].sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  const totalPortions = dayList.reduce((n, d) => n + d.portions, 0);
  return {
    days: dayList,
    people: [...people.values()].sort((a, b) => b.eaten - a.eaten || a.name.localeCompare(b.name)),
    totalPortions,
    // Days with a posted menu, not warungs: two warungs on one day is still one catering day
    totalDays: dayList.length,
  };
}
