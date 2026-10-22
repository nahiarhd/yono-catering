import { isValidDateKey } from "./cutoff";
import { menuDishOptions, resolveMenuSelection } from "./dishes";
import { escapeHtml } from "./telegram";

// The whole order-in-progress rides in callback_data (Telegram caps it at 64 bytes), so no session table.
export type OrderState = {
  date: string;
  /** Index of the day's warung, by posting order; unset until picked when there are several. */
  menu?: number;
  wants?: boolean;
  dish?: number;
  variant?: number;
  addOnMask: number;
  addOnsDone: boolean;
};

export type InlineButton = { text: string; callback_data?: string; url?: string };
export type InlineKeyboard = InlineButton[][];

type OrderMenu = {
  vendor?: string;
  dish: string;
  subDishes: string | null;
  addOns: string | null;
  dishOptions?: unknown;
};
type CurrentResponse = { wants: boolean; swapDish: string | null; addOns: string | null };

export function encodeOrder(s: OrderState, save = false): string {
  const w = s.wants === undefined ? "" : s.wants ? "1" : "0";
  // Tag "m" (was "o" before multi-warung) so buttons from older messages are rejected, not misread
  return [
    "m",
    s.date,
    s.menu ?? "",
    w,
    s.dish ?? "",
    s.variant ?? "",
    s.addOnMask,
    s.addOnsDone ? "1" : "0",
    ...(save ? ["s"] : []),
  ].join(":");
}

export function decodeOrder(data: string): { state: OrderState; save: boolean } | null {
  const [tag, date, menu, w, dish, variant, mask, done, save, ...rest] = data.split(":");
  if (tag !== "m" || rest.length > 0 || !isValidDateKey(date ?? "")) return null;
  const index = (v: string | undefined) => (v && /^\d{1,2}$/.test(v) ? Number(v) : undefined);
  if (!["", "0", "1"].includes(w ?? "x") || !/^\d{1,9}$/.test(mask ?? "")) return null;
  if ((save ?? "s") !== "s") return null;
  return {
    state: {
      date,
      menu: index(menu),
      wants: w === "" ? undefined : w === "1",
      dish: index(dish),
      variant: index(variant),
      addOnMask: Number(mask),
      addOnsDone: done === "1",
    },
    save: save === "s",
  };
}

export function startOrder(date: string): OrderState {
  return { date, addOnMask: 0, addOnsDone: false };
}

/** Variants and add-ons come from the picked dish (the only one when there is just one). */
function options(menu: OrderMenu, s: OrderState) {
  const all = menuDishOptions(menu);
  const picked = all.length > 1 ? all[s.dish ?? -1] : all[0];
  return {
    dishes: all.map((o) => o.name),
    variants: picked?.variants ?? [],
    addOns: picked?.addOns ?? [],
  };
}

/** Turns button indexes into the same validated shape the web form saves. */
export function orderSelection(
  menu: OrderMenu,
  s: OrderState,
): { wants: boolean; swapDish: string | null; addOns: string | null } | null {
  if (s.wants === undefined) return null;
  if (!s.wants) return { wants: false, swapDish: null, addOns: null };
  const { dishes, variants, addOns } = options(menu, s);
  const picked = resolveMenuSelection(menu, {
    selectedDish: dishes[s.dish ?? -1] ?? "",
    selectedVariant: variants[s.variant ?? -1] ?? "",
    addOns: addOns.filter((_, i) => s.addOnMask & (1 << i)).join(","),
  });
  return typeof picked === "string" ? null : { wants: true, ...picked };
}

export function describeOrder(menu: OrderMenu, r: CurrentResponse): string {
  if (!r.wants) return "Tidak pesan";
  const dish = r.swapDish || menu.dish;
  return r.addOns ? `${dish} + ${r.addOns}` : dish;
}

export function orderEntryKeyboard(date: string, appUrl: string): InlineKeyboard {
  const row: InlineButton[] = [{ text: "🍽️ Pesan di sini", callback_data: encodeOrder(startOrder(date)) }];
  // Telegram rejects url buttons pointing at http/localhost, which would fail the whole send in dev
  if (appUrl.startsWith("https://")) row.push({ text: "🌐 Buka web", url: `${appUrl}/home` });
  return [row];
}

