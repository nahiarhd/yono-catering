"use client";

import { useActionState, useId, useState } from "react";
import {
  saveDishPreferenceAction,
  removeDishPreferenceAction,
  type ActionState,
} from "@/app/home/actions";
import {
  computeSelectionDish,
  normalizeDishKey,
  presetDishOptions,
  splitSelection,
  type DefaultDish,
  type DishOption,
} from "@/lib/dishes";
import { id } from "@/lib/id";
import { Button, Card, Input } from "./ui";

type Pref = {
  forDish: string;
  wants: boolean;
  swapDish: string | null;
  note: string | null;
};

export function DishPreferencesCard({
  dishes,
  preferences,
}: {
  dishes: (DefaultDish | string)[];
  preferences: Pref[];
}) {
  const t = id.preferences;
  const dishNames = dishes.map((d) => (typeof d === "string" ? d : d.name));
  const [active, setActive] = useState(dishNames[0] ?? "");
  const prefByKey = new Map(preferences.map((p) => [p.forDish, p]));

  if (dishNames.length === 0) return null;

  function summary(dish: string) {
    const pref = prefByKey.get(normalizeDishKey(dish));
    if (!pref) return t.unset;
    const variant = pref.swapDish ? ` (${pref.swapDish})` : "";
    const note = pref.note ? ` · ${pref.note}` : "";
    return pref.wants ? `${t.follow}${variant}${note}` : `${t.skip}${note}`;
  }

  const activeDishObj = dishes.find((d) => {
    const name = typeof d === "string" ? d : d.name;
    return name === active;
  });
  const activeWarung =
    activeDishObj && typeof activeDishObj !== "string"
      ? activeDishObj.warung ?? null
      : null;
  const activeOptions = activeDishObj
    ? presetDishOptions(typeof activeDishObj === "string" ? { name: activeDishObj } : activeDishObj)
    : [];

  return (
    <Card className="neo-pref-card">
      <p className="neo-label">{t.title}</p>
      <p className="neo-pref-hint">{t.hint}</p>

      <div className="neo-dish-chips">
        {dishNames.map((dish) => {
          const selected = dish === active;
          const hasPref = prefByKey.has(normalizeDishKey(dish));
          const dishObj = dishes.find((d) => (typeof d === "string" ? d : d.name) === dish);
          const warung = dishObj && typeof dishObj !== "string" ? dishObj.warung : null;
          return (
            <button
              key={dish}
              type="button"
              className={`neo-dish-chip${selected ? " neo-dish-chip--selected" : ""}${hasPref ? " neo-dish-chip--has-pref" : ""}`}
              onClick={() => setActive(dish)}
              aria-pressed={selected}
            >
              {warung && (
                <span
                  className="text-[10px] font-black uppercase tracking-wider text-amber-800 block w-full truncate"
                  title={warung}
                >
                  {warung}
                </span>
              )}
              <span className="neo-dish-chip-name">{dish}</span>
              <span className="neo-dish-chip-sub">{summary(dish)}</span>
            </button>
          );
        })}
      </div>

      {active && (
        <DishPreferenceEditor
          key={active}
          forDish={active}
          warung={activeWarung}
          options={activeOptions}
          initial={prefByKey.get(normalizeDishKey(active))}
        />
      )}
    </Card>
  );
}

