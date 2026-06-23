import Link from "next/link";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/logout-action";
import { id } from "@/lib/id";
import { Button } from "./ui";

export function AppNav({ role }: { role: Role }) {
  const t = id.nav;

  return (
    <nav className="flex flex-wrap gap-2">
      {role === "yono" ? (
        <>
          <Link href="/yono" className="neo-btn neo-btn-ghost text-sm">
            {t.kitchen}
          </Link>
          <Link href="/settings" className="neo-btn neo-btn-ghost text-sm">
            {t.settings}
          </Link>
        </>
      ) : (
        <Link href="/home" className="neo-btn neo-btn-ghost text-sm">
          {t.home}
        </Link>
      )}
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" className="text-sm">
          {t.logout}
        </Button>
      </form>
    </nav>
  );
}