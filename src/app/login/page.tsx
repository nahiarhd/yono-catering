import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "yono" ? "/yono" : "/home");

  const [rawUsers, rawGroups] = await Promise.all([
    db.user.findMany({
      select: {
        name: true,
        role: true,
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.group.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const sortedUsers = [...rawUsers].sort((a, b) => {
    const isAYono = a.role === "yono" || a.name.toLowerCase().includes("yono");
    const isBYono = b.role === "yono" || b.name.toLowerCase().includes("yono");
    if (isAYono && !isBYono) return -1;
    if (!isAYono && isBYono) return 1;
    return a.name.localeCompare(b.name);
  });

  const yonoUser = sortedUsers.find(
    (u) => u.role === "yono" || u.name.toLowerCase().includes("yono")
  );

  const users = sortedUsers.map((u) => ({
    name: u.name,
    role: u.role,
    groupName: u.group?.name ?? null,
  }));

  const groups = rawGroups.map((g) => g.name);

  return (
    <LoginForm
      users={users}
      groups={groups}
      yonoName={yonoUser ? yonoUser.name : undefined}
    />
  );
}