"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buildMonthGrid, formatMonthLabel, parseKeyParts } from "@/lib/calendar";
import { formatDayHeading, formatWeekdayName } from "@/lib/dates";
import { id } from "@/lib/id";

export function DatePicker({
  value,
  todayKey,
  basePath,
}: {
  value: string;
  todayKey: string;
  basePath: "/home" | "/yono" | "/day";
}) {
  const router = useRouter();
  const t = id.calendar;
  const effectiveValue = value < todayKey ? todayKey : value;
  const initial = parseKeyParts(effectiveValue);
  const todayParts = parseKeyParts(todayKey);

  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const cells = buildMonthGrid(viewYear, viewMonth, todayKey);
  const onToday = effectiveValue === todayKey;

  const isPrevMonthDisabled =
    viewYear < todayParts.year ||
    (viewYear === todayParts.year && viewMonth <= todayParts.month);

  function goTo(key: string) {
    if (key < todayKey) return;
    if (basePath === "/day") router.push(`/day/${key}`);
    else router.push(`${basePath}?date=${key}`);
  }

  function shiftMonth(delta: number) {
    if (delta < 0 && isPrevMonthDisabled) return;
    const d = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    const nextYear = d.getUTCFullYear();
    const nextMonth = d.getUTCMonth();
    if (
      delta < 0 &&
      (nextYear < todayParts.year ||
        (nextYear === todayParts.year && nextMonth < todayParts.month))
    ) {
      return;
    }
    setViewYear(nextYear);
    setViewMonth(nextMonth);
  }

  return (
    <section className="neo-calendar" aria-label={t.pickDay}>
      <div className="neo-calendar-head">
        <button
          type="button"
          className="neo-calendar-nav"
          onClick={() => shiftMonth(-1)}
          disabled={isPrevMonthDisabled}
          aria-disabled={isPrevMonthDisabled}
          aria-label={t.prevMonth}
        >
          ‹
        </button>
        <p className="neo-calendar-month">{formatMonthLabel(viewYear, viewMonth)}</p>
        <button
          type="button"
          className="neo-calendar-nav"
          onClick={() => shiftMonth(1)}
          aria-label={t.nextMonth}
        >
          ›
        </button>
      </div>

      <div className="neo-calendar-picked" aria-live="polite">
        <p className="neo-calendar-picked-label">{t.pickedDay}</p>
        <p className="neo-calendar-picked-value">{formatDayHeading(effectiveValue)}</p>
      </div>

      <div className="neo-calendar-weekdays" aria-hidden>
        {t.weekdays.map((day) => (
          <span key={day} className="neo-calendar-weekday">
            {day}
          </span>
        ))}
      </div>

      <div className="neo-calendar-grid">
        {cells.map((cell, i) =>
          cell.type === "empty" ? (
            <span key={`e-${i}`} className="neo-calendar-empty" aria-hidden />
          ) : (
            <button
              key={cell.key}
              type="button"
              disabled={cell.disabled}
              className={[
                "neo-calendar-day",
                cell.disabled ? "neo-calendar-day--disabled" : "",
                !cell.disabled && cell.key === value ? "neo-calendar-day--selected" : "",
                cell.key === todayKey ? "neo-calendar-day--today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => !cell.disabled && goTo(cell.key)}
              aria-pressed={!cell.disabled && cell.key === value}
              aria-current={cell.key === todayKey ? "date" : undefined}
              aria-disabled={cell.disabled}
              aria-label={`${formatWeekdayName(cell.key)}, ${cell.day} ${formatMonthLabel(viewYear, viewMonth)}${cell.disabled ? " (Sudah lewat)" : ""}`}
            >
              <span className="neo-calendar-day-num">{cell.day}</span>
            </button>

          ),
        )}
      </div>

      {!onToday && (
        <button type="button" className="neo-calendar-today" onClick={() => goTo(todayKey)}>
          <span className="neo-calendar-today-main">{t.today}</span>
          <span className="neo-calendar-today-sub">{formatDayHeading(todayKey)}</span>
        </button>
      )}
    </section>
  );
}