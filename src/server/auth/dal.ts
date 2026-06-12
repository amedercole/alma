import { cache } from "react";
import { redirect } from "next/navigation";
import { UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/server/db/client";
import { readSessionFromCookie } from "@/server/auth/cookies";
import type { SessionPayload } from "@/server/auth/session";

/**
 * Data Access Layer for auth. This is the real authorization boundary: API
 * route handlers call `requireSession()` and server pages call
 * `requireSessionOrRedirect()` close to where data is accessed, rather than
 * relying on the optimistic `proxy.ts` redirect alone.
 *
 * `cache()` memoizes the session/user lookups per request render pass.
 */
export const getSession = cache(
  async (): Promise<SessionPayload | null> => readSessionFromCookie(),
);

/** For API route handlers: throws 401 if unauthenticated. */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new UnauthorizedError();
  }
  return session;
}

/** For server pages: redirects to the start screen (/) if unauthenticated. */
export async function requireSessionOrRedirect(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }
  return session;
}

/** The current authenticated user (safe fields only), or null. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
});
