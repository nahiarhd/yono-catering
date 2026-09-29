"use client";

import { useActionState, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { id } from "@/lib/id";
import { Button, Input, Card } from "./ui";

type State = { error?: string; ok?: boolean };

type Initial = {
  wants: boolean;
  swapDish?: string | null;
  note: string | null;
};

export function ResponseForm({
  action,
  locked,
  dateKey,
  dish,
  subDishes = [],
  initial,
  prefilledFromPreference,
}: {
  action: (prev: State, formData: FormData) => Promise<State>;
  locked: boolean;
  dateKey: string;
  dish: string;
  subDishes?: string[];
  initial?: Initial;
  prefilledFromPreference?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, {});
  const t = id.response;

  const [wants, setWants] = useState(initial?.wants !== false);
  const [subDish, setSubDish] = useState(
    initial?.swapDish ?? (subDishes.length === 1 ? subDishes[0] : "")
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [saveAsPreference, setSaveAsPreference] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  const showPopup = Boolean(state.ok && !dismissed);

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
                  {initial.swapDish && (
                    <span className="ml-1.5 inline-block text-xs border-2 border-black bg-amber-100 px-2 py-0.5 font-black uppercase">
                      {initial.swapDish}
                    </span>
                  )}
                </>
              ) : (
                <strong>{t.notEating}</strong>
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

  const isSubDishRequired = wants && subDishes.length > 0;
  const isMissingSubDish = isSubDishRequired && !subDish;

  return (
    <Card className="neo-response-card">
      <p className="neo-response-title">{t.title}</p>
      {prefilledFromPreference && (
        <p className="neo-pref-banner">{t.fromPreference(dish)}</p>
      )}

      <form
        action={(formData) => {
          setDismissed(false);
          formAction(formData);
        }}
        className="neo-response-form"
      >
        <input type="hidden" name="dateKey" value={dateKey} />
        <input type="hidden" name="wants" value={wants ? "yes" : "no"} />
        <input type="hidden" name="subDish" value={wants ? subDish : ""} />

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
              <span className="neo-response-choice-main">{t.no}</span>
              <span className="neo-response-choice-hint">{t.noHint}</span>
            </button>
          </div>
        </fieldset>

        {wants && subDishes.length > 0 && (
          <fieldset className="neo-response-fieldset">
            <legend className="neo-response-legend">
              {t.chooseVariant} <span className="text-rose-600 font-black">*</span>
            </legend>
            <div className="flex flex-wrap gap-2 mt-1">
              {subDishes.map((variant) => {
                const selected = subDish === variant;
                return (
                  <button
                    key={variant}
                    type="button"
                    onClick={() => setSubDish(variant)}
                    className={`border-2 border-black font-black text-xs px-3.5 py-2.5 min-h-[44px] transition-all cursor-pointer ${
                      selected
                        ? "bg-[var(--primary)] text-black shadow-[2px_2px_0px_#000] -translate-x-[1px] -translate-y-[1px]"
                        : "bg-white hover:bg-stone-100 text-black"
                    }`}
                    aria-pressed={selected}
                  >
                    {variant}
                  </button>
                );
              })}
            </div>
            {isMissingSubDish && (
              <p className="text-xs font-bold text-rose-600 mt-1.5">
                {t.variantRequired}
              </p>
            )}
          </fieldset>
        )}

        <div className="neo-response-notes">
          <p className="neo-response-notes-label">{t.noteLabel}</p>
          {wants && (
            <>
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
            </>
          )}
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

        <Button
          type="submit"
          variant="primary"
          disabled={pending || isMissingSubDish}
          className="neo-response-submit"
        >
          {pending ? t.saving : t.submit}
        </Button>
      </form>

      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          onClick={() => setDismissed(true)}
        >
          <div
            className="border-3 border-black bg-white p-5 max-w-xs sm:max-w-sm w-full shadow-[8px_8px_0px_0px_#000] text-center flex flex-col items-center gap-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 overflow-hidden border-2 border-black bg-amber-50 shadow-[3px_3px_0px_0px_#000]">
              <Image
                src="/yono-makasih.png"
                alt="Pak Yono Makasih"
                fill
                sizes="(max-width: 640px) 208px, 240px"
                className="object-contain"
                priority
              />
            </div>
            <div className="px-1">
              <h3 className="neo-title text-xl">Jawaban Tersimpan!</h3>
              <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
                {wants
                  ? `Pak Yono siap masakin ${dish} buat kamu!`
                  : "Oke, pilihanmu buat lewati makan hari ini udah dicatet Pak Yono!"}
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              onClick={() => setDismissed(true)}
              className="w-full mt-2 py-3 text-base font-black shadow-[4px_4px_0px_0px_#000]"
            >
              Siap, Makasih Pak Yono!
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}