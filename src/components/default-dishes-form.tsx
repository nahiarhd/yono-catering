"use client";

import { useState, useEffect, useActionState } from "react";
import {
  addDefaultDishAction,
  updateDefaultDishAction,
  removeDefaultDishAction,
} from "@/app/settings/actions";
import { formatSubDishes, type DefaultDish } from "@/lib/dishes";
import { id } from "@/lib/id";
import { Button, Input, Card } from "./ui";

export function DefaultDishesForm({ dishes }: { dishes: (DefaultDish | string)[] }) {
  const t = id.settings;
  const [editingDishName, setEditingDishName] = useState<string | null>(null);

  const parsedDishes: DefaultDish[] = dishes.map((d) =>
    typeof d === "string" ? { name: d, note: null } : d
  );

  return (
    <Card>
      <p className="neo-label">{t.defaultDishes}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{t.defaultDishesHint}</p>

      {parsedDishes.length > 0 ? (
        <ul className="neo-dish-list mt-4 space-y-2">
          {parsedDishes.map((dish) => (
            <DefaultDishRow
              key={dish.name}
              dish={dish}
              isEditing={editingDishName === dish.name}
              onStartEdit={() => setEditingDishName(dish.name)}
              onCancelEdit={() => setEditingDishName(null)}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">{id.yono.dishPlaceholder}</p>
      )}

      <AddDefaultDishForm />
    </Card>
  );
}

function DefaultDishRow({
  dish,
  isEditing,
  onStartEdit,
  onCancelEdit,
}: {
  dish: DefaultDish;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}) {
  const [state, action, pending] = useActionState(removeDefaultDishAction, {});
  const t = id.settings;

  if (isEditing) {
    return (
      <li className="neo-dish-list-item border-2 border-black bg-[var(--surface-sunken)] p-3">
        <EditDefaultDishForm dish={dish} onDone={onCancelEdit} />
      </li>
    );
  }

  return (
    <li className="neo-dish-list-item flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3">
      <div className="flex-1 min-w-0">
        <span className="neo-dish-list-label font-black text-base">{dish.name}</span>
        {dish.note && (
          <p className="text-xs font-semibold text-[var(--text-muted)] mt-1">
            {t.dishNotePrefix} {dish.note}
          </p>
        )}
        {dish.subDishes && dish.subDishes.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span className="text-[11px] font-bold text-[var(--text-muted)] mr-1">
              {t.dishSubDishesPrefix}
            </span>
            {dish.subDishes.map((sub) => (
              <span
                key={sub}
                className="text-[10px] font-bold bg-amber-100 border border-black px-1.5 py-0.5"
              >
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Button
          type="button"
          onClick={onStartEdit}
          className="text-xs font-bold"
          aria-label={`Edit ${dish.name}`}
        >
          {t.edit}
        </Button>
        <form action={action}>
          <input type="hidden" name="dish" value={dish.name} />
          <Button
            type="submit"
            variant="danger"
            disabled={pending}
            className="text-xs font-bold"
            aria-label={`Hapus ${dish.name}`}
          >
            {t.remove}
          </Button>
        </form>
      </div>
      {state.ok && <p className="neo-dish-list-msg">{t.dishRemoved}</p>}
      {state.error && <p className="neo-dish-list-msg neo-dish-list-msg--error">{state.error}</p>}
    </li>
  );
}

function EditDefaultDishForm({
  dish,
  onDone,
}: {
  dish: DefaultDish;
  onDone: () => void;
}) {
  const [state, action, pending] = useActionState(updateDefaultDishAction, {});
  const t = id.settings;

  useEffect(() => {
    if (state.ok) {
      onDone();
    }
  }, [state.ok, onDone]);

  const subDishesValue = formatSubDishes(dish.subDishes);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="originalDish" value={dish.name} />
      <div className="flex items-center justify-between">
        <p className="neo-label text-xs uppercase">{t.editDish}</p>
        <span className="text-xs font-bold text-[var(--text-muted)] truncate max-w-[200px]">
          {dish.name}
        </span>
      </div>

      <div>
        <label
          htmlFor={`edit-dish-${dish.name}`}
          className="text-xs font-bold uppercase text-[var(--text-muted)] block mb-1"
        >
          {t.dishName}
        </label>
        <Input
          id={`edit-dish-${dish.name}`}
          name="dish"
          defaultValue={dish.name}
          required
        />
      </div>

      <div>
        <label
          htmlFor={`edit-note-${dish.name}`}
          className="text-xs font-bold uppercase text-[var(--text-muted)] block mb-1"
        >
          {t.dishNote}
        </label>
        <Input
          id={`edit-note-${dish.name}`}
          name="note"
          defaultValue={dish.note ?? ""}
          placeholder={t.dishNotePlaceholder}
        />
      </div>

      <div>
        <label
          htmlFor={`edit-sub-${dish.name}`}
          className="text-xs font-bold uppercase text-[var(--text-muted)] block mb-1"
        >
          {t.dishSubDishes}
        </label>
        <Input
          id={`edit-sub-${dish.name}`}
          name="subDishes"
          defaultValue={subDishesValue}
          placeholder={t.dishSubDishesPlaceholder}
        />
      </div>

      {state.error && <p className="font-bold text-xs text-[var(--danger)]">{state.error}</p>}

      <div className="flex items-center gap-2 mt-1">
        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          className="text-xs font-bold flex-1"
        >
          {pending ? "Menyimpan…" : t.saveDish}
        </Button>
        <Button
          type="button"
          onClick={onDone}
          disabled={pending}
          className="text-xs font-bold"
        >
          {t.cancel}
        </Button>
      </div>
    </form>
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
      <div>
        <label htmlFor="dishSubDishesInput" className="text-xs font-bold uppercase text-[var(--text-muted)] block mb-1">
          {t.dishSubDishes}
        </label>
        <Input id="dishSubDishesInput" name="subDishes" placeholder={t.dishSubDishesPlaceholder} />
      </div>
      {state.error && <p className="font-bold text-[var(--danger)]">{state.error}</p>}
      {state.ok && <p className="font-bold text-[var(--success)]">{t.dishAdded}</p>}
      <Button type="submit" disabled={pending}>
        {t.add}
      </Button>
    </form>
  );
}