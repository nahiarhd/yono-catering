"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button, Input, Label } from "@/components/ui";
import { id } from "@/lib/id";
import { sendAnnouncementAction } from "./actions";

interface AnnouncementFormProps {
  recipientCount: number;
}

export function AnnouncementForm({ recipientCount }: AnnouncementFormProps) {
  const [state, formAction, isPending] = useActionState(sendAnnouncementAction, {});
  const [charCount, setCharCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const t = id.announcements;

  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [state.ok]);

  const handleAction = async (formData: FormData) => {
    setCharCount(0);
    return formAction(formData);
  };

  return (
    <form ref={formRef} action={handleAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement-title">{t.titleLabel}</Label>
        <Input
          id="announcement-title"
          name="title"
          type="text"
          placeholder={t.titlePlaceholder}
          maxLength={100}
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="announcement-message">{t.messageLabel}</Label>
          <span className="text-xs font-bold text-[var(--text-muted)]">
            {charCount} karakter
          </span>
        </div>
        <textarea
          id="announcement-message"
          name="message"
          rows={4}
          onChange={(e) => setCharCount(e.target.value.length)}
          placeholder={t.messagePlaceholder}
          required
          disabled={isPending}
          className="neo-input min-h-[110px] resize-y"
        />
      </div>

      <div className="rounded border-2 border-black bg-blue-50 p-3 text-xs font-semibold text-blue-900 shadow-[2px_2px_0px_#000]">
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 shrink-0 fill-current text-[#0088cc]"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
          </svg>
          <span>
            {recipientCount > 0
              ? t.recipientInfo(recipientCount)
              : t.noRecipients}
          </span>
        </div>
      </div>

      {state.error && (
        <div
          role="alert"
          className="border-2 border-black bg-rose-100 p-3 text-sm font-bold text-rose-900 shadow-[2px_2px_0px_#000]"
        >
          {state.error}
        </div>
      )}

      {state.ok && (
        <div
          role="status"
          className="border-2 border-black bg-emerald-100 p-3 text-sm font-bold text-emerald-900 shadow-[2px_2px_0px_#000]"
        >
          {t.sendSuccess(state.sentCount ?? 0, state.failedCount ?? 0)}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        disabled={isPending || recipientCount === 0 || charCount === 0}
        className="min-h-[44px] justify-center text-sm font-black uppercase tracking-wider"
      >
        {isPending ? t.sendingBtn : t.sendBtn}
      </Button>
    </form>
  );
}
