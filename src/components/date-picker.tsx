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
  const initial = parseKeyParts(value);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const cells = buildMonthGrid(viewYear, viewMonth);
  const onToday = value === todayKey;

  function goTo(key: string) {
    if (basePath === "/day") router.push(`/day/${key}`);
    else router.push(`${basePath}?date=${key}`);
  }

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth());
  }

  return (
    <section className="neo-calendar" aria-label={t.pickDay}>
      <div className="neo-calendar-head">
        <button
          type="button"
          className="neo-calendar-nav"
          onClick={() => shiftMonth(-1)}
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
        <p className="neo-calendar-picked-value">{formatDayHeading(value)}</p>
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
              className={[
                "neo-calendar-day",
                cell.key === value ? "neo-calendar-day--selected" : "",
                cell.key === todayKey ? "neo-calendar-day--today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => goTo(cell.key)}
              aria-pressed={cell.key === value}
              aria-current={cell.key === todayKey ? "date" : undefined}
              aria-label={`${formatWeekdayName(cell.key)}, ${cell.day} ${formatMonthLabel(viewYear, viewMonth)}`}
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