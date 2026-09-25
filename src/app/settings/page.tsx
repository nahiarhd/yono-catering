import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings, getDefaultDishes } from "@/lib/settings";
import { id } from "@/lib/id";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { DefaultDishesForm } from "@/components/default-dishes-form";
import { SettingsForm, AddMemberForm, MemberRow } from "./settings-forms";

export default async function SettingsPage() {
  const user = await requireAdmin();
  const [settings, defaultDishes] = await Promise.all([getSettings(), getDefaultDishes()]);
  const isSuperAdmin = user.role === "admin";
  const members = isSuperAdmin
    ? await db.user.findMany({
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <PageShell title={id.settings.title} nav={<AppNav role={user.role} />}>
      <SettingsForm
        standingCutoff={settings.standingCutoff}
        reminderTime={settings.reminderTime}
      />

      <DefaultDishesForm dishes={defaultDishes} />

      {isSuperAdmin && (
        <Card>
          <p className="neo-label">{id.settings.members}</p>
          <ul className="mt-4 space-y-4">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                id={m.id}
                name={m.name}
                role={m.role}
                currentUserId={user.id}
              />
            ))}
          </ul>
          <div className="mt-6 border-t-2 border-black pt-4">
            <AddMemberForm />
          </div>
        </Card>
      )}
    </PageShell>
  );
}