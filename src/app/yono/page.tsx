import { requireYono } from "@/lib/auth";
import { todayKey, formatDisplayDate } from "@/lib/dates";
import { effectiveCutoff } from "@/lib/cutoff";
import { getMenuDay } from "@/lib/menu-data";
import { getDefaultDishes } from "@/lib/settings";
import { buildTally } from "@/lib/tally";
import { id } from "@/lib/id";
import { postMenuAction } from "./actions";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { DatePicker } from "@/components/date-picker";
import { MenuForm } from "@/components/menu-form";

export default async function YonoHomePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await requireYono();
  const params = await searchParams;
  const dateKey = params.date ?? todayKey();
  const [{ settings, menu, locked }, defaultDishes] = await Promise.all([
    getMenuDay(dateKey),
    getDefaultDishes(),
  ]);
  const t = id.yono;

  const tally = menu
    ? buildTally(
        menu.dish,
        menu.responses.filter((r) => r.user.role === "member"),
      )
    : null;

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

      <Card>
        <p className="neo-label">{t.liveTally}</p>
        {menu ? (
          <>
            <p className="mt-2 text-lg font-extrabold">{tally?.summary}</p>
            {tally?.notes.length ? (
              <ul className="mt-3 space-y-1 text-sm font-semibold">
                {tally.notes.map((n) => (
                  <li key={n.name}>
                    {n.name}: {n.note}
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="mt-3 text-sm">
              {t.cutoff}: {effectiveCutoff(settings.standingCutoff, menu.cutoffOverride)}
              {locked ? ` · ${t.locked}` : ` · ${t.open}`}
            </p>
            <ul className="mt-4 space-y-2 border-t-2 border-black pt-4">
              {menu.responses
                .filter((r) => r.user.role === "member")
                .map((r) => (
                  <li key={r.id} className="font-semibold">
                    {r.user.name}: {r.wants ? menu.dish : r.swapDish}
                    {r.note ? ` · ${r.note}` : ""}
                  </li>
                ))}
            </ul>
          </>
        ) : (
          <p className="mt-2 font-bold">{t.emptyTally}</p>
        )}
      </Card>
    </PageShell>
  );
}