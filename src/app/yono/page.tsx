import { requireYono } from "@/lib/auth";
import { todayKey, formatDisplayDate } from "@/lib/dates";
import { effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay } from "@/lib/menu-data";
import { getDefaultDishes } from "@/lib/settings";
import { buildTally } from "@/lib/tally";
import { buildWhatsAppMessage, buildWhatsAppUrl, type WhatsAppOrder } from "@/lib/whatsapp";
import { id } from "@/lib/id";
import { db } from "@/lib/db";
import { PageShell } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { YonoSlideDashboard } from "@/components/yono-slide-dashboard";
import { WarungTabs } from "@/components/warung-tabs";

export default async function YonoHomePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const user = await requireYono();
  const { m } = await searchParams;
  const dateKey = todayKey();
  const [day, defaultDishes, eaters] = await Promise.all([
    getMenuDay(dateKey, m),
    getDefaultDishes(),
    db.user.findMany({
      where: { role: { not: "yono" }, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const { settings, menus } = day;
  // ?m=new opens an empty form to add another warung for today
  const menu = m === "new" ? null : day.menu;
  const locked = menu ? day.locked : false;

  if (menu && !menu.reminderSentAt) {
    import("@/lib/reminder-service").then(({ checkAndSendReminders }) => {
      checkAndSendReminders().catch(() => {});
    });
  }

  const t = id.yono;

  const nonYonoResponses = menu
    ? menu.responses.filter((r) => r.user.role !== "yono")
    : [];

  const tally = menu ? buildTally(menu.dish, nonYonoResponses) : null;

  // Someone who ordered at another warung today is not pending here
  const respondedUserIds = new Set(menus.flatMap((x) => x.responses.map((r) => r.userId)));
  const pendingUsers = eaters.filter((e) => !respondedUserIds.has(e.id));
  const pendingMembers = pendingUsers.map((e) => e.name);

  const eatingOrders: WhatsAppOrder[] = nonYonoResponses
    .filter((r) => r.wants)
    .map((r) => ({
      name: r.user.name,
      dish: r.swapDish || menu!.dish,
      addOns: r.addOns,
      wants: true,
      note: r.note,
    }));

  const notEatingOrders: WhatsAppOrder[] = nonYonoResponses
    .filter((r) => !r.wants)
    .map((r) => ({
      userId: r.userId,
      name: r.user.name,
      dish: undefined,
      addOns: undefined,
      wants: false,
      note: r.note,
    }));

  const orders: WhatsAppOrder[] = [...eatingOrders, ...notEatingOrders];

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
        addOnBreakdown: tally?.addOnBreakdown ?? [],
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
      <WarungTabs
        menus={menus}
        activeId={menu?.id ?? null}
        hrefFor={(menuId) => `/yono?m=${menuId}`}
        addHref={menus.length > 0 ? "/yono?m=new" : undefined}
      />
      <YonoSlideDashboard
        key={`${dateKey}-${menu?.id ?? "new"}`}
        dateKey={dateKey}
        dateDisplay={formatDisplayDate(dateKey)}
        menu={
          menu
            ? {
                id: menu.id,
                vendor: menu.vendor,
                dish: menu.dish,
                subDishes: menu.subDishes,
                addOns: menu.addOns,
                dishOptions: menu.dishOptions,
                note: menu.note,
                cutoffOverride: menu.cutoffOverride,
              }
            : null
        }
        locked={locked}
        defaultDishes={defaultDishes}
        eaters={eaters}
        tally={tally}
        eatingOrders={eatingOrders}
        notEatingOrders={notEatingOrders}
        pendingUsers={pendingUsers}
        cutoffText={cutoffText}
        waMessage={waMessage}
        waUrl={waUrl}
      />
    </PageShell>
  );
}