import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/generated/prisma/client";
import { env } from "@/server/config/env";

/**
 * Pure session-token logic (no cookie / Next.js dependencies) so it can be
 * unit-tested in isolation. Cookie I/O lives in `cookies.ts`.
 */
export const SESSION_COOKIE = "alma_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  userId: string;
  role: Role;
}

const encodedKey = new TextEncoder().encode(env.SESSION_SECRET);

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId, role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(encodedKey);
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.userId === "string" &&
      typeof payload.role === "string"
    ) {
      return { userId: payload.userId, role: payload.role as Role };
    }
    return null;
  } catch {
    // Invalid/expired token -> treat as no session.
    return null;
  }
}
