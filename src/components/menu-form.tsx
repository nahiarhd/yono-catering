"use client";

import { useActionState, useState } from "react";
import { id } from "@/lib/id";
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
  initial?: { dish: string; note: string | null; cutoffOverride: string | null };
  defaultDishes?: string[];
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const t = id.yono;
  const [dish, setDish] = useState(initial?.dish ?? "");

  return (
    <Card accent="yellow">
      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="dateKey" value={dateKey} />

        <div>
          <Label htmlFor="dish">{t.dishLabel}</Label>
          {defaultDishes.length > 0 && (
            <div className="neo-dish-quick">
              <p className="neo-dish-quick-label">{t.dishQuick}</p>
              <div className="neo-dish-chips neo-dish-chips--menu">
                {defaultDishes.map((preset) => {
                  const selected = dish.trim().toLowerCase() === preset.trim().toLowerCase();
                  return (
                    <button
                      key={preset}
                      type="button"
                      className={`neo-dish-chip neo-dish-chip--menu${selected ? " neo-dish-chip--selected" : ""}`}
                      onClick={() => setDish(preset)}
                      aria-pressed={selected}
                    >
                      {preset}
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
            defaultValue={initial?.note ?? ""}
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