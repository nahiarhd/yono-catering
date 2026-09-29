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

  const breakdown = eating.length > 0 ? [{ dish: menuDish, count: eating.length }] : [];
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