import { id } from "./id";

type ResponseRow = {
  wants: boolean;
  swapDish: string | null;
  note: string | null;
  user: { name: string };
};

export function buildTally(menuDish: string, responses: ResponseRow[]) {
  const counts = new Map<string, number>();
  const notes: { name: string; note: string }[] = [];

  for (const r of responses) {
    const dish = r.wants ? menuDish : (r.swapDish?.trim() || id.tally.swap);
    counts.set(dish, (counts.get(dish) ?? 0) + 1);
    if (r.note?.trim()) notes.push({ name: r.user.name, note: r.note.trim() });
  }

  const breakdown = [...counts.entries()].map(([dish, count]) => ({ dish, count }));
  const parts = breakdown.map(({ dish, count }) => id.tally.portion(count, dish));
  return {
    summary: parts.join(", ") || id.tally.empty,
    breakdown,
    total: responses.length,
    notes,
  };
}