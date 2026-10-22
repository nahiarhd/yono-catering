"use client";

import { useId, useState, type KeyboardEvent } from "react";
import type { DishOption } from "@/lib/dishes";
import { Button, Input } from "./ui";

export const emptyDishOption = (): DishOption => ({ name: "", variants: [], addOns: [] });

/**
 * Edits a warung's dishes, each with its own variants and add-ons.
 * With `name`, the value is also submitted as JSON in a hidden input.
 */
export function DishOptionsEditor({
  value,
  onChange,
  name,
}: {
  value: DishOption[];
  onChange: (next: DishOption[]) => void;
  name?: string;
}) {
  const rows = value.length > 0 ? value : [emptyDishOption()];
  const update = (i: number, patch: Partial<DishOption>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="flex flex-col gap-3">
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(rows.filter((r) => r.name.trim()))}
        />
      )}
      {rows.map((row, i) => (
        <DishRow
          key={i}
          index={i}
          row={row}
          canRemove={rows.length > 1}
          onChange={(patch) => update(i, patch)}
          onRemove={() => onChange(rows.filter((_, j) => j !== i))}
        />
      ))}
      <Button
        type="button"
        variant="ghost"
        onClick={() => onChange([...rows, emptyDishOption()])}
        className="min-h-[44px] self-start text-sm"
      >
        + Tambah menu lain di warung ini
      </Button>
    </div>
  );
}

function DishRow({
  index,
  row,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  row: DishOption;
  canRemove: boolean;
  onChange: (patch: Partial<DishOption>) => void;
  onRemove: () => void;
}) {
  const nameId = useId();
  return (
    <fieldset className="border-2 border-black bg-white p-3">
      <legend className="px-1 text-xs font-black uppercase">Menu {index + 1}</legend>
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={nameId} className="mb-1 block text-xs font-bold text-[var(--text-muted)]">
            Nama menu
          </label>
          <Input
            id={nameId}
            value={row.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="contoh: Bakmi Goreng"
            className="w-full"
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="danger"
            onClick={onRemove}
            className="min-h-[44px] shrink-0 text-xs"
            aria-label={`Hapus menu ${row.name || index + 1}`}
          >
            Hapus
          </Button>
        )}
      </div>
      <div className="mt-3 flex flex-col gap-3">
        <ChipInput
          label="Varian (wajib dipilih pemesan)"
          placeholder="contoh: Pedas, lalu Enter"
          items={row.variants}
          onChange={(variants) => onChange({ variants })}
          tone="bg-amber-100"
        />
        <ChipInput
          label="Add-on (boleh pilih beberapa)"
          placeholder="contoh: Telor, lalu Enter"
          items={row.addOns}
          onChange={(addOns) => onChange({ addOns })}
          tone="bg-emerald-100"
        />
      </div>
    </fieldset>
  );
}

function ChipInput({
  label,
  placeholder,
  items,
  onChange,
  tone,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (next: string[]) => void;
  tone: string;
}) {
  const inputId = useId();
  const [draft, setDraft] = useState("");

  // Comma-separated paste adds several at once; pending text is kept on blur so nothing typed is lost
  function commit() {
    const added = draft
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && !items.some((x) => x.toLowerCase() === s.toLowerCase()));
    if (added.length > 0) onChange([...items, ...new Set(added)]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !draft && items.length > 0) {
      onChange(items.slice(0, -1));
    }
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-xs font-bold text-[var(--text-muted)]">
        {label}
      </label>
      {items.length > 0 && (
        <ul className="mb-1.5 flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li key={item} className={`flex items-center border border-black text-xs font-bold ${tone}`}>
              <span className="py-1 pl-2">{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((x) => x !== item))}
                className="min-h-[32px] min-w-[32px] px-2 font-black hover:bg-black hover:text-white"
                aria-label={`Hapus ${item}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={inputId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        className="w-full text-sm"
        enterKeyHint="done"
      />
    </div>
  );
}
