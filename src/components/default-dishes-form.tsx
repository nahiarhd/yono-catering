"use client";

import { useActionState } from "react";
import { addDefaultDishAction, removeDefaultDishAction } from "@/app/settings/actions";
import type { DefaultDish } from "@/lib/dishes";
import { id } from "@/lib/id";
import { Button, Input, Card } from "./ui";

export function DefaultDishesForm({ dishes }: { dishes: (DefaultDish | string)[] }) {
  const t = id.settings;
  const parsedDishes: DefaultDish[] = dishes.map((d) =>
    typeof d === "string" ? { name: d, note: null } : d
  );

  return (
    <Card>
      <p className="neo-label">{t.defaultDishes}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{t.defaultDishesHint}</p>

      {parsedDishes.length > 0 ? (
        <ul className="neo-dish-list mt-4">
          {parsedDishes.map((dish) => (
            <DefaultDishRow key={dish.name} dish={dish} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">{id.yono.dishPlaceholder}</p>
      )}

      <AddDefaultDishForm />
    </Card>
  );
}

function DefaultDishRow({ dish }: { dish: DefaultDish }) {
  const [state, action, pending] = useActionState(removeDefaultDishAction, {});
  const t = id.settings;

  return (
    <li className="neo-dish-list-item flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5">
      <div className="flex-1">
        <span className="neo-dish-list-label font-bold text-base">{dish.name}</span>
        {dish.note && (
          <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">
            {t.dishNotePrefix} {dish.note}
          </p>
        )}
      </div>
      <form action={action}>
        <input type="hidden" name="dish" value={dish.name} />
        <Button type="submit" variant="danger" disabled={pending} className="text-sm">
          {t.remove}
        </Button>
      </form>
      {state.ok && <p className="neo-dish-list-msg">{t.dishRemoved}</p>}
      {state.error && <p className="neo-dish-list-msg neo-dish-list-msg--error">{state.error}</p>}
    </li>
  );
}

function AddDefaultDishForm() {
  const [state, action, pending] = useActionState(addDefaultDishAction, {});
  const t = id.settings;

  return (
    <form action={action} className="mt-4 flex flex-col gap-3 border-t-2 border-black pt-4">
      <p className="neo-label">{t.addDish}</p>
      <div>
        <label htmlFor="dishNameInput" className="text-xs font-bold uppercase text-[var(--text-muted)] block mb-1">
          {t.dishName}
        </label>
        <Input id="dishNameInput" name="dish" placeholder={t.dishName} required />
      </div>
      <div>
        <label htmlFor="dishNoteInput" className="text-xs font-bold uppercase text-[var(--text-muted)] block mb-1">
          {t.dishNote}
        </label>
        <Input id="dishNoteInput" name="note" placeholder={t.dishNotePlaceholder} />
      </div>
      {state.error && <p className="font-bold text-[var(--danger)]">{state.error}</p>}
      {state.ok && <p className="font-bold text-[var(--success)]">{t.dishAdded}</p>}
      <Button type="submit" disabled={pending}>
        {t.add}
      </Button>
    </form>
  );
}