"use client";

import { useActionState, useState } from "react";
import { id } from "@/lib/id";
import type { DefaultDish } from "@/lib/dishes";
import { TimePicker } from "@/components/time-picker";
import { Button, Input, Label, Card } from "./ui";

type State = { error?: string; ok?: boolean };

export function MenuForm({
  action,
  dateKey,
  initial,
  defaultDishes = [],
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  dateKey: string;
  initial?: {
    dish: string;
    subDishes?: string | null;
    note: string | null;
    cutoffOverride: string | null;
  };
  defaultDishes?: (DefaultDish | string)[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const t = id.yono;
  const [dish, setDish] = useState(initial?.dish ?? "");
  const [subDishes, setSubDishes] = useState(initial?.subDishes ?? "");
  const [menuNote, setMenuNote] = useState(initial?.note ?? "");

  const parsedDishes: DefaultDish[] = defaultDishes.map((d) =>
    typeof d === "string" ? { name: d, note: null, subDishes: [] } : d
  );

  function handleSelectPreset(preset: DefaultDish) {
    setDish(preset.name);
    setMenuNote(preset.note || "");
    setSubDishes(
      preset.subDishes && preset.subDishes.length > 0
        ? preset.subDishes.join(", ")
        : ""
    );
  }

  return (
    <Card accent="yellow">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="dateKey" value={dateKey} />

        <div>
          <Label htmlFor="dish">{t.dishLabel}</Label>
          {parsedDishes.length > 0 && (
            <div className="neo-dish-quick">
              <p className="neo-dish-quick-label">{t.dishQuick}</p>
              <div className="neo-dish-chips neo-dish-chips--menu">
                {parsedDishes.map((preset) => {
                  const selected = dish.trim().toLowerCase() === preset.name.trim().toLowerCase();
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      className={`neo-dish-chip neo-dish-chip--menu${selected ? " neo-dish-chip--selected" : ""}`}
                      onClick={() => handleSelectPreset(preset)}
                      aria-pressed={selected}
                      title={preset.name ? `Menu: ${preset.name}` : undefined}
                    >
                      <span className="font-extrabold">{preset.warung || preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <Input
            id="dish"
            name="dish"
            required
            placeholder={t.dishPlaceholder}
            value={dish}
            onChange={(e) => setDish(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="menuNote">{t.noteLabel}</Label>
          <Input
            id="menuNote"
            name="menuNote"
            placeholder={t.notePlaceholder}
            value={menuNote}
            onChange={(e) => setMenuNote(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="subDishes">{t.subDishesLabel}</Label>
          <Input
            id="subDishes"
            name="subDishes"
            placeholder={t.subDishesPlaceholder}
            value={subDishes}
            onChange={(e) => setSubDishes(e.target.value)}
          />
        </div>

        <TimePicker
          name="cutoffOverride"
          label={t.cutoffOverride}
          defaultValue={initial?.cutoffOverride}
          optional
        />

        {state.error && <p className="font-bold text-[var(--danger)]">{state.error}</p>}
        {state.ok && <p className="font-bold text-[var(--success)]">{t.posted}</p>}

        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? t.posting : initial?.dish ? t.update : t.post}
        </Button>
      </form>
    </Card>
  );
}