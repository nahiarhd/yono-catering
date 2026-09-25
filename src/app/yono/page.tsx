import { redirect } from "next/navigation";
import { requireYono } from "@/lib/auth";
import { todayKey, formatDisplayDate } from "@/lib/dates";
import { effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay } from "@/lib/menu-data";
import { getDefaultDishes } from "@/lib/settings";
import { buildTally } from "@/lib/tally";
import { buildWhatsAppMessage, buildWhatsAppUrl, type WhatsAppOrder } from "@/lib/whatsapp";
import { id } from "@/lib/id";
import { db } from "@/lib/db";
import { postMenuAction } from "./actions";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { DatePicker } from "@/components/date-picker";
import { MenuForm } from "@/components/menu-form";
import { WhatsAppShareCard } from "@/components/whatsapp-share";

export default async function YonoHomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireYono();
  const params = await searchParams;
  const today = todayKey();
  if (params.date && params.date < today) {
    redirect("/yono");
  }
  const dateKey = params.date ?? today;
  const [{ settings, menu, locked }, defaultDishes, eaters] = await Promise.all([
    getMenuDay(dateKey),
    getDefaultDishes(),
    db.user.findMany({
      where: { role: { not: "yono" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const t = id.yono;

  const nonYonoResponses = menu
    ? menu.responses.filter((r) => r.user.role !== "yono")
    : [];

  const tally = menu ? buildTally(menu.dish, nonYonoResponses) : null;

  const respondedUserIds = new Set(nonYonoResponses.map((r) => r.userId));
  const pendingMembers = eaters
    .filter((e) => !respondedUserIds.has(e.id))
    .map((e) => e.name);

  const isAllAnswered = eaters.length > 0 && pendingMembers.length === 0;

  const orders: WhatsAppOrder[] = nonYonoResponses.map((r) => ({
    name: r.user.name,
    dish: r.wants ? menu!.dish : (r.swapDish?.trim() || id.tally.swap),
    isSwap: !r.wants,
    note: r.note,
  }));

  const cutoffText = menu
    ? effectiveCutoff(settings.standingCutoff, menu.cutoffOverride)
    : settings.standingCutoff;

  const waMessage = menu
    ? buildWhatsAppMessage({
        dateDisplay: formatDisplayDate(dateKey),
        dish: menu.dish,
        note: menu.note,
        cutoff: cutoffText,
        breakdown: tally?.breakdown ?? [],
        totalPortions: tally?.total ?? 0,
        orders,
        pendingMembers,
      })
    : "";

  const waUrl = waMessage ? buildWhatsAppUrl(waMessage) : "";

  return (
    <PageShell
      title={`${t.kitchen} · ${formatDisplayDate(dateKey)}`}
      nav={<AppNav role={user.role} />}
    >
      <DatePicker key={dateKey} value={dateKey} todayKey={todayKey()} basePath="/yono" />

      <MenuForm
        action={postMenuAction}
        dateKey={dateKey}
        defaultDishes={defaultDishes}
        initial={
          menu
            ? {
                dish: menu.dish,
                note: menu.note,
                cutoffOverride: menu.cutoffOverride,
              }
            : undefined
        }
      />

      {menu ? (
        <>
          <Card>
            <div className="flex items-center justify-between gap-2">
              <h2 className="neo-label text-base">{t.liveTally}</h2>
              <span className="text-xs font-bold text-[var(--text-muted)]">
                {t.cutoff}: {cutoffText} {locked ? `· ${t.locked}` : `· ${t.open}`}
              </span>
            </div>

            <div className="mt-3">
              {isAllAnswered ? (
                <div className="border-2 border-black bg-[var(--primary)] p-3 text-sm font-black flex items-center justify-between">
                  <span>✓ {t.allAnswered}</span>
                  <span className="text-xs border-2 border-black bg-black text-white px-2 py-0.5 uppercase">
                    Lengkap ({orders.length}/{eaters.length})
                  </span>
                </div>
              ) : (
                <div className="border-2 border-black bg-[var(--surface-sunken)] p-3 text-sm font-extrabold flex items-center justify-between">
                  <span>⏳ {t.partialAnswered(orders.length, eaters.length)}</span>
                  <span className="text-xs border-2 border-black bg-white px-2 py-0.5 uppercase">
                    {pendingMembers.length} Belum
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <p className="neo-label text-xs">{t.portionBreakdown}</p>
              {tally && tally.breakdown.length > 0 ? (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tally.breakdown.map((item) => (
                    <div
                      key={item.dish}
                      className="border-2 border-black bg-white p-2.5 flex justify-between items-center font-bold"
                    >
                      <span className="text-sm">{item.dish}</span>
                      <span className="border-2 border-black bg-[var(--primary)] px-2 py-0.5 text-xs font-black">
                        {item.count} porsi
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm italic text-[var(--text-muted)]">Belum ada pesanan.</p>
              )}
              <p className="mt-2 text-right text-sm font-black">
                {t.totalPortions(tally?.total ?? 0)}
              </p>
            </div>

            <div className="mt-4 border-t-2 border-black pt-4">
              <p className="neo-label text-xs">{t.ordersList}</p>
              {orders.length > 0 ? (
                <ol className="mt-2 space-y-2">
                  {orders.map((o, idx) => (
                    <li
                      key={o.name}
                      className="border-2 border-black bg-[var(--surface-sunken)] p-2.5 text-sm font-semibold flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold">
                          {idx + 1}. {o.name}
                        </span>
                        <span
                          className={`text-xs border-2 border-black px-1.5 py-0.5 font-bold ${
                            o.isSwap ? "bg-amber-200" : "bg-emerald-200"
                          }`}
                        >
                          {o.isSwap ? t.swapDishLabel : t.mainDishLabel}
                        </span>
                      </div>
                      <p className="text-sm">{o.dish}</p>
                      {o.note && (
                        <p className="text-xs text-[var(--text-muted)] italic font-normal">
                          Catatan: {o.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-2 text-sm italic text-[var(--text-muted)]">
                  Belum ada anggota yang memilih.
                </p>
              )}
            </div>

            {pendingMembers.length > 0 && (
              <div className="mt-4 border-t-2 border-black pt-4">
                <p className="neo-label text-xs text-rose-700">
                  {t.pendingList} ({pendingMembers.length} orang)
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {pendingMembers.map((name) => (
                    <li
                      key={name}
                      className="border-2 border-black bg-rose-100 px-2 py-0.5 text-xs font-bold"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <WhatsAppShareCard
            message={waMessage}
            whatsappUrl={waUrl}
            totalOrders={orders.length}
          />
        </>
      ) : (
        <Card>
          <p className="neo-label">{t.liveTally}</p>
          <p className="mt-2 font-bold">{t.emptyTally}</p>
        </Card>
      )}
    </PageShell>
  );
}