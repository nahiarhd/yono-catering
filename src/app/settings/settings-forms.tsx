"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "./actions";
import { TimePicker } from "@/components/time-picker";
import { id } from "@/lib/id";
import { Button } from "@/components/ui";

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