/** One dish a warung serves, with the variants and add-ons that only apply to it */
export type DishOption = { name: string; variants: string[]; addOns: string[] };

export type DefaultDish = {
  warung?: string | null;
  /** Dish names joined with ", "; also the key member preferences are saved under */
  name: string;
  note?: string | null;
  subDishes?: string[];
  addOns?: string[];
  dishes?: DishOption[];
};

export function normalizeDishKey(dish: string): string {
  return dish.trim().toLowerCase();
}

export function parseSubDishes(input: unknown): string[] {
  if (!input) return [];
  const rawList = Array.isArray(input) ? input : typeof input === "string" ? input.split(",") : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of rawList) {
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

export function formatSubDishes(subDishes?: string[] | null): string {
  if (!subDishes || subDishes.length === 0) return "";
  return subDishes.join(", ");
}

/** Reads untrusted JSON (form input or DB) into clean dish options, dropping blanks and duplicates. */
export function parseDishOptions(value: unknown): DishOption[] {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DishOption[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as { name?: unknown; variants?: unknown; addOns?: unknown };
    const name = typeof o.name === "string" ? o.name.replace(/,/g, " ").trim() : "";
    if (!name || seen.has(name.toLowerCase())) continue;
    seen.add(name.toLowerCase());
    out.push({ name, variants: parseSubDishes(o.variants), addOns: parseSubDishes(o.addOns) });
  }
  return out;
}

/** The dish/variant/add-on columns a menu or preset stores, derived from its dish options. */
export function flattenDishOptions(options: DishOption[]) {
  const variants = parseSubDishes(options.flatMap((o) => o.variants));
  const addOns = parseSubDishes(options.flatMap((o) => o.addOns));
  return {
    dish: options.map((o) => o.name).join(", "),
    subDishes: variants.length > 0 ? formatSubDishes(variants) : null,
    addOns: addOns.length > 0 ? formatSubDishes(addOns) : null,
  };
}

/**
 * Per-dish options of a menu. Older menus stored one shared variant/add-on list,
 * so every dish gets that whole list.
 */
export function menuDishOptions(menu: {
  dish: string;
  subDishes?: string | null;
  addOns?: string | null;
  dishOptions?: unknown;
}): DishOption[] {
  const stored = parseDishOptions(menu.dishOptions);
  if (stored.length > 0) return stored;
  const variants = parseSubDishes(menu.subDishes);
  const addOns = parseSubDishes(menu.addOns);
  return parseSubDishes(menu.dish).map((name) => ({ name, variants, addOns }));
}

/** Options for a preset, with the same fallback as menuDishOptions for presets saved before per-dish options. */
export function presetDishOptions(preset: DefaultDish): DishOption[] {
  return menuDishOptions({
    dish: preset.name,
    subDishes: formatSubDishes(preset.subDishes),
    addOns: formatSubDishes(preset.addOns),
    dishOptions: preset.dishes,
  });
}

/** Which dish option a stored pick ("Dish (Variant)", "Variant" or "Dish") belongs to. */
export function splitSelection(
  options: DishOption[],
  swapDish: string | null | undefined,
): { dish: string; variant: string } {
  const raw = swapDish?.trim() ?? "";
  const lower = raw.toLowerCase();
  if (options.length > 1) {
    for (const o of options) {
      const n = o.name.toLowerCase();
      if (lower === n) return { dish: o.name, variant: "" };
      if (lower.startsWith(`${n} (`) && lower.endsWith(")")) {
        const v = raw.slice(o.name.length + 2, -1);
        return { dish: o.name, variant: o.variants.find((x) => x.toLowerCase() === v.toLowerCase()) ?? "" };
      }
    }
    return { dish: "", variant: "" };
  }
  const only = options[0];
  if (!only) return { dish: "", variant: "" };
  return { dish: only.name, variant: only.variants.find((x) => x.toLowerCase() === lower) ?? "" };
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
      out.push({ warung: null, name, note: null, subDishes: [], addOns: [] });
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
      const rawWarung = (item as { warung?: unknown }).warung;
      const warung = typeof rawWarung === "string" ? rawWarung.trim() || null : null;
      const rawNote = (item as { note?: unknown }).note;
      const note = typeof rawNote === "string" ? rawNote.trim() || null : null;
      const rawSub = (item as { subDishes?: unknown }).subDishes;
      const subDishes = parseSubDishes(rawSub);
      const rawAddOns = (item as { addOns?: unknown }).addOns;
      const addOns = parseSubDishes(rawAddOns);
      const dishes = parseDishOptions((item as { dishes?: unknown }).dishes);
      out.push({ warung, name, note, subDishes, addOns, ...(dishes.length > 0 ? { dishes } : {}) });
    }
  }
  return out;
}

export function computeSelectionDish({
  isMultiDish,
  selectedDish,
  selectedVariant,
}: {
  isMultiDish: boolean;
  selectedDish?: string | null;
  selectedVariant?: string | null;
}): string {
  const d = selectedDish?.trim() || "";
  const v = selectedVariant?.trim() || "";
  if (isMultiDish) {
    if (!d) return "";
    return v ? `${d} (${v})` : d;
  }
  return v || d;
}
/**
 * Validates a member's pick against the posted menu (case-insensitive, canonical casing kept)
 * and returns it in the same shape Yono's recording stores, so tallies group together.
 */
export function resolveMenuSelection(
  menu: { dish: string; subDishes: string | null; addOns: string | null; dishOptions?: unknown },
  input: { selectedDish: string; selectedVariant: string; addOns: string },
): "dishRequired" | "variantRequired" | { swapDish: string | null; addOns: string | null } {
  const pick = (options: string[], value: string) =>
    options.find((o) => o.toLowerCase() === value.trim().toLowerCase());
  const options = menuDishOptions(menu);

  const isMultiDish = options.length > 1;
  const option = isMultiDish
    ? options.find((o) => o.name.toLowerCase() === input.selectedDish.trim().toLowerCase())
    : options[0];
  if (isMultiDish && !option) return "dishRequired";

  const variants = option?.variants ?? [];
  const variant = pick(variants, input.selectedVariant);
  if (variants.length > 0 && !variant) return "variantRequired";

  const menuAddOns = option?.addOns ?? [];
  const addOns = parseSubDishes(input.addOns)
    .map((a) => pick(menuAddOns, a))
    .filter((a): a is string => Boolean(a));

  return {
    swapDish:
      // A single-dish menu stores null for the plain dish, as before per-dish options
      computeSelectionDish({ isMultiDish, selectedDish: isMultiDish ? option?.name : undefined, selectedVariant: variant }) ||
      null,
    addOns: addOns.length > 0 ? formatSubDishes(addOns) : null,
  };
}
