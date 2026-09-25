export type DefaultDish = {
  name: string;
  note?: string | null;
};

export function normalizeDishKey(dish: string): string {
  return dish.trim().toLowerCase();
}

export function parseDefaultDishes(value: unknown): DefaultDish[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: DefaultDish[] = [];
  for (const item of value) {
    if (typeof item === "string") {
      const name = item.trim();
      if (!name) continue;
      const key = normalizeDishKey(name);
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, note: null });
    } else if (
      item &&
      typeof item === "object" &&
      "name" in item &&
      typeof (item as { name: unknown }).name === "string"
    ) {
      const name = (item as { name: string }).name.trim();
      if (!name) continue;
      const key = normalizeDishKey(name);
      if (seen.has(key)) continue;
      seen.add(key);
      const rawNote = (item as { note?: unknown }).note;
      const note = typeof rawNote === "string" ? rawNote.trim() || null : null;
      out.push({ name, note });
    }
  }
  return out;
}

export function dishLabelForKey(dishes: (DefaultDish | string)[], key: string): string {
  const normalized = normalizeDishKey(key);
  const found = dishes.find((d) => {
    const name = typeof d === "string" ? d : d.name;
    return normalizeDishKey(name) === normalized;
  });
  if (!found) return key;
  return typeof found === "string" ? found : found.name;
}