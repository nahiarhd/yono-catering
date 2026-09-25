import { redirect } from "next/navigation";
import { requireUser, canOrder } from "@/lib/auth";
import { todayKey, formatDisplayDate } from "@/lib/dates";
import { effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay } from "@/lib/menu-data";
import {
  getPreferenceForDish,
  preferenceToInitial,
} from "@/lib/preferences";
import { id } from "@/lib/id";
import { savePushSubscription } from "@/app/actions/push";
import { submitResponseAction } from "./actions";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { DatePicker } from "@/components/date-picker";
import { ResponseForm } from "@/components/response-form";
import { PushSubscribe } from "@/components/push-subscribe";

export default async function MemberHomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = todayKey();
  if (params.date && params.date < today) {
    redirect("/home");
  }
  const dateKey = params.date ?? today;
  const { settings, menu, locked } = await getMenuDay(dateKey);
  const myResponse = menu?.responses.find((r) => r.userId === user.id);
  const dishPreference =
    menu && canOrder(user)
      ? await getPreferenceForDish(user.id, menu.dish)
      : null;
  const responseInitial = myResponse ?? preferenceToInitial(dishPreference);
  const prefilledFromPreference = !myResponse && !!dishPreference;
  const t = id.home;

  return (
    <PageShell title={formatDisplayDate(dateKey)} nav={<AppNav role={user.role} />}>
      <PushSubscribe onSave={savePushSubscription} />

      <DatePicker key={dateKey} value={dateKey} todayKey={todayKey()} basePath="/home" />

      {menu ? (
        <>
          <Card accent="yellow">
            <p className="text-sm font-bold uppercase">{t.todaysDish}</p>
            <p className="mt-2 text-2xl font-extrabold">{menu.dish}</p>
            {menu.note && (
              <p className="mt-2 font-semibold">
                {t.note}: {menu.note}
              </p>
            )}
            <p className="mt-3 text-sm font-semibold">
              {t.respondBefore} {effectiveCutoff(settings.standingCutoff, menu.cutoffOverride)}
              {locked ? ` · ${t.locked}` : ""}
            </p>
            {myResponse && (
              <div className="neo-response-status mt-3">
                <p className="neo-response-status-label">{t.yourStatus}</p>
                <p className="neo-response-status-value">
                  {myResponse.wants ? menu.dish : myResponse.swapDish}
                  {myResponse.note ? ` · ${myResponse.note}` : ""}
                </p>
              </div>
            )}
          </Card>

          {canOrder(user) && (
            <ResponseForm
              action={submitResponseAction}
              locked={locked}
              dateKey={dateKey}
              dish={menu.dish}
              initial={responseInitial}
              prefilledFromPreference={prefilledFromPreference}
            />
          )}
        </>
      ) : (
        <Card>
          <p className="font-bold">{t.noMenu}</p>
          <p className="mt-2 text-sm">{t.noMenuHint}</p>
        </Card>
      )}
    </PageShell>
  );
}