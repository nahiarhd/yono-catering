export function normalizeDishKey(dish: string): string {
  return dish.trim().toLowerCase();
}

export function parseDefaultDishes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== "string") continue;
    const label = item.trim();
    if (!label) continue;
    const key = normalizeDishKey(label);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(label);
  }
  return out;
}

export function dishLabelForKey(dishes: string[], key: string): string {
  const normalized = normalizeDishKey(key);
  return dishes.find((d) => normalizeDishKey(d) === normalized) ?? key;
}