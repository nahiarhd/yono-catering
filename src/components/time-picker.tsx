"use client";

import { useState } from "react";
import { id } from "@/lib/id";
import {
  applyPreset,
  formatHHMM,
  stepHour,
  stepMinute,
  TIME_PRESETS,
  parseTimeValue,
} from "@/lib/time";

export function TimePicker({
  name,
  label,
  defaultValue,
  optional,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  optional?: boolean;
}) {
  const t = id.time;
  const hasInitial = Boolean(defaultValue?.trim());
  const initial = parseTimeValue(defaultValue);
  const [active, setActive] = useState(!optional || hasInitial);
  const [hours, setHours] = useState(initial.hours);
  const [minutes, setMinutes] = useState(initial.minutes);

  const value = active ? formatHHMM(hours, minutes) : "";

  return (
    <section className="neo-time-card">
      <p className="neo-time-card-label">{label}</p>

      {optional && !active ? (
        <button type="button" className="neo-time-enable w-full" onClick={() => setActive(true)}>
          {t.setCustom}
        </button>
      ) : (
        <>
          <div className="neo-time-display" aria-live="polite">
            <span>{String(hours).padStart(2, "0")}</span>
            <span className="neo-time-colon">:</span>
            <span>{String(minutes).padStart(2, "0")}</span>
          </div>

          <input type="hidden" name={name} value={value} />

          <div className="neo-time-steppers">
            <Stepper
              label={t.hour}
              value={String(hours).padStart(2, "0")}
              onLess={() => setHours((h) => stepHour(h, -1))}
              onMore={() => setHours((h) => stepHour(h, 1))}
              lessLabel={`${t.less} ${t.hour}`}
              moreLabel={`${t.more} ${t.hour}`}
            />
            <Stepper
              label={t.minute}
              value={String(minutes).padStart(2, "0")}
              onLess={() => setMinutes((m) => stepMinute(m, -1))}
              onMore={() => setMinutes((m) => stepMinute(m, 1))}
              lessLabel={`${t.less} ${t.minute}`}
              moreLabel={`${t.more} ${t.minute}`}
            />
          </div>

          <div className="neo-time-presets">
            <p className="neo-time-presets-label">{t.quick}</p>
            <div className="neo-time-presets-row">
              {TIME_PRESETS.map((preset) => {
                const selected = value === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    className={`neo-time-preset${selected ? " neo-time-preset--selected" : ""}`}
                    onClick={() => {
                      const next = applyPreset(preset);
                      setHours(next.hours);
                      setMinutes(next.minutes);
                    }}
                    aria-pressed={selected}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {optional && (
            <button type="button" className="neo-time-clear w-full" onClick={() => setActive(false)}>
              {t.clear}
            </button>
          )}
        </>
      )}

      {optional && !active && <input type="hidden" name={name} value="" />}
    </section>
  );
}

function Stepper({
  label,
  value,
  onLess,
  onMore,
  lessLabel,
  moreLabel,
}: {
  label: string;
  value: string;
  onLess: () => void;
  onMore: () => void;
  lessLabel: string;
  moreLabel: string;
}) {
  return (
    <div className="neo-time-stepper">
      <p className="neo-time-stepper-label">{label}</p>
      <div className="neo-time-stepper-controls">
        <button type="button" className="neo-time-step-btn" onClick={onLess} aria-label={lessLabel}>
          −
        </button>
        <span className="neo-time-stepper-value">{value}</span>
        <button type="button" className="neo-time-step-btn" onClick={onMore} aria-label={moreLabel}>
          +
        </button>
      </div>
    </div>
  );
}