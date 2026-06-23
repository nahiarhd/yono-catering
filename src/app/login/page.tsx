import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(user.role === "yono" ? "/yono" : "/home");

  const users = await db.user.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return <LoginForm names={users.map((u) => u.name)} />;
}