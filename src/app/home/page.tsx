import { redirect } from "next/navigation";
import { requireUser, canOrder } from "@/lib/auth";
import { todayKey, formatDisplayDate } from "@/lib/dates";
import { effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay } from "@/lib/menu-data";
import { parseSubDishes, parseDefaultDishes } from "@/lib/dishes";
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

  if (dateKey === today && menu && !menu.reminderSentAt) {
    import("@/lib/reminder-service").then(({ checkAndSendReminders }) => {
      checkAndSendReminders().catch(() => {});
    });
  }

  const myResponse = menu?.responses.find((r) => r.userId === user.id);
  const dishPreference =
    menu && canOrder(user)
      ? await getPreferenceForDish(user.id, menu.dish)
      : null;
  const responseInitial = myResponse ?? preferenceToInitial(dishPreference);
  const prefilledFromPreference = !myResponse && !!dishPreference;
  const subDishes = menu ? parseSubDishes(menu.subDishes) : [];
  const addOns = menu ? parseSubDishes(menu.addOns) : [];
  const dishOptions = menu ? parseSubDishes(menu.dish) : [];
  const parsedPresets = parseDefaultDishes(settings.defaultDishes);
  const matchedPreset = menu
    ? parsedPresets.find(
        (p) =>
          p.name.trim().toLowerCase() === menu.dish.trim().toLowerCase() ||
          (p.warung && p.warung.trim().toLowerCase() === menu.dish.trim().toLowerCase())
      )
    : null;
  const warungName = matchedPreset?.warung ?? null;
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
      addOns: r.addOns,
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/20 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-black">
                {t.todaysDish}
              </span>
              {warungName && (
                <span className="text-xs font-black uppercase bg-amber-300 border border-black px-2 py-0.5 shadow-[1px_1px_0px_#000]">
                  🏪 {warungName}
                </span>
              )}
            </div>

            {dishOptions.length > 1 ? (
              <div className="mt-2.5">
                <p className="text-xs font-bold uppercase text-[var(--text-muted)] mb-1.5">
                  Daftar Pilihan Menu Hari Ini ({dishOptions.length} menu):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dishOptions.map((item) => (
                    <span
                      key={item}
                      className="text-xs font-black bg-white border-2 border-black px-2.5 py-1 shadow-[2px_2px_0px_#000]"
                    >
                      🍴 {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-2xl font-extrabold">{menu.dish}</p>
            )}

            {subDishes.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-muted)] mr-1">
                  Pilihan Varian:
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
            {addOns.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-muted)] mr-1">
                  Pilihan Add-on:
                </span>
                {addOns.map((addon) => (
                  <span
                    key={addon}
                    className="text-xs font-bold bg-emerald-100 border border-black px-2 py-0.5"
                  >
                    + {addon}
                  </span>
                ))}
              </div>
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
                    ? `${id.response.eating}: ${myResponse.swapDish || menu.dish}${
                        myResponse.addOns ? ` (+ ${myResponse.addOns})` : ""
                      }`
                    : id.response.notEating}
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
              dishOptions={dishOptions}
              subDishes={subDishes}
              addOns={addOns}
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
              addOnBreakdown={tally.addOnBreakdown}
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