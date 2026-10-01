import { id } from "./id";
import { parseSubDishes } from "./dishes";

type ResponseRow = {
  wants: boolean;
  swapDish: string | null;
  addOns?: string | null;
  note: string | null;
  user: { name: string };
};

export function buildTally(menuDish: string, responses: ResponseRow[]) {
  const eating = responses.filter((r) => r.wants);
  const notEating = responses.filter((r) => !r.wants);
  const notes: { name: string; note: string }[] = [];

  for (const r of eating) {
    if (r.note?.trim()) notes.push({ name: r.user.name, note: r.note.trim() });
  }

  const dishCounts = new Map<string, number>();
  for (const r of eating) {
    const item = r.swapDish?.trim() || menuDish;
    dishCounts.set(item, (dishCounts.get(item) ?? 0) + 1);
  }

  const breakdown: { dish: string; count: number }[] = [];
  for (const [dish, count] of dishCounts.entries()) {
    breakdown.push({ dish, count });
  }

  const addOnCounts = new Map<string, { count: number; users: string[] }>();
  for (const r of eating) {
    if (r.addOns?.trim()) {
      const items = parseSubDishes(r.addOns);
      for (const item of items) {
        const existing = addOnCounts.get(item) ?? { count: 0, users: [] };
        existing.count += 1;
        existing.users.push(r.user.name);
        addOnCounts.set(item, existing);
      }
    }
  }

  const addOnBreakdown: { name: string; count: number; users: string[] }[] = [];
  for (const [name, data] of addOnCounts.entries()) {
    addOnBreakdown.push({ name, count: data.count, users: data.users });
  }

  const parts = breakdown.map(({ dish, count }) => id.tally.portion(count, dish));
  return {
    summary: parts.join(", ") || id.tally.empty,
    breakdown,
    addOnBreakdown,
    total: eating.length,
    eatingCount: eating.length,
    notEatingCount: notEating.length,
    notes,
  };
}