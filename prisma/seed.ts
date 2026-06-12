import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
// Relative import (not the `@/` alias) so this script runs under `tsx` without
// relying on tsconfig path resolution.
import { PrismaClient, Role } from "../src/generated/prisma/client";

/**
 * Seeds an internal attorney account so the authenticated dashboard is usable
 * immediately after setup. Idempotent: re-running updates the existing user.
 */
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = process.env.SEED_ATTORNEY_EMAIL ?? "attorney@alma.test";
  const password = process.env.SEED_ATTORNEY_PASSWORD ?? "password123";
  const name = process.env.SEED_ATTORNEY_NAME ?? "Alma Attorney";

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.ATTORNEY },
    create: { email, name, passwordHash, role: Role.ATTORNEY },
  });

  console.log(`Seeded attorney account: ${user.email} (password: ${password})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
