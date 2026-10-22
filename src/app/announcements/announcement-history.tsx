"use client";

import { useTransition } from "react";
import { id } from "@/lib/id";
import { formatDateTime } from "@/lib/dates";
import { deleteAnnouncementAction } from "./actions";

interface AnnouncementItem {
  id: string;
  title: string | null;
  message: string;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  author: { name: string } | null;
}

export function AnnouncementHistory({
  announcements,
}: {
  announcements: AnnouncementItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const t = id.announcements;

  const handleDelete = (announcementId: string) => {
    if (confirm("Hapus catatan pengumuman ini dari riwayat?")) {
      startTransition(async () => {
        await deleteAnnouncementAction(announcementId);
      });
    }
  };

  if (announcements.length === 0) {
    return (
      <p className="text-sm font-semibold text-[var(--text-muted)]">
        {t.noHistory}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {announcements.map((item) => (
        <article
          key={item.id}
          className="flex flex-col gap-2 rounded border-2 border-black bg-[var(--surface)] p-3.5 shadow-[2px_2px_0px_#000]"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 border-b-2 border-black/10 pb-2">
            <div>
              <h3 className="text-base font-black text-[var(--text)]">
                {item.title || "Pengumuman"}
              </h3>
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                {t.sentAt} {formatDateTime(new Date(item.createdAt))}
                {item.author?.name ? ` · ${t.sentBy} ${item.author.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded border border-black bg-zinc-100 px-2 py-0.5 text-xs font-bold">
                {t.stats(item.sentCount, item.failedCount)}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                disabled={isPending}
                aria-label="Hapus pengumuman"
                title="Hapus dari riwayat"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded border-2 border-black bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 active:translate-x-[1px] active:translate-y-[1px] disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
            {item.message}
          </p>
        </article>
      ))}
    </div>
  );
}
