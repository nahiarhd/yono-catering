"use client";

import { useState } from "react";
import Link from "next/link";
import { id } from "@/lib/id";
import { formatDisplayDate } from "@/lib/dates";
import type { buildReport, ReportDay } from "@/lib/report";
import { Card, Button, Input } from "./ui";

type Report = ReturnType<typeof buildReport>;
type Tab = "days" | "people";

const itemsText = (items: { label: string; count: number }[]) =>
  items.map((i) => `${i.count}× ${i.label}`).join(", ");

export function ReportView({
  report,
  from,
  to,
  presets,
  printedAt,
}: {
  report: Report;
  from: string;
  to: string;
  presets: { label: string; from: string; to: string }[];
  printedAt: string;
}) {
  const t = id.reports;
  const [tab, setTab] = useState<Tab>("days");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const days: ReportDay[] = q
    ? report.days
        .map((d) => ({
          ...d,
          warungs: d.warungs.filter(
            (w) =>
              w.label.toLowerCase().includes(q) ||
              w.orders.some((o) => o.name.toLowerCase().includes(q) || o.item.toLowerCase().includes(q)),
          ),
        }))
        .filter((d) => d.warungs.length > 0)
    : report.days;
  const people = q ? report.people.filter((p) => p.name.toLowerCase().includes(q)) : report.people;

  const period = `${formatDisplayDate(from)} s.d. ${formatDisplayDate(to)}`;
  const avg = report.totalDays > 0 ? (report.totalPortions / report.totalDays).toFixed(1) : "0";
  const stats = [
    { label: t.totalDays, value: report.totalDays },
    { label: t.totalPortions, value: report.totalPortions },
    { label: t.avgPortions, value: avg },
    { label: t.peopleCount, value: report.people.filter((p) => p.eaten > 0).length },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Filter */}
      <Card className="no-print flex flex-col gap-4">
        <form method="get" className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="report-from" className="neo-label text-xs">
              {t.from}
            </label>
            <Input id="report-from" type="date" name="from" defaultValue={from} max={to} className="mt-1 w-full" />
          </div>
          <div>
            <label htmlFor="report-to" className="neo-label text-xs">
              {t.to}
            </label>
            <Input id="report-to" type="date" name="to" defaultValue={to} className="mt-1 w-full" />
          </div>
          <Button type="submit" variant="primary" className="col-span-2 min-h-[44px] sm:col-span-1">
            {t.apply}
          </Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = p.from === from && p.to === to;
            return (
              <Link
                key={p.label}
                href={`/reports?from=${p.from}&to=${p.to}`}
                aria-current={active ? "true" : undefined}
                className={`inline-flex min-h-[44px] items-center border-2 border-black px-3 text-sm font-bold ${
                  active ? "bg-black text-white" : "bg-white hover:bg-amber-50"
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </Card>

      {/* Print header */}
      <div className="print-only border-b-2 border-black pb-3">
        <h1 className="text-xl font-black">{t.printTitle}</h1>
        <p className="mt-1 text-xs">
          {t.period}: <strong>{period}</strong> · {t.printedAt} {printedAt}
        </p>
      </div>

      <section aria-label={t.summary}>
        <p className="no-print mb-2 text-sm font-bold text-[var(--text-muted)]">{period}</p>
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4 print:grid-cols-4 print:gap-0 print:border print:border-black">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`neo-card print:!mb-0 print:!border-0 print:p-2 ${i === 1 ? "bg-[var(--primary)]" : "bg-[var(--surface)]"}`}
            >
              <dt className="text-xs font-bold">{s.label}</dt>
              <dd className="mt-1 text-2xl font-black print:text-lg">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {report.days.length === 0 ? (
        <Card>
          <p className="py-6 text-center font-semibold text-[var(--text-muted)]">{t.noData}</p>
        </Card>
      ) : (
        <>
          <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label={t.view} className="grid grid-cols-2 border-2 border-black sm:inline-grid">
              {(["days", "people"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-pressed={tab === key}
                  className={`min-h-[44px] px-4 text-sm font-black ${tab === key ? "bg-black text-white" : "bg-white hover:bg-amber-50"}`}
                >
                  {key === "days" ? t.perDay : t.perPerson}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="min-w-0 flex-1 text-sm sm:w-56"
              />
              <Button type="button" onClick={() => window.print()} className="min-h-[44px] shrink-0 text-sm">
                {t.printBtn}
              </Button>
            </div>
          </div>

          <div className="no-print">
            {tab === "days" ? <DaysList days={days} /> : <PeopleTable people={people} />}
            {((tab === "days" && days.length === 0) || (tab === "people" && people.length === 0)) && (
              <p className="border-2 border-dashed border-black p-6 text-center font-semibold text-[var(--text-muted)]">
                {t.noMatch}
              </p>
            )}
          </div>

          <PrintTables report={report} />
        </>
      )}
    </div>
  );
}

function DaysList({ days }: { days: ReportDay[] }) {
  const t = id.reports;
  return (
    <ol className="flex flex-col gap-4">
      {days.map((day) => (
        <li key={day.dateKey} className="neo-card bg-[var(--surface)]">
          <div className="flex items-baseline justify-between gap-3 border-b-2 border-black pb-2">
            <h2 className="font-black">{formatDisplayDate(day.dateKey)}</h2>
            <span className="shrink-0 border-2 border-black bg-[var(--primary)] px-2 py-0.5 text-xs font-black">
              {t.portions(day.portions)}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {day.warungs.map((w) => (
              <section key={w.id} className={day.warungs.length > 1 ? "border-2 border-black bg-white p-3" : ""}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="break-words font-extrabold">{w.label}</h3>
                  {day.warungs.length > 1 && (
                    <span className="shrink-0 text-xs font-bold">{t.portions(w.portions)}</span>
                  )}
                </div>
                {w.note && <p className="text-xs font-semibold text-[var(--text-muted)]">{w.note}</p>}
                {w.items.length > 0 ? (
                  <ul className="mt-2 flex flex-col gap-1">
                    {w.items.map((item) => (
                      <li key={item.label} className="flex items-start gap-2 text-sm">
                        <span className="min-w-[2.5rem] shrink-0 border border-black bg-white text-center font-black">
                          {item.count}×
                        </span>
                        <span className="font-semibold">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm font-semibold text-[var(--text-muted)]">{t.noOrders}</p>
                )}
                {(w.orders.length > 0 || w.skipped.length > 0) && (
                  <details className="mt-2">
                    <summary className="inline-flex min-h-[44px] cursor-pointer items-center text-sm font-bold underline">
                      {t.whoOrdered(w.orders.length)}
                    </summary>
                    <ul className="mt-1 flex flex-col gap-1 text-sm">
                      {w.orders.map((o) => (
                        <li key={o.name}>
                          <span className="font-bold">{o.name}</span>: {o.item}
                          {o.note && <span className="text-[var(--text-muted)]"> · {o.note}</span>}
                        </li>
                      ))}
                    </ul>
                    {w.skipped.length > 0 && (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        <span className="font-bold">{t.nonEaters}:</span> {w.skipped.join(", ")}
                      </p>
                    )}
                  </details>
                )}
              </section>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

function PeopleTable({ people }: { people: Report["people"] }) {
  const t = id.reports;
  if (people.length === 0) return null;
  return (
    <div className="neo-card bg-white p-0">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-black bg-stone-100">
            <th scope="col" className="p-3 font-black">{t.colName}</th>
            <th scope="col" className="p-3 text-right font-black">{t.colEaten}</th>
            <th scope="col" className="p-3 text-right font-black">{t.colSkipped}</th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.name} className="border-b border-stone-300 last:border-0">
              <td className="p-3">
                <span className="font-bold">{p.name}</span>
                {p.group && <span className="block text-xs text-[var(--text-muted)]">{p.group}</span>}
              </td>
              <td className="p-3 text-right text-base font-black">{p.eaten}</td>
              <td className="p-3 text-right text-[var(--text-muted)]">{p.skipped}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Paper version: plain bordered tables, both views, plus every order line for checking a bill. */
function PrintTables({ report }: { report: Report }) {
  const t = id.reports;
  const cell = "border border-black px-2 py-1 align-top";
  const dateShort = (key: string) => key.split("-").reverse().join("/");

  return (
    <div className="print-only text-[11px]">
      <h2 className="mb-1 mt-4 text-sm font-black">{t.perPerson}</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-stone-200">
            <th className={cell}>No</th>
            <th className={`${cell} text-left`}>{t.colName}</th>
            <th className={`${cell} text-left`}>{t.colGroup}</th>
            <th className={cell}>{t.colEaten}</th>
            <th className={cell}>{t.colSkipped}</th>
          </tr>
        </thead>
        <tbody>
          {report.people.map((p, i) => (
            <tr key={p.name} className="break-inside-avoid">
              <td className={`${cell} text-center`}>{i + 1}</td>
              <td className={cell}>{p.name}</td>
              <td className={cell}>{p.group ?? "-"}</td>
              <td className={`${cell} text-center font-bold`}>{p.eaten}</td>
              <td className={`${cell} text-center`}>{p.skipped}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mb-1 mt-5 text-sm font-black">{t.perDay}</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-stone-200">
            <th className={`${cell} text-left`}>{t.colDate}</th>
            <th className={`${cell} text-left`}>{t.colWarung}</th>
            <th className={`${cell} text-left`}>{t.colItems}</th>
            <th className={cell}>{t.colPortions}</th>
          </tr>
        </thead>
        <tbody>
          {report.days.flatMap((d) =>
            d.warungs.map((w, i) => (
              <tr key={w.id} className="break-inside-avoid">
                <td className={cell}>{i === 0 ? dateShort(d.dateKey) : ""}</td>
                <td className={cell}>{w.label}</td>
                <td className={cell}>{itemsText(w.items) || "-"}</td>
                <td className={`${cell} text-center font-bold`}>{w.portions}</td>
              </tr>
            )),
          )}
          <tr className="bg-stone-100 font-black">
            <td className={cell} colSpan={3}>
              {t.total}
            </td>
            <td className={`${cell} text-center`}>{report.totalPortions}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mb-1 mt-5 break-before-page text-sm font-black">{t.orderLines}</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-stone-200">
            <th className={`${cell} text-left`}>{t.colDate}</th>
            <th className={`${cell} text-left`}>{t.colName}</th>
            <th className={`${cell} text-left`}>{t.colOrder}</th>
            <th className={`${cell} text-left`}>{t.colNote}</th>
          </tr>
        </thead>
        <tbody>
          {report.days.flatMap((d) =>
            d.warungs.flatMap((w) =>
              w.orders.map((o) => (
                <tr key={`${w.id}-${o.name}`} className="break-inside-avoid">
                  <td className={cell}>{dateShort(d.dateKey)}</td>
                  <td className={cell}>{o.name}</td>
                  <td className={cell}>{o.item}</td>
                  <td className={cell}>{o.note ?? ""}</td>
                </tr>
              )),
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
