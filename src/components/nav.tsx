"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";
import { logoutAction } from "@/app/logout-action";
import { id } from "@/lib/id";
import { Button } from "./ui";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={`neo-btn text-sm ${isActive ? "neo-btn-primary neo-btn-active" : "neo-btn-ghost"}`}
      aria-current={isActive ? "page" : undefined}
    >
      {children}
    </Link>
  );
}

export function AppNav({ role }: { role: Role }) {
  const t = id.nav;

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Navigasi Utama">
      {role === "yono" && (
        <>
          <NavLink href="/yono">{t.kitchen}</NavLink>
          <NavLink href="/settings">{t.settings}</NavLink>
        </>
      )}

      {role === "admin" && (
        <>
          <NavLink href="/home">{t.home}</NavLink>
          <NavLink href="/yono">{t.kitchen}</NavLink>
          <NavLink href="/preferences">{t.preferences}</NavLink>
          <NavLink href="/settings">{t.settings}</NavLink>
        </>
      )}

      {role === "member" && (
        <>
          <NavLink href="/home">{t.home}</NavLink>
          <NavLink href="/preferences">{t.preferences}</NavLink>
        </>
      )}
      <form action={logoutAction}>
        <Button type="submit" variant="ghost" className="text-sm">
          {t.logout}
        </Button>
      </form>
    </nav>
  );
}