"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { id } from "@/lib/id";
import { Button, Input, Card } from "./ui";

type State = { error?: string; ok?: boolean };

type Initial = {
  wants: boolean;
  swapDish: string | null;
  note: string | null;
};

export function ResponseForm({
  action,
  locked,
  dateKey,
  dish,
  initial,
  prefilledFromPreference,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  locked: boolean;
  dateKey: string;
  dish: string;
  initial?: Initial;
  prefilledFromPreference?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const t = id.response;

  const [wants, setWants] = useState(initial?.wants !== false);
  const [swapDish, setSwapDish] = useState(initial?.swapDish ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [saveAsPreference, setSaveAsPreference] = useState(true);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  if (locked) {
    return (
      <Card className="neo-response-locked">
        <p className="neo-response-locked-title">{t.locked}</p>
        <p className="neo-response-locked-hint">{t.lockedHint}</p>
        {initial && (
          <div className="neo-response-summary">
            <p className="neo-response-summary-label">{t.yourAnswer}</p>
            <p className="neo-response-summary-value">
              {initial.wants ? (
                <>
                  {t.eating}: <strong>{dish}</strong>
                </>
              ) : (
                <>
                  {t.notEating}: <strong>{initial.swapDish}</strong>
                </>
              )}
            </p>
            <p className="neo-response-summary-note">
              {initial.note?.trim() ? initial.note : t.noNote}
            </p>
          </div>
        )}
      </Card>
    );
  }

  function toggleNotePreset(preset: string) {
    setNote((current) => (current === preset ? "" : preset));
  }

  return (
    <Card className="neo-response-card">
      <p className="neo-response-title">{t.title}</p>
      {prefilledFromPreference && (
        <p className="neo-pref-banner">{t.fromPreference(dish)}</p>
      )}

      <form action={formAction} className="neo-response-form">
        <input type="hidden" name="dateKey" value={dateKey} />
        <input type="hidden" name="wants" value={wants ? "yes" : "no"} />

        <fieldset className="neo-response-fieldset">
          <legend className="neo-response-legend">{t.wantDish}</legend>
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
              <span className="neo-response-choice-main">{t.noSwap}</span>
              <span className="neo-response-choice-hint">{t.noSwapHint}</span>
            </button>
          </div>
        </fieldset>

        {!wants && (
          <div className="neo-response-swap">
            <label className="neo-response-swap-label" htmlFor="swapDish">
              {t.swapLabel}
            </label>
            <Input
              id="swapDish"
              name="swapDish"
              placeholder={t.swapPlaceholder}
              value={swapDish}
              onChange={(e) => setSwapDish(e.target.value)}
              required
            />
          </div>
        )}

        {wants && <input type="hidden" name="swapDish" value="" />}

        <div className="neo-response-notes">
          <p className="neo-response-notes-label">{t.noteLabel}</p>
          <p className="neo-response-notes-quick">{t.noteQuick}</p>
          <div className="neo-response-note-chips">
            {t.notePresets.map((preset) => {
              const selected = note === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  className={`neo-response-note-chip${selected ? " neo-response-note-chip--selected" : ""}`}
                  onClick={() => toggleNotePreset(preset)}
                  aria-pressed={selected}
                >
                  {preset}
                </button>
              );
            })}
          </div>
          <Input
            id="note"
            name="note"
            placeholder={t.notePlaceholder}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <label className="neo-pref-save-toggle">
          <input
            type="checkbox"
            name="saveAsPreference"
            value="yes"
            checked={saveAsPreference}
            onChange={(e) => setSaveAsPreference(e.target.checked)}
            className="neo-radio"
          />
          <span>{t.savePreference(dish)}</span>
        </label>

        {state.error && <p className="neo-response-error">{state.error}</p>}
        {state.ok && <p className="neo-response-success">{t.saved}</p>}

        <Button type="submit" variant="primary" disabled={pending} className="neo-response-submit">
          {pending ? t.saving : t.submit}
        </Button>
      </form>
    </Card>
  );
}