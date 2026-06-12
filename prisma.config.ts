import "dotenv/config";
import { defineConfig } from "prisma/config";

/**
 * Prisma 7 configuration.
 *
 * In Prisma 7 the database connection URL is no longer declared in
 * `schema.prisma`. The Prisma CLI (migrate, db push, studio) reads the
 * connection string from here, while the runtime `PrismaClient` connects via a
 * driver adapter (see `src/server/db/client.ts`).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read directly from process.env (rather than Prisma's `env()` helper) so
    // commands that don't connect — notably `prisma generate` during
    // `postinstall`/CI/Railway builds — don't fail when the URL isn't injected
    // yet. Commands that do connect (migrate/studio) still error clearly if it
    // is genuinely missing.
    url: process.env.DATABASE_URL,
  },
});
