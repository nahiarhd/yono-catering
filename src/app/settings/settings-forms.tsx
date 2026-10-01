"use client";

import { useActionState, useTransition, useState } from "react";
import Link from "next/link";
import { updateSettingsAction, testTelegramReminderAction, type ActionState } from "./actions";
import { TimePicker } from "@/components/time-picker";
import { id } from "@/lib/id";
import { Button } from "@/components/ui";

export function SettingsForm({
  standingCutoff,
  reminderTime,
  hasTelegramToken = false,
  telegramCount = 0,
  totalMembers = 0,
  reminderSentAt = null,
}: {
  standingCutoff: string;
  reminderTime: string;
  hasTelegramToken?: boolean;
  telegramCount?: number;
  totalMembers?: number;
  reminderSentAt?: string | null;
}) {
  const [state, action, pending] = useActionState(updateSettingsAction, {});
  const [testPending, startTestTransition] = useTransition();
  const [testResult, setTestResult] = useState<ActionState | null>(null);

  const t = id.settings;

  const handleTestReminder = () => {
    setTestResult(null);
    startTestTransition(async () => {
      const res = await testTelegramReminderAction();
      setTestResult(res);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className="settings-times-form">
        <TimePicker name="standingCutoff" label={t.standingCutoff} defaultValue={standingCutoff} />
        <TimePicker name="reminderTime" label={t.reminderTime} defaultValue={reminderTime} />

        {state.error && (
          <p className="m-0 border-2 border-black bg-red-100 px-3 py-2 text-sm font-bold text-red-600">
            {state.error}
          </p>
        )}
        {state.ok && <p className="m-0 font-bold text-green-600">{t.saved}</p>}

        <Button type="submit" variant="primary" disabled={pending} className="w-full py-4 text-base">
          {pending ? "Menyimpan Waktu..." : t.saveTimes}
        </Button>
      </form>

      {/* Info Status Pengingat Otomatis & Telegram */}
      <div className="border-3 border-black bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#000] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 border-b-2 border-black pb-2.5">
          <span className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            🤖 Status Pengingat Otomatis Telegram
          </span>
          <span
            className={`text-xs font-black px-2 py-0.5 border border-black shadow-[1px_1px_0px_#000] ${
              hasTelegramToken ? "bg-emerald-300 text-black" : "bg-rose-200 text-rose-950"
            }`}
          >
            {hasTelegramToken ? "🟢 Bot Aktif" : "⚠️ Bot Belum Terpasang"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium">
          <div className="border border-black bg-stone-50 p-2.5">
            <span className="font-bold text-[var(--text-muted)] block mb-0.5">Jadwal Pengingat Hari Ini:</span>
            <span className="text-sm font-black text-black">
              Jam {reminderTime} WIB (Batas {standingCutoff} WIB)
            </span>
          </div>

          <div className="border border-black bg-stone-50 p-2.5">
            <span className="font-bold text-[var(--text-muted)] block mb-0.5">Status Pengingat Hari Ini:</span>
            {reminderSentAt ? (
              <span className="text-sm font-black text-emerald-700">
                ✓ Sudah terkirim ({reminderSentAt} WIB)
              </span>
            ) : (
              <span className="text-sm font-black text-amber-700">
                ⏳ Belum terkirim (otomatis jam {reminderTime})
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-stone-200 pt-2.5">
          <div className="text-xs">
            <span className="font-bold text-stone-700">
              Anggota terhubung Telegram: <strong>{telegramCount} dari {totalMembers} anggota</strong>
            </span>
            {telegramCount === 0 && (
              <p className="text-[11px] text-amber-800 font-semibold mt-0.5">
                Belum ada anggota yang diisi Telegram Chat ID-nya. Silakan isi di menu{" "}
                <Link href="/users" className="underline font-bold text-black">
                  Pengguna →
                </Link>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleTestReminder}
            disabled={testPending}
            className="border-2 border-black bg-stone-100 hover:bg-stone-200 px-3 py-2 text-xs font-black shadow-[2px_2px_0px_#000] active:translate-y-0.5 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {testPending ? "Mengirim Test..." : "🚀 Test Kirim Pengingat Sekarang"}
          </button>
        </div>

        {testResult && (
          <div
            className={`border-2 border-black p-3 text-xs font-bold ${
              testResult.ok ? "bg-emerald-100 text-emerald-950" : "bg-rose-100 text-rose-950"
            }`}
          >
            {testResult.message || testResult.error}
          </div>
        )}
      </div>
    </div>
  );
}