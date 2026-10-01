import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { id } from "@/lib/id";
import { PageShell } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { formatDateKey, formatDisplayDate, parseDateKey } from "@/lib/dates";
import { ReportView, type ReportDay } from "@/components/report-view";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await requireAdmin();

  const rawMenus = await db.menu.findMany({
    include: {
      responses: {
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
    orderBy: { date: "desc" },
  });

  const monthFormatter = new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
  });

  const reportDays: ReportDay[] = rawMenus.map((menu) => {
    const dateKey = formatDateKey(menu.date);
    const dateDisplay = formatDisplayDate(dateKey);
    const parsedDate = parseDateKey(dateKey);
    const monthKey = dateKey.slice(0, 7);
    const monthDisplay = monthFormatter.format(parsedDate);

    const nonYonoResponses = menu.responses.filter((r) => r.user.role !== "yono");
    const eatingResponses = nonYonoResponses.filter((r) => r.wants);
    const notEatingResponses = nonYonoResponses.filter((r) => !r.wants);

    // Group portion breakdown by variant + add-on + note
    const portionMap = new Map<string, number>();
    for (const r of eatingResponses) {
      const dish = r.swapDish?.trim() || menu.dish;
      const dishLabel = dish !== menu.dish ? (dish.startsWith("(") ? dish : `(${dish})`) : dish;
      const addOns = r.addOns?.trim() ? ` [+ ${r.addOns.trim()}]` : "";
      const note = r.note?.trim() ? ` [Catatan: ${r.note.trim()}]` : "";
      const key = `${dishLabel}${addOns}${note}`;
      portionMap.set(key, (portionMap.get(key) ?? 0) + 1);
    }

    const breakdown = Array.from(portionMap.entries()).map(([label, count]) => ({
      label,
      count,
    }));

    const eaters = eatingResponses.map((r) => ({
      name: r.user.name,
      dish: r.swapDish?.trim() || menu.dish,
      addOns: r.addOns?.trim() || null,
      note: r.note?.trim() || null,
    }));

    const nonEaters = notEatingResponses.map((r) => r.user.name);

    return {
      id: menu.id,
      dateKey,
      dateDisplay,
      monthKey,
      monthDisplay,
      dish: menu.dish,
      note: menu.note,
      totalPortions: eatingResponses.length,
      totalNotEating: notEatingResponses.length,
      breakdown,
      eaters,
      nonEaters,
    };
  });

  return (
    <PageShell
      title={id.reports.title}
      maxWidth="max-w-4xl"
      nav={<AppNav role={user.role} />}
    >
      <div className="no-print -mt-3">
        <p className="text-sm font-medium text-[var(--text-muted)]">
          {id.reports.subtitle}
        </p>
      </div>

      <ReportView days={reportDays} />
    </PageShell>
  );
}
