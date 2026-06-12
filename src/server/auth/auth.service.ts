import type { User } from "@/generated/prisma/client";
import { UnauthorizedError } from "@/lib/errors";
import { prisma } from "@/server/db/client";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/server/auth/password";

/**
 * Verifies credentials and returns the user on success. Uses the same error
 * message for unknown email and wrong password to avoid leaking which emails
 * exist.
 */
export async function login(email: string, password: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Compare against a dummy hash so unknown emails take a similar time.
    await verifyPassword(password, DUMMY_PASSWORD_HASH);
    throw new UnauthorizedError("Invalid email or password");
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return user;
}