function DishPreferenceEditor({
  forDish,
  warung,
  options,
  initial,
}: {
  forDish: string;
  warung?: string | null;
  options: DishOption[];
  initial?: Pref;
}) {
  const t = id.preferences;
  const rt = id.response;
  const [saveState, saveAction, savePending] = useActionState(saveDishPreferenceAction, {});
  const [removeState, removeAction, removePending] = useActionState(removeDishPreferenceAction, {});

  const [wants, setWants] = useState(initial?.wants !== false);
  const isMultiDish = options.length > 1;
  const initialParts = splitSelection(options, initial?.swapDish);
  const [pickedDish, setPickedDish] = useState(initialParts.dish);
  const [variant, setVariant] = useState(initialParts.variant);
  const activeOption = isMultiDish ? options.find((o) => o.name === pickedDish) : options[0];
  const subDishes = activeOption?.variants ?? [];
  const subDish = computeSelectionDish({
    isMultiDish,
    selectedDish: isMultiDish ? pickedDish : activeOption?.name,
    selectedVariant: variant,
  });
  const [note, setNote] = useState(initial?.note ?? "");
  const noteId = useId();

  return (
    <div className="neo-pref-editor">
      {warung && (
        <span className="text-[11px] font-black uppercase tracking-wider bg-amber-200 border border-black px-1.5 py-0.5 shadow-[1px_1px_0px_#000] mb-1.5 inline-block max-w-full break-words">
          {warung}
        </span>
      )}
      <p className="neo-pref-editor-title">{t.forDish(forDish)}</p>

      <form action={saveAction} className="neo-pref-editor-form">
        <input type="hidden" name="forDish" value={forDish} />
        <input type="hidden" name="wants" value={wants ? "yes" : "no"} />
        <input type="hidden" name="subDish" value={wants ? subDish : ""} />

        <div className="neo-response-choices">
          <button
            type="button"
            className={`neo-response-choice${wants ? " neo-response-choice--selected" : ""}`}
            onClick={() => setWants(true)}
            aria-pressed={wants}
          >
            <span className="neo-response-choice-main">{t.yes}</span>
            <span className="neo-response-choice-hint">{t.yesHint}</span>
          </button>
          <button
            type="button"
            className={`neo-response-choice${!wants ? " neo-response-choice--selected" : ""}`}
            onClick={() => setWants(false)}
            aria-pressed={!wants}
          >
            <span className="neo-response-choice-main">{t.no}</span>
            <span className="neo-response-choice-hint">{t.noHint}</span>
          </button>
        </div>

        {wants && isMultiDish && (
          <div className="neo-response-fieldset mt-3">
            <p className="text-xs font-bold uppercase mb-1.5">{t.chooseDishDefault}</p>
            <div className="flex flex-wrap gap-2">
              {options.map((o) => {
                const selected = pickedDish === o.name;
                return (
                  <button
                    key={o.name}
                    type="button"
                    onClick={() => {
                      setPickedDish(selected ? "" : o.name);
                      setVariant("");
                    }}
                    className={`border-2 border-black font-extrabold text-xs px-3 py-2 min-h-[44px] transition-all cursor-pointer ${
                      selected
                        ? "bg-[var(--primary)] text-black shadow-[2px_2px_0px_#000] -translate-x-[1px] -translate-y-[1px]"
                        : "bg-white hover:bg-stone-100 text-black"
                    }`}
                    aria-pressed={selected}
                  >
                    {o.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {wants && subDishes.length > 0 && (
          <div className="neo-response-fieldset mt-3">
            <p className="text-xs font-bold uppercase mb-1.5">{t.chooseVariantDefault}</p>
            <div className="flex flex-wrap gap-2">
              {subDishes.map((v) => {
                const selected = variant === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVariant((curr) => (curr === v ? "" : v))}
                    className={`border-2 border-black font-extrabold text-xs px-3 py-2 min-h-[44px] transition-all cursor-pointer ${
                      selected
                        ? "bg-[var(--primary)] text-black shadow-[2px_2px_0px_#000] -translate-x-[1px] -translate-y-[1px]"
                        : "bg-white hover:bg-stone-100 text-black"
                    }`}
                    aria-pressed={selected}
                  >
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="neo-response-notes">
          <label htmlFor={noteId} className="neo-response-notes-label">{rt.noteLabel}</label>
          <Input
            id={noteId}
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <ActionMessage state={saveState} ok={t.saved} />
        <Button type="submit" variant="primary" disabled={savePending} className="w-full">
          {savePending ? t.saving : t.save}
        </Button>
      </form>

      {initial && (
        <form action={removeAction} className="mt-3">
          <input type="hidden" name="forDish" value={forDish} />
          <ActionMessage state={removeState} ok={t.removed} />
          <Button type="submit" variant="ghost" disabled={removePending} className="w-full text-sm">
            {t.remove}
          </Button>
        </form>
      )}
    </div>
  );
}

function ActionMessage({ state, ok }: { state: ActionState; ok: string }) {
  if (state.error) {
    return <p className="neo-response-error">{state.error}</p>;
  }
  if (state.ok) {
    return <p className="neo-response-success">{ok}</p>;
  }
  return null;
}