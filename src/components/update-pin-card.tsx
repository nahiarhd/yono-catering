"use client";

import { useActionState, useEffect, useRef } from "react";
import { updateOwnPinAction } from "@/app/settings/actions";
import { Card, Button, Input } from "@/components/ui";
import { id } from "@/lib/id";

export function UpdatePinCard({ className = "" }: { className?: string }) {
  const [state, action, pending] = useActionState(updateOwnPinAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const t = id.account;

  useEffect(() => {
    if (state.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [state.ok]);

  return (
    <Card className={className}>
      <div className="flex flex-col gap-1">
        <h2 className="neo-label text-base">{t.updatePinTitle}</h2>
        <p className="text-xs font-medium text-[var(--text-muted)]">
          {t.updatePinDesc}
        </p>
      </div>

      <form ref={formRef} action={action} className="mt-4 flex flex-col gap-3">
        <div>
          <label
            htmlFor="currentPin"
            className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
          >
            {t.currentPin}
          </label>
          <Input
            id="currentPin"
            name="currentPin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t.currentPinPlaceholder}
            required
            autoComplete="current-password"
            className="w-full text-sm min-h-[44px]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="newPin"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
            >
              {t.newPin}
            </label>
            <Input
              id="newPin"
              name="newPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={4}
              placeholder={t.newPinPlaceholder}
              required
              autoComplete="new-password"
              className="w-full text-sm min-h-[44px]"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPin"
              className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
            >
              {t.confirmPin}
            </label>
            <Input
              id="confirmPin"
              name="confirmPin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              minLength={4}
              placeholder={t.confirmPinPlaceholder}
              required
              autoComplete="new-password"
              className="w-full text-sm min-h-[44px]"
            />
          </div>
        </div>

        {state.error && (
          <p className="border-2 border-black bg-red-100 p-2 text-xs font-bold text-[var(--danger)]">
            {state.error}
          </p>
        )}

        {state.ok && (
          <p className="border-2 border-black bg-emerald-100 p-2 text-xs font-bold text-[var(--success)]">
            {state.message || t.pinUpdatedSuccess}
          </p>
        )}

        <div className="mt-1 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={pending}
            className="w-full sm:w-auto min-h-[44px] text-sm"
          >
            {pending ? t.updatingPin : t.updatePinBtn}
          </Button>
        </div>
      </form>
    </Card>
  );
}
