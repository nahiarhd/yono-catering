import Link from "next/link";
import { requireUser, isAdmin } from "@/lib/auth";
import { getSettings, getDefaultDishes } from "@/lib/settings";
import { id } from "@/lib/id";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { db } from "@/lib/db";
import { todayKey, parseDateKey } from "@/lib/dates";
import { DefaultDishesForm } from "@/components/default-dishes-form";
import { UpdatePinCard } from "@/components/update-pin-card";
import { SettingsForm } from "./settings-forms";

export default async function SettingsPage() {
  const user = await requireUser();
  const isKitchenOrAdmin = isAdmin(user);
  const isSuperAdmin = user.role === "admin";

  const [settings, defaultDishes, todayMenu, telegramCount, totalMembers] = isKitchenOrAdmin
    ? await Promise.all([
        getSettings(),
        getDefaultDishes(),
        db.menu.findUnique({ where: { date: parseDateKey(todayKey()) } }),
        db.user.count({ where: { role: { not: "yono" }, telegramChatId: { not: null } } }),
        db.user.count({ where: { role: { not: "yono" } } }),
      ])
    : [null, null, null, 0, 0];

  const reminderSentAt = todayMenu?.reminderSentAt
    ? todayMenu.reminderSentAt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <PageShell title={id.settings.title} nav={<AppNav role={user.role} />}>
      {/* Pengaturan Akun: Ubah PIN (Bisa diakses oleh semua pengguna) */}
      <UpdatePinCard />

      {/* Pengaturan Katering & Dapur (Hanya untuk Admin & Pak Yono) */}
      {isKitchenOrAdmin && settings && defaultDishes && (
        <>
          <SettingsForm
            standingCutoff={settings.standingCutoff}
            reminderTime={settings.reminderTime}
            hasTelegramToken={Boolean(process.env.TELEGRAM_BOT_TOKEN)}
            telegramCount={telegramCount}
            totalMembers={totalMembers}
            reminderSentAt={reminderSentAt}
          />

          <DefaultDishesForm dishes={defaultDishes} />
        </>
      )}

      {/* Shortcut ke Preferensi Menu untuk Member */}
      {!isKitchenOrAdmin && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="neo-label">{id.preferences.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)] font-medium">
                Atur pilihan otomatis kamu setiap kali menu katering tertentu diposting.
              </p>
            </div>
            <Link
              href="/preferences"
              className="neo-btn neo-btn-primary text-sm whitespace-nowrap min-h-[44px]"
            >
              Buka Preferensi →
            </Link>
          </div>
        </Card>
      )}

      {/* Kelola Pengguna (Super Admin) */}
      {isSuperAdmin && (
        <Card>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="neo-label">{id.users.title}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)] font-medium">
                {id.settings.manageUsersHint}
              </p>
            </div>
            <Link
              href="/users"
              className="neo-btn neo-btn-primary text-sm whitespace-nowrap min-h-[44px]"
            >
              {id.settings.manageUsersBtn} →
            </Link>
          </div>
        </Card>
      )}
    </PageShell>
  );
}