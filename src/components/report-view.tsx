"use client";

import { useMemo, useState } from "react";
import { id } from "@/lib/id";
import { Card, Button, Select, Input } from "./ui";

export type ReportDay = {
  id: string;
  dateKey: string;
  dateDisplay: string;
  monthKey: string;
  monthDisplay: string;
  dish: string;
  note: string | null;
  totalPortions: number;
  totalNotEating: number;
  breakdown: Array<{ label: string; count: number }>;
  eaters: Array<{
    name: string;
    dish: string;
    addOns: string | null;
    note: string | null;
  }>;
  nonEaters: string[];
};

export function ReportView({ days }: { days: ReportDay[] }) {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Extract distinct months for the filter dropdown
  const months = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of days) {
      if (!map.has(d.monthKey)) {
        map.set(d.monthKey, d.monthDisplay);
      }
    }
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [days]);

  // Filter days based on month and query
  const filteredDays = useMemo(() => {
    return days.filter((d) => {
      const matchMonth = selectedMonth === "all" || d.monthKey === selectedMonth;
      const matchSearch =
        !searchQuery.trim() ||
        d.dish.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.dateDisplay.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.eaters.some((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchMonth && matchSearch;
    });
  }, [days, selectedMonth, searchQuery]);

  // Executive summary stats
  const stats = useMemo(() => {
    const totalDays = filteredDays.length;
    const totalPortions = filteredDays.reduce((acc, d) => acc + d.totalPortions, 0);
    const avgPortions = totalDays > 0 ? (totalPortions / totalDays).toFixed(1) : "0";

    const dishCounts = new Map<string, number>();
    for (const d of filteredDays) {
      dishCounts.set(d.dish, (dishCounts.get(d.dish) ?? 0) + d.totalPortions);
    }
    const topDishes = Array.from(dishCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return { totalDays, totalPortions, avgPortions, topDishes };
  }, [filteredDays]);

  const handlePrint = () => {
    window.print();
  };

  const currentPrintedAt = useMemo(() => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(new Date());
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Cetak Khusus Print / PDF */}
      <div className="print-only mb-6 border-b-2 border-black pb-4 text-left">
        <h1 className="text-2xl font-black uppercase tracking-tight">
          Yono Catering &bull; Laporan Rekap Pemesanan
        </h1>
        <p className="mt-1 text-xs text-gray-700">
          Periode:{" "}
          <span className="font-bold">
            {selectedMonth === "all"
              ? id.reports.allTime
              : months.find((m) => m.key === selectedMonth)?.label ?? selectedMonth}
          </span>{" "}
          &bull; Dicetak pada: <span className="font-medium">{currentPrintedAt}</span>
        </p>
        <div className="mt-3 flex gap-6 text-xs border-t border-gray-300 pt-2 font-mono">
          <div>
            Total Hari: <strong className="text-black">{stats.totalDays} hari</strong>
          </div>
          <div>
            Total Porsi: <strong className="text-black">{stats.totalPortions} porsi</strong>
          </div>
          <div>
            Rata-rata: <strong className="text-black">{stats.avgPortions} porsi/hari</strong>
          </div>
        </div>
      </div>

      {/* Kontrol UI (Filter, Search, Tombol Cetak) */}
      <Card className="no-print">
        <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            <div>
              <label htmlFor="filterMonth" className="neo-label text-xs">
                {id.reports.filterMonth}
              </label>
              <Select
                id="filterMonth"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 text-sm font-semibold"
              >
                <option value="all">{id.reports.allTime}</option>
                {months.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label htmlFor="searchQuery" className="neo-label text-xs">
                Cari Menu / Nama
              </label>
              <Input
                id="searchQuery"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Contoh: Bakmi, Nasi, Haq..."
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 whitespace-nowrap min-h-[44px] text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span>{id.reports.printBtn}</span>
          </Button>
        </div>
      </Card>

      {/* Ringkasan Statistik (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-[var(--text-muted)]">
            {id.reports.totalDays}
          </span>
          <span className="mt-2 text-2xl font-black">{stats.totalDays} Hari</span>
        </Card>
        <Card className="flex flex-col justify-between" accent="yellow">
          <span className="text-xs font-bold uppercase text-[var(--text)]">
            {id.reports.totalPortions}
          </span>
          <span className="mt-2 text-2xl font-black">{stats.totalPortions} Porsi</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-[var(--text-muted)]">
            {id.reports.avgPortions}
          </span>
          <span className="mt-2 text-2xl font-black">{stats.avgPortions} Porsi</span>
        </Card>
        <Card className="flex flex-col justify-between">
          <span className="text-xs font-bold uppercase text-[var(--text-muted)]">
            {id.reports.topDish}
          </span>
          <span className="mt-2 text-sm font-bold truncate">
            {stats.topDishes.length > 0
              ? `${stats.topDishes[0][0]} (${stats.topDishes[0][1]} porsi)`
              : "-"}
          </span>
        </Card>
      </div>

      {/* Daftar Riwayat Harian */}
      {filteredDays.length === 0 ? (
        <Card>
          <p className="text-center py-8 text-[var(--text-muted)] font-medium">
            {id.reports.noData}
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredDays.map((day) => (
            <section
              key={day.id}
              className="neo-card print-break-inside-avoid bg-[var(--surface)] p-4 sm:p-5"
            >
              {/* Header Tanggal & Menu */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b-2 border-black pb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-black tracking-tight">{day.dateDisplay}</h2>
                    <span className="text-xs px-2 py-0.5 font-bold border-2 border-black bg-[var(--primary)] rounded">
                      {day.totalPortions} Porsi
                    </span>
                  </div>
                  <p className="mt-1 text-base font-extrabold text-[var(--text)]">
                    Menu: {day.dish}
                  </p>
                  {day.note && (
                    <p className="text-xs text-[var(--text-muted)] italic mt-0.5">
                      Catatan Dapur: {day.note}
                    </p>
                  )}
                </div>

                <div className="text-right text-xs font-mono text-[var(--text-muted)]">
                  <span>{day.dateKey}</span>
                </div>
              </div>

              {/* Rincian Porsi (Breakdown) */}
              <div className="mt-3">
                <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2">
                  Ringkasan Porsi:
                </p>
                {day.breakdown.length === 0 ? (
                  <p className="text-xs italic text-[var(--text-muted)]">
                    Belum ada pesanan ikut makan
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {day.breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs font-medium border border-black/30 p-2 bg-white rounded"
                      >
                        <span className="font-semibold text-gray-900">{item.label}</span>
                        <span className="font-bold font-mono px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded ml-2">
                          {item.count} porsi
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Daftar Pemesan (Eaters) */}
              <div className="mt-4 pt-3 border-t border-dashed border-black/20">
                <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-2">
                  {id.reports.eaters} ({day.eaters.length} orang):
                </p>
                {day.eaters.length === 0 ? (
                  <p className="text-xs italic text-[var(--text-muted)]">-</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs">
                    {day.eaters.map((e, idx) => (
                      <div key={idx} className="flex items-baseline gap-1.5">
                        <span className="font-bold text-gray-900">{idx + 1}. {e.name}:</span>
                        <span className="text-gray-800">
                          {e.dish}
                          {e.addOns ? ` [+ ${e.addOns}]` : ""}
                          {e.note ? ` [Catatan: ${e.note}]` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tidak Ikut Makan */}
              {day.nonEaters.length > 0 && (
                <div className="mt-3 pt-2 border-t border-dashed border-black/10 text-xs text-[var(--text-muted)]">
                  <span className="font-semibold">{id.reports.nonEaters}:</span>{" "}
                  {day.nonEaters.join(", ")}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
