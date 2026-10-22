import { requireStrictAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { id } from "@/lib/id";
import { PageShell, Card } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { AnnouncementForm } from "./announcement-form";
import { AnnouncementHistory } from "./announcement-history";

export default async function AnnouncementsPage() {
  const user = await requireStrictAdmin();
  const t = id.announcements;

  const [recipientCount, announcements] = await Promise.all([
    db.user.count({
      where: {
        active: true,
        telegramChatId: { not: null },
      },
    }),
    db.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { name: true },
        },
      },
      take: 30,
    }),
  ]);

  return (
    <PageShell title={t.title} nav={<AppNav role={user.role} />}>
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-black">{t.formTitle}</h2>
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            {t.subtitle}
          </p>
        </div>
        <AnnouncementForm recipientCount={recipientCount} />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-black">{t.historyTitle}</h2>
        <AnnouncementHistory announcements={announcements} />
      </Card>
    </PageShell>
  );
}
