"use client";

import { useActionState } from "react";
import { setOwnActiveAction } from "@/app/settings/actions";
import type { TelegramStatus } from "@/lib/telegram-status";
import { id } from "@/lib/id";
import { Button, Card } from "./ui";

export function AwayCard({ active }: { active: boolean }) {
  const [state, action, pending] = useActionState(setOwnActiveAction, {});
  const t = id.account;

  return (
    <Card className={active ? "" : "bg-amber-50"}>
      <p className="neo-label">{t.awayTitle}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
        {active ? t.awayHintActive : t.awayHintAway}
      </p>
      <form action={action} className="mt-3">
        <input type="hidden" name="active" value={active ? "no" : "yes"} />
        <Button type="submit" variant={active ? "default" : "primary"} disabled={pending} className="min-h-[44px] w-full sm:w-auto">
          {pending ? "Menyimpan…" : active ? t.awayGo : t.awayBack}
        </Button>
      </form>
      {state.error && <p className="mt-2 text-sm font-bold text-[var(--danger)]">{state.error}</p>}
    </Card>
  );
}

export function TelegramLinkCard({ status, linkUrl }: { status: TelegramStatus; linkUrl: string }) {
  const t = id.account;
  const label = status === "ok" ? t.tgOk : status === "failed" ? t.tgFailed : t.tgNone;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <p className="neo-label">{t.tgTitle}</p>
        <TelegramStatusBadge status={status} />
      </div>
      <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">{label}</p>
      <a
        href={linkUrl}
        target="_blank"
        rel="noreferrer"
        className={`neo-btn mt-3 min-h-[44px] w-full sm:w-auto ${status === "ok" ? "" : "neo-btn-primary"}`}
      >
        {status === "ok" ? t.tgRelink : t.tgConnect}
      </a>
    </Card>
  );
}

export function TelegramStatusBadge({ status }: { status: TelegramStatus }) {
  const t = id.users;
  const style =
    status === "ok"
      ? "bg-emerald-200"
      : status === "failed"
        ? "bg-red-200"
        : "bg-stone-200";
  const text = status === "ok" ? t.tgBadgeOk : status === "failed" ? t.tgBadgeFailed : t.tgBadgeNone;
  return (
    <span className={`inline-block shrink-0 border-2 border-black px-2 py-0.5 text-xs font-black ${style}`}>
      {text}
    </span>
  );
}
