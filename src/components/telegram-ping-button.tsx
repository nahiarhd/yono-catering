"use client";

import { useState, useTransition } from "react";
import { pingTelegramRemindersAction } from "@/app/yono/actions";
import { id } from "@/lib/id";

interface TelegramPingButtonProps {
  dateKey: string;
  pendingCount: number;
}

export function TelegramPingButton({ dateKey, pendingCount }: TelegramPingButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const t = id.yono;

  const handlePing = () => {
    if (isPending) return;
    setFeedback(null);

    startTransition(async () => {
      try {
        const res = await pingTelegramRemindersAction(dateKey);
        if (res.ok) {
          setFeedback({
            type: "success",
            message: t.pingTelegramSuccess(res.count ?? 0),
          });
        } else {
          setFeedback({
            type: "error",
            message: res.error || "Gagal mengirim pengingat Telegram.",
          });
        }
      } catch (err) {
        setFeedback({
          type: "error",
          message: err instanceof Error ? err.message : "Terjadi kesalahan koneksi.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <button
        type="button"
        onClick={handlePing}
        disabled={isPending || pendingCount === 0}
        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#0088cc] hover:bg-[#0077b5] active:translate-x-[2px] active:translate-y-[2px] border-2 border-black shadow-[2px_2px_0px_#000] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
        title="Kirim pesan pengingat ke Telegram anggota yang belum memilih"
      >
        <svg
          className="w-4 h-4 fill-current shrink-0"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
        <span>{isPending ? t.pingTelegramLoading : t.pingTelegram}</span>
      </button>

      {feedback && (
        <span
          className={`text-xs font-bold border-2 border-black px-2.5 py-1.5 ${
            feedback.type === "success"
              ? "bg-emerald-100 text-emerald-900"
              : "bg-rose-100 text-rose-900"
          }`}
          role="status"
        >
          {feedback.message}
        </span>
      )}
    </div>
  );
}
