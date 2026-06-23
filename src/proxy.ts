import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/session";

const PUBLIC_PREFIXES = ["/login", "/api/cron", "/manifest.json", "/sw.js", "/icon"];

// ponytail: let public/ assets through without auth
const PUBLIC_FILE = /\.(jpg|jpeg|png|webp|gif|svg|ico)$/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("yono_session")?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    const login = new URL("/login", request.url);
    return NextResponse.redirect(login);
  }

  if (
    (pathname.startsWith("/yono") || pathname.startsWith("/settings")) &&
    session.role !== "yono"
  ) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};