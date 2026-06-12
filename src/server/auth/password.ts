import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * A valid-format bcrypt hash of a random value. Comparing against this when a
 * user is not found keeps login timing roughly constant (mitigates user
 * enumeration via response time) without risking a malformed-hash error.
 */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "alma-nonexistent-user-placeholder",
  SALT_ROUNDS,
);

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
