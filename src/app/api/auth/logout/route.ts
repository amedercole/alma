import { clearSessionCookie } from "@/server/auth/cookies";

/** POST /api/auth/logout — clears the session cookie. */
export async function POST() {
  await clearSessionCookie();
  return Response.json({ ok: true });
}
