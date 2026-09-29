export type DefaultDish = {
  name: string;
  note?: string | null;
  subDishes?: string[];
};

export function normalizeDishKey(dish: string): string {
  return dish.trim().toLowerCase();
}

export function parseSubDishes(input: unknown): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of input) {
      if (typeof item !== "string") continue;
      const clean = item.trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
    return out;
  }
  if (typeof input === "string") {
    const seen = new Set<string>();
    const out: string[] = [];
    const parts = input.split(",");
    for (const part of parts) {
      const clean = part.trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(clean);
    }
    return out;
  }
  return [];
}

export function formatSubDishes(subDishes?: string[] | null): string {
  if (!subDishes || subDishes.length === 0) return "";
  return subDishes.join(", ");
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
      out.push({ name, note: null, subDishes: [] });
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
      const rawSub = (item as { subDishes?: unknown }).subDishes;
      const subDishes = parseSubDishes(rawSub);
      out.push({ name, note, subDishes });
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