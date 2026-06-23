"use client";

import { useActionState } from "react";
import { addDefaultDishAction, removeDefaultDishAction } from "@/app/settings/actions";
import { id } from "@/lib/id";
import { Button, Input, Card } from "./ui";

export function DefaultDishesForm({ dishes }: { dishes: string[] }) {
  const t = id.settings;

  return (
    <Card>
      <p className="neo-label">{t.defaultDishes}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{t.defaultDishesHint}</p>

      {dishes.length > 0 ? (
        <ul className="neo-dish-list mt-4">
          {dishes.map((dish) => (
            <DefaultDishRow key={dish} dish={dish} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">{id.yono.dishPlaceholder}</p>
      )}

      <AddDefaultDishForm />
    </Card>
  );
}

function DefaultDishRow({ dish }: { dish: string }) {
  const [state, action, pending] = useActionState(removeDefaultDishAction, {});
  const t = id.settings;

  return (
    <li className="neo-dish-list-item">
      <span className="neo-dish-list-label">{dish}</span>
      <form action={action}>
        <input type="hidden" name="dish" value={dish} />
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
      <Input name="dish" placeholder={t.dishName} required />
      {state.error && <p className="font-bold text-[var(--danger)]">{state.error}</p>}
      {state.ok && <p className="font-bold text-[var(--success)]">{t.dishAdded}</p>}
      <Button type="submit" disabled={pending}>
        {t.add}
      </Button>
    </form>
  );
}