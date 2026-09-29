import { requireStrictAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { id } from "@/lib/id";
import { PageShell } from "@/components/ui";
import { AppNav } from "@/components/nav";
import { UsersTable } from "./users-table";

export default async function UsersPage() {
  const user = await requireStrictAdmin();

  const rawUsers = await db.user.findMany({
    orderBy: [
      { role: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      role: true,
      telegramChatId: true,
      createdAt: true,
    },
  });

  // Sort so yono is first, then admin, then member
  const rolePriority: Record<string, number> = {
    yono: 0,
    admin: 1,
    member: 2,
  };

  const sortedUsers = [...rawUsers].sort((a, b) => {
    const priorityDiff = (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99);
    if (priorityDiff !== 0) return priorityDiff;
    return a.name.localeCompare(b.name);
  });

  const users = sortedUsers.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    telegramChatId: u.telegramChatId,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <PageShell
      title={id.users.title}
      nav={<AppNav role={user.role} />}
      maxWidth="max-w-4xl"
    >
      <div className="flex flex-col gap-2 -mt-2 mb-2">
        <p className="text-sm font-semibold text-[var(--text-muted)]">
          {id.users.subtitle}
        </p>
      </div>

      <UsersTable users={users} currentUserId={user.id} />
    </PageShell>
  );
}
