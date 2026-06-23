"use client";

import { useActionState, useState } from "react";
import {
  saveDishPreferenceAction,
  removeDishPreferenceAction,
  type ActionState,
} from "@/app/home/actions";
import { normalizeDishKey } from "@/lib/dishes";
import { id } from "@/lib/id";
import { Button, Input, Card } from "./ui";

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
  dishes: string[];
  preferences: Pref[];
}) {
  const t = id.preferences;
  const [active, setActive] = useState(dishes[0] ?? "");
  const prefByKey = new Map(preferences.map((p) => [p.forDish, p]));

  if (dishes.length === 0) return null;

  function summary(dish: string) {
    const pref = prefByKey.get(normalizeDishKey(dish));
    if (!pref) return t.unset;
    const note = pref.note ? ` · ${pref.note}` : "";
    return pref.wants ? `${t.follow}${note}` : `${t.swapTo(pref.swapDish ?? "")}${note}`;
  }

  return (
    <Card className="neo-pref-card">
      <p className="neo-label">{t.title}</p>
      <p className="neo-pref-hint">{t.hint}</p>

      <div className="neo-dish-chips">
        {dishes.map((dish) => {
          const selected = dish === active;
          const hasPref = prefByKey.has(normalizeDishKey(dish));
          return (
            <button
              key={dish}
              type="button"
              className={`neo-dish-chip${selected ? " neo-dish-chip--selected" : ""}${hasPref ? " neo-dish-chip--has-pref" : ""}`}
              onClick={() => setActive(dish)}
              aria-pressed={selected}
            >
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
          initial={prefByKey.get(normalizeDishKey(active))}
        />
      )}
    </Card>
  );
}

function DishPreferenceEditor({
  forDish,
  initial,
}: {
  forDish: string;
  initial?: Pref;
}) {
  const t = id.preferences;
  const rt = id.response;
  const [saveState, saveAction, savePending] = useActionState(saveDishPreferenceAction, {});
  const [removeState, removeAction, removePending] = useActionState(removeDishPreferenceAction, {});

  const [wants, setWants] = useState(initial?.wants !== false);
  const [swapDish, setSwapDish] = useState(initial?.swapDish ?? "");
  const [note, setNote] = useState(initial?.note ?? "");

  return (
    <div className="neo-pref-editor">
      <p className="neo-pref-editor-title">{t.forDish(forDish)}</p>

      <form action={saveAction} className="neo-pref-editor-form">
        <input type="hidden" name="forDish" value={forDish} />
        <input type="hidden" name="wants" value={wants ? "yes" : "no"} />

        <div className="neo-response-choices">
          <button
            type="button"
            className={`neo-response-choice${wants ? " neo-response-choice--selected" : ""}`}
            onClick={() => setWants(true)}
            aria-pressed={wants}
          >
            <span className="neo-response-choice-main">{rt.yes}</span>
            <span className="neo-response-choice-hint">{rt.yesHint}</span>
          </button>
          <button
            type="button"
            className={`neo-response-choice${!wants ? " neo-response-choice--selected" : ""}`}
            onClick={() => setWants(false)}
            aria-pressed={!wants}
          >
            <span className="neo-response-choice-main">{rt.noSwap}</span>
            <span className="neo-response-choice-hint">{rt.noSwapHint}</span>
          </button>
        </div>

        {!wants && (
          <div className="neo-response-swap">
            <label className="neo-response-swap-label" htmlFor={`swap-${forDish}`}>
              {rt.swapLabel}
            </label>
            <Input
              id={`swap-${forDish}`}
              name="swapDish"
              placeholder={rt.swapPlaceholder}
              value={swapDish}
              onChange={(e) => setSwapDish(e.target.value)}
              required
            />
          </div>
        )}

        {wants && <input type="hidden" name="swapDish" value="" />}

        <div className="neo-response-notes">
          <p className="neo-response-notes-label">{rt.noteLabel}</p>
          <div className="neo-response-note-chips">
            {rt.notePresets.map((preset) => {
              const selected = note === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  className={`neo-response-note-chip${selected ? " neo-response-note-chip--selected" : ""}`}
                  onClick={() => setNote((c) => (c === preset ? "" : preset))}
                  aria-pressed={selected}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <Input
            name="note"
            placeholder={rt.notePlaceholder}
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