export function renderWarungScreen(
  menus: OrderMenu[],
  s: OrderState,
  current?: { menu: OrderMenu; response: CurrentResponse } | null,
): { text: string; keyboard: InlineKeyboard } {
  const now = current
    ? `\nPesananmu sekarang: <b>${escapeHtml(describeOrder(current.menu, current.response))}</b>`
    : "";
  return {
    text: `🍽️ Hari ini ada ${menus.length} warung.${now}\n\nMau pesan dari warung mana?`,
    keyboard: menus.map((m, i) => [
      { text: `${m.vendor || m.dish}`, callback_data: encodeOrder({ ...s, menu: i }) },
    ]),
  };
}

export function renderOrderScreen(
  menu: OrderMenu,
  s: OrderState,
  current?: CurrentResponse | null,
): { text: string; keyboard: InlineKeyboard } {
  const { dishes, variants, addOns } = options(menu, s);
  const at = menu.vendor && menu.vendor !== menu.dish ? ` (${escapeHtml(menu.vendor)})` : "";
  const head = `🍽️ Menu hari ini${at}: <b>${escapeHtml(menu.dish)}</b>`;
  const go = (next: Partial<OrderState>, save = false) => encodeOrder({ ...s, ...next }, save);
  const restart: InlineButton[] = [{ text: "↩️ Ulangi", callback_data: encodeOrder(startOrder(s.date)) }];

  if (s.wants === undefined) {
    const now = current ? `\nPesananmu sekarang: <b>${escapeHtml(describeOrder(menu, current))}</b>` : "";
    return {
      text: `${head}${now}\n\nMau pesan makan malam?`,
      keyboard: [[
        { text: "✅ Mau", callback_data: go({ wants: true }) },
        { text: "❌ Tidak", callback_data: go({ wants: false }) },
      ]],
    };
  }

  if (s.wants && dishes.length > 1 && dishes[s.dish ?? -1] === undefined) {
    return {
      text: `${head}\n\nPilih menunya:`,
      keyboard: [...dishes.map((d, i) => [{ text: d, callback_data: go({ dish: i }) }]), restart],
    };
  }

  if (s.wants && variants.length > 0 && variants[s.variant ?? -1] === undefined) {
    return {
      text: `${head}\n\nPilih variannya:`,
      keyboard: [...variants.map((v, i) => [{ text: v, callback_data: go({ variant: i }) }]), restart],
    };
  }

  if (s.wants && addOns.length > 0 && !s.addOnsDone) {
    return {
      text: `${head}\n\nTambah add-on? Boleh lebih dari satu, atau langsung lanjut.`,
      keyboard: [
        ...addOns.map((a, i) => {
          const on = Boolean(s.addOnMask & (1 << i));
          return [{ text: `${on ? "☑️" : "⬜"} ${a}`, callback_data: go({ addOnMask: s.addOnMask ^ (1 << i) }) }];
        }),
        [{ text: "Lanjut ➡️", callback_data: go({ addOnsDone: true }) }],
        restart,
      ],
    };
  }

  const picked = orderSelection(menu, s);
  if (!picked) return renderOrderScreen(menu, startOrder(s.date), current);
  return {
    text: `${head}\n\nPesananmu: <b>${escapeHtml(describeOrder(menu, picked))}</b>\nSudah benar?`,
    keyboard: [[{ text: "✅ Simpan", callback_data: go({}, true) }, ...restart]],
  };
}

export function renderSavedScreen(
  menu: OrderMenu,
  saved: CurrentResponse,
  date: string,
  cutoff: string,
): { text: string; keyboard: InlineKeyboard } {
  return {
    text: [
      `✅ Tersimpan: <b>${escapeHtml(describeOrder(menu, saved))}</b>`,
      `Masih bisa diubah sampai jam <b>${escapeHtml(cutoff)} WIB</b>.`,
    ].join("\n"),
    keyboard: [[{ text: "✏️ Ubah pesanan", callback_data: encodeOrder(startOrder(date)) }]],
  };
}
