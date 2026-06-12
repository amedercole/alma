import type { NextRequest } from "next/server";
import { z } from "zod";
import { Role } from "@/generated/prisma/client";
import { errorToResponse } from "@/lib/errors";
import { setSessionCookie } from "@/server/auth/cookies";
import { hashPassword } from "@/server/auth/password";
import { prisma } from "@/server/db/client";

const schema = z.object({ email: z.email("A valid email is required") });

/**
 * POST /api/demo/login — DEMO ONLY.
 *
 * This app runs as a public demo with no password step: a visitor enters an
 * email on the start screen and is signed in as an attorney with that email.
 * We upsert a real `User` and set the normal signed session cookie, so the rest
 * of the app keeps its real auth boundary (the dashboard still requires a valid
 * session) — we just provision the session here instead of verifying a password.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = schema.parse(await request.json());
    const name = email.split("@")[0] || "Demo Attorney";

    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      // password is unused in the demo flow, but the column is required.
      create: {
        email,
        name,
        passwordHash: await hashPassword("password123"),
        role: Role.ATTORNEY,
      },
    });

    await setSessionCookie({ userId: user.id, role: user.role });

    return Response.json({
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
