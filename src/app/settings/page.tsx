import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings, getDefaultDishes } from "@/lib/settings";
import { id } from "@/lib/id";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { DefaultDishesForm } from "@/components/default-dishes-form";
import { SettingsForm } from "./settings-forms";

export default async function SettingsPage() {
  const user = await requireAdmin();
  const [settings, defaultDishes] = await Promise.all([getSettings(), getDefaultDishes()]);
  const isSuperAdmin = user.role === "admin";

  return (
    <PageShell title={id.settings.title} nav={<AppNav role={user.role} />}>
      <SettingsForm
        standingCutoff={settings.standingCutoff}
        reminderTime={settings.reminderTime}
      />

      <DefaultDishesForm dishes={defaultDishes} />

      {isSuperAdmin && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="neo-label">{id.users.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)] font-medium">
                {id.settings.manageUsersHint}
              </p>
            </div>
            <Link href="/users" className="neo-btn neo-btn-primary text-sm whitespace-nowrap">
              {id.settings.manageUsersBtn} →
            </Link>
          </div>
        </Card>
      )}
    </PageShell>
  );
}