import { z } from "zod";

/**
 * Schema for the environment variables the web app needs at runtime.
 *
 * NOTE: RESEND_API_KEY is intentionally NOT included here — sending email is
 * the worker's job. The web app only ever enqueues jobs (e.g. via
 * enqueueMagicLink) and never talks to an email provider directly.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().min(1, "BETTER_AUTH_URL is required"),
  NEXT_PUBLIC_APP_URL: z.string().min(1, "NEXT_PUBLIC_APP_URL is required"),
  STRIPE_SECRET_KEY: z.string().min(1, "STRIPE_SECRET_KEY is required"),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, "STRIPE_WEBHOOK_SECRET is required"),
  STRIPE_PRICE_ID_MONTHLY: z.string().min(1, "STRIPE_PRICE_ID_MONTHLY is required"),
  STRIPE_PRICE_ID_ANNUAL: z.string().min(1, "STRIPE_PRICE_ID_ANNUAL is required"),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | undefined;

/**
 * Lazily parses and validates process.env. Call this inside request
 * handlers / config factories — never at module top-level — so that a
 * misconfigured deploy fails fast with a readable list of exactly which
 * variables are missing, rather than a generic 500 somewhere downstream.
 */
export function getEnv(): Env {
  if (cachedEnv) {
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => issue.path.join("."))
      .filter((path, index, arr) => arr.indexOf(path) === index);
    throw new Error(
      `Missing or invalid required environment variables: ${missing.join(", ")}. ` +
        `Set these in your Railway service (or .env file) before starting the app.`
    );
  }

  cachedEnv = result.data;
  return cachedEnv;
}
