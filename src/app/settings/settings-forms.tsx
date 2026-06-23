"use client";

import { useActionState } from "react";
import {
  updateSettingsAction,
  addMemberAction,
  resetPinAction,
  removeMemberAction,
} from "./actions";
import { TimePicker } from "@/components/time-picker";
import { id } from "@/lib/id";
import { Button, Input } from "@/components/ui";

export function SettingsForm({
  standingCutoff,
  reminderTime,
}: {
  standingCutoff: string;
  reminderTime: string;
}) {
  const [state, action, pending] = useActionState(updateSettingsAction, {});
  const t = id.settings;

  return (
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
        {t.saveTimes}
      </Button>
    </form>
  );
}

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMemberAction, {});
  const t = id.settings;

  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="neo-label">{t.addMember}</p>
      <Input name="name" placeholder={t.name} required />
      <Input name="pin" placeholder={t.initialPin} type="password" required />
      {state.error && <p className="font-bold text-[var(--danger)]">{state.error}</p>}
      {state.ok && <p className="font-bold text-[var(--success)]">{t.memberAdded}</p>}
      <Button type="submit" disabled={pending}>
        {t.add}
      </Button>
    </form>
  );
}

export function MemberRow({ id: memberId, name }: { id: string; name: string }) {
  const [pinState, pinAction, pinPending] = useActionState(resetPinAction, {});
  const [removeState, removeAction, removePending] = useActionState(removeMemberAction, {});
  const t = id.settings;

  return (
    <li className="border-2 border-black p-3">
      <p className="font-extrabold">{name}</p>
      <form action={pinAction} className="mt-2 flex flex-wrap gap-2">
        <input type="hidden" name="memberId" value={memberId} />
        <Input name="pin" placeholder={t.newPin} type="password" className="max-w-[140px]" />
        <Button type="submit" variant="ghost" disabled={pinPending} className="text-sm">
          {t.resetPin}
        </Button>
      </form>
      {pinState.error && (
        <p className="mt-1 text-sm font-bold text-[var(--danger)]">{pinState.error}</p>
      )}
      {pinState.ok && (
        <p className="mt-1 text-sm font-bold text-[var(--success)]">{t.pinUpdated}</p>
      )}
      <form action={removeAction} className="mt-2">
        <input type="hidden" name="memberId" value={memberId} />
        <Button type="submit" variant="danger" disabled={removePending} className="text-sm">
          {t.remove}
        </Button>
      </form>
      {removeState.error && (
        <p className="mt-1 text-sm font-bold text-[var(--danger)]">{removeState.error}</p>
      )}
    </li>
  );
}