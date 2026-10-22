"use client";

import { useState, useEffect, useActionState, useId } from "react";
import {
  addDefaultDishAction,
  updateDefaultDishAction,
  removeDefaultDishAction,
} from "@/app/settings/actions";
import { presetDishOptions, type DefaultDish, type DishOption } from "@/lib/dishes";
import { id } from "@/lib/id";
import { Button, Input, Card } from "./ui";
import { DishOptionsList } from "./dish-options-list";
import { DishOptionsEditor, emptyDishOption } from "./dish-options-editor";

export function DefaultDishesForm({ dishes }: { dishes: DefaultDish[] }) {
  const t = id.settings;
  // One form open at a time: a preset being edited, "new", or none
  const [open, setOpen] = useState<string | null>(dishes.length === 0 ? "new" : null);

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="neo-label">{t.defaultDishes}</p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{t.defaultDishesHint}</p>
        </div>
        {open !== "new" && (
          <Button
            type="button"
            variant="primary"
            onClick={() => setOpen("new")}
            className="min-h-[44px] shrink-0 text-sm"
          >
            + {t.addDish}
          </Button>
        )}
      </div>

      {open === "new" && (
        <div className="mt-4 border-2 border-black bg-amber-50 p-3">
          <PresetForm onDone={() => setOpen(null)} canCancel={dishes.length > 0} />
        </div>
      )}

      {dishes.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-3">
          {dishes.map((dish) => (
            <li key={dish.name} className="border-2 border-black bg-white p-3">
              {open === dish.name ? (
                <PresetForm preset={dish} onDone={() => setOpen(null)} canCancel />
              ) : (
                <PresetRow dish={dish} onEdit={() => setOpen(dish.name)} />
              )}
            </li>
          ))}
        </ul>
      ) : (
        open !== "new" && (
          <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">{t.noDefaultDishes}</p>
        )
      )}
    </Card>
  );
}

function PresetRow({ dish, onEdit }: { dish: DefaultDish; onEdit: () => void }) {
  const [state, action, pending] = useActionState(removeDefaultDishAction, {});
  const t = id.settings;
  const options = presetDishOptions(dish);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase text-[var(--text-muted)]">
            {t.dishWarung} · {t.dishCount(options.length)}
          </p>
          {dish.warung ? (
            <p className="text-lg font-black break-words">{dish.warung}</p>
          ) : (
            <p className="text-sm font-bold text-[var(--text-muted)]">{t.noWarungName}</p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" onClick={onEdit} className="min-h-[44px] text-xs" aria-label={`Edit ${dish.warung || dish.name}`}>
            {t.edit}
          </Button>
          <form
            action={action}
            onSubmit={(e) => {
              if (!window.confirm(t.confirmRemoveDish(dish.warung || dish.name))) e.preventDefault();
            }}
          >
            <input type="hidden" name="dish" value={dish.name} />
            <Button
              type="submit"
              variant="danger"
              disabled={pending}
              className="min-h-[44px] text-xs"
              aria-label={`Hapus ${dish.warung || dish.name}`}
            >
              {t.remove}
            </Button>
          </form>
        </div>
      </div>
      <DishOptionsList options={options} />
      {state.error && <p className="mt-2 text-sm font-bold text-[var(--danger)]">{state.error}</p>}
    </div>
  );
}

function PresetForm({
  preset,
  onDone,
  canCancel,
}: {
  preset?: DefaultDish;
  onDone: () => void;
  canCancel: boolean;
}) {
  const [state, action, pending] = useActionState(
    preset ? updateDefaultDishAction : addDefaultDishAction,
    {},
  );
  const t = id.settings;
  const warungId = useId();
  const [options, setOptions] = useState<DishOption[]>(
    preset ? presetDishOptions(preset) : [emptyDishOption()],
  );
  const hasDish = options.some((o) => o.name.trim());

  useEffect(() => {
    if (state.ok) onDone();
  }, [state.ok, onDone]);

  return (
    <form action={action} className="flex flex-col gap-3">
      {preset && <input type="hidden" name="originalDish" value={preset.name} />}
      <p className="neo-label">{preset ? t.editDish : t.addDish}</p>

      <div>
        <label htmlFor={warungId} className="mb-1 block text-xs font-bold text-[var(--text-muted)]">
          {t.dishWarung}
        </label>
        <Input
          id={warungId}
          name="warung"
          defaultValue={preset?.warung ?? ""}
          placeholder={t.dishWarungPlaceholder}
          required
          className="w-full"
        />
      </div>

      <DishOptionsEditor value={options} onChange={setOptions} name="dishOptions" />

      {state.error && <p className="text-sm font-bold text-[var(--danger)]">{state.error}</p>}

      <div className="flex flex-col-reverse gap-2 border-t-2 border-black pt-3 sm:flex-row sm:justify-end">
        {canCancel && (
          <Button type="button" onClick={onDone} disabled={pending} className="min-h-[44px]">
            {t.cancel}
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={pending || !hasDish} className="min-h-[44px]">
          {pending ? "Menyimpan…" : preset ? t.saveDish : t.saveNewDish}
        </Button>
      </div>
    </form>
  );
}
