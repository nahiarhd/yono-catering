import { redirect } from "next/navigation";
import { requireUser, canOrder } from "@/lib/auth";
import { todayKey, formatDisplayDate } from "@/lib/dates";
import { effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay } from "@/lib/menu-data";
import { parseSubDishes } from "@/lib/dishes";
import {
  getPreferenceForDish,
  preferenceToInitial,
} from "@/lib/preferences";
import { id } from "@/lib/id";
import { db } from "@/lib/db";
import { buildTally } from "@/lib/tally";
import { submitResponseAction } from "./actions";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { DatePicker } from "@/components/date-picker";
import { ResponseForm } from "@/components/response-form";
import { MemberOrdersSummary } from "@/components/member-orders-summary";

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
  const [{ settings, menu, locked }, eaters] = await Promise.all([
    getMenuDay(dateKey),
    db.user.findMany({
      where: { role: { not: "yono" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const myResponse = menu?.responses.find((r) => r.userId === user.id);
  const dishPreference =
    menu && canOrder(user)
      ? await getPreferenceForDish(user.id, menu.dish)
      : null;
  const responseInitial = myResponse ?? preferenceToInitial(dishPreference);
  const prefilledFromPreference = !myResponse && !!dishPreference;
  const subDishes = menu ? parseSubDishes(menu.subDishes) : [];
  const t = id.home;

  const nonYonoResponses = menu
    ? menu.responses.filter((r) => r.user.role !== "yono")
    : [];
  const tally = menu ? buildTally(menu.dish, nonYonoResponses) : null;
  const respondedUserIds = new Set(nonYonoResponses.map((r) => r.userId));
  const pendingMembers = eaters
    .filter((e) => !respondedUserIds.has(e.id))
    .map((e) => e.name);

  const eatingOrders = nonYonoResponses
    .filter((r) => r.wants)
    .map((r) => ({
      name: r.user.name,
      dish: r.swapDish || menu!.dish,
      note: r.note,
    }));

  const notEatingOrders = nonYonoResponses
    .filter((r) => !r.wants)
    .map((r) => ({
      name: r.user.name,
      note: r.note,
    }));

  return (
    <PageShell title={formatDisplayDate(dateKey)} nav={<AppNav role={user.role} />}>
      <DatePicker key={dateKey} value={dateKey} todayKey={todayKey()} basePath="/home" />

      {menu ? (
        <>
          <Card accent="yellow">
            <p className="text-sm font-bold uppercase">{t.todaysDish}</p>
            <p className="mt-2 text-2xl font-extrabold">{menu.dish}</p>
            {subDishes.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-muted)] mr-1">
                  Varian:
                </span>
                {subDishes.map((sub) => (
                  <span
                    key={sub}
                    className="text-xs font-bold bg-amber-100 border border-black px-2 py-0.5"
                  >
                    {sub}
                  </span>
                ))}
              </div>
            )}
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
                  {myResponse.wants
                    ? `${id.response.eating}: ${menu.dish}${myResponse.swapDish ? ` (${myResponse.swapDish})` : ""}`
                    : id.response.notEating}
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
              subDishes={subDishes}
              initial={responseInitial}
              prefilledFromPreference={prefilledFromPreference}
            />
          )}

          {tally && (
            <MemberOrdersSummary
              mainDish={menu.dish}
              totalMembers={eaters.length}
              eatingOrders={eatingOrders}
              notEatingOrders={notEatingOrders}
              pendingMembers={pendingMembers}
              breakdown={tally.breakdown}
              totalPortions={tally.total}
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