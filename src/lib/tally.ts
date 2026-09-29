import { id } from "./id";

type ResponseRow = {
  wants: boolean;
  swapDish: string | null;
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

  const parts = breakdown.map(({ dish, count }) => id.tally.portion(count, dish));
  return {
    summary: parts.join(", ") || id.tally.empty,
    breakdown,
    total: eating.length,
    eatingCount: eating.length,
    notEatingCount: notEating.length,
    notes,
  };
}