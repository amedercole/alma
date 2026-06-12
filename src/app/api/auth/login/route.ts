import type { NextRequest } from "next/server";
import { z } from "zod";
import { errorToResponse } from "@/lib/errors";
import { login } from "@/server/auth/auth.service";
import { setSessionCookie } from "@/server/auth/cookies";

const loginSchema = z.object({
  email: z.email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

/** POST /api/auth/login — PUBLIC. Verifies credentials and sets the session cookie. */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = loginSchema.parse(await request.json());
    const user = await login(email, password);
    await setSessionCookie({ userId: user.id, role: user.role });
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
