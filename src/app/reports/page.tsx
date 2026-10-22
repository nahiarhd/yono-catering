import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { id } from "@/lib/id";
import { PageShell } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { isValidDateKey } from "@/lib/cutoff";
import { formatDateKey, parseDateKey, todayKey } from "@/lib/dates";
import { buildReport } from "@/lib/report";
import { ReportView } from "@/components/report-view";

export const dynamic = "force-dynamic";

const MAX_RANGE_DAYS = 366;

function addDays(key: string, days: number) {
  return formatDateKey(new Date(parseDateKey(key).getTime() + days * 86_400_000));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const user = await requireAdmin();
  const params = await searchParams;
  const today = todayKey();
  const monthStart = `${today.slice(0, 7)}-01`;

  let from = params.from && isValidDateKey(params.from) ? params.from : monthStart;
  let to = params.to && isValidDateKey(params.to) ? params.to : today;
  if (from > to) [from, to] = [to, from];
  // Keeps the query bounded however wide a hand-typed URL asks for
  if (from < addDays(to, -MAX_RANGE_DAYS)) from = addDays(to, -MAX_RANGE_DAYS);

  const lastMonthEnd = addDays(monthStart, -1);
  const presets = [
    { label: id.reports.thisMonth, from: monthStart, to: today },
    { label: id.reports.lastMonth, from: `${lastMonthEnd.slice(0, 7)}-01`, to: lastMonthEnd },
    { label: id.reports.last30, from: addDays(today, -29), to: today },
  ];

  const menus = await db.menu.findMany({
    where: { date: { gte: parseDateKey(from), lte: parseDateKey(to) } },
    include: {
      responses: {
        include: {
          user: { select: { id: true, name: true, role: true, group: { select: { name: true } } } },
        },
        orderBy: { user: { name: "asc" } },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });

  return (
    <PageShell title={id.reports.title} maxWidth="max-w-5xl" nav={<AppNav role={user.role} />}>
      <ReportView
        report={buildReport(menus)}
        from={from}
        to={to}
        presets={presets}
        printedAt={new Intl.DateTimeFormat("id-ID", {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: process.env.HOUSEHOLD_TZ ?? "Asia/Jakarta",
        }).format(new Date())}
      />
    </PageShell>
  );
}
