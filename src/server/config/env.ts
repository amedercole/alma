import { z } from "zod";

/**
 * Centralized, validated access to server-side environment variables.
 *
 * Parsing happens once at module load so the process fails fast with a clear
 * message if a required variable is missing or malformed, rather than blowing
 * up deep inside a request. This module must only be imported from server code.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Database (Postgres on Railway in production).
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Secret used to sign session JWTs. Must be long enough to be meaningful.
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters"),

  // Email. RESEND_API_KEY is optional: when absent we fall back to a console
  // transport so the app is fully runnable locally without credentials.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(1).default("Alma Leads <onboarding@resend.dev>"),
  ATTORNEY_NOTIFY_EMAIL: z.email().default("attorney@example.com"),

  // Storage abstraction. `local` writes to disk (a Railway volume in prod).
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_DIR: z.string().min(1).default("./storage/uploads"),

  // Public base URL, used to build links inside notification emails.
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

/** True when a real email provider is configured. */
export const isEmailConfigured = Boolean(env.RESEND_API_KEY);
