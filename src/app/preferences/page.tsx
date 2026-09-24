import { requireUser } from "@/lib/auth";
import { getDefaultDishes } from "@/lib/settings";
import { getUserDishPreferences } from "@/lib/preferences";
import { id } from "@/lib/id";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { DishPreferencesCard } from "@/components/dish-preferences-card";

export default async function PreferencesPage() {
  const user = await requireUser();
  const [defaultDishes, preferences] = await Promise.all([
    getDefaultDishes(),
    getUserDishPreferences(user.id),
  ]);

  return (
    <PageShell title={id.preferences.title} nav={<AppNav role={user.role} />}>
      <Card>
        <p className="text-sm font-semibold text-[var(--text-muted)]">
          Atur pilihan otomatis kamu setiap kali menu tertentu diposting.
          Jawaban harianmu akan terisi otomatis, tapi kamu tetap bisa mengubahnya sebelum batas waktu.
        </p>
      </Card>

      {defaultDishes.length > 0 ? (
        <DishPreferencesCard dishes={defaultDishes} preferences={preferences} />
      ) : (
        <Card>
          <p className="font-bold text-[var(--text-muted)]">
            Belum ada menu bawaan yang ditambahkan oleh admin.
          </p>
        </Card>
      )}
    </PageShell>
  );
}
