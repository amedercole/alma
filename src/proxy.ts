import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/server/auth/session";

/**
 * Proxy (Next.js 16's renamed Middleware). This is an *optimistic* auth gate
 * only — it redirects obviously-unauthenticated users away from protected
 * pages and authenticated users away from /login for a better UX. The real
 * authorization boundary lives in the DAL (`requireSession*`) next to the data.
 */
const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ONLY_PATHS = ["/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (AUTH_ONLY_PATHS.includes(pathname) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
