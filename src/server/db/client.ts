import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/server/config/env";

/**
 * Prisma 7 client singleton.
 *
 * Prisma 7 removed the bundled Rust query engine; the client now connects
 * through a driver adapter. We use `@prisma/adapter-pg` over the standard `pg`
 * driver. The instance is memoized on `globalThis` so Next.js hot-reloads in
 * development don't exhaust the database connection pool.
 */
const createPrismaClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma: PrismaClientSingleton =
  globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
