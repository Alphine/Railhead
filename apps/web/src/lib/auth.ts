import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { db, schema } from "@railhead/db";
import { enqueueMagicLink } from "@railhead/queue";
import { getEnv } from "./env";

function buildAuth(env: ReturnType<typeof getEnv>) {
  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      // Magic-link auth: Better Auth never sends email itself here. It
      // hands us the destination email + signed URL, and we enqueue a job
      // for the worker (@railhead/queue -> @railhead/email) to send it.
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await enqueueMagicLink({ email, url });
        },
      }),
    ],
  });
}

export type Auth = ReturnType<typeof buildAuth>;

let cachedAuth: Auth | undefined;

/**
 * Builds (and caches) the Better Auth instance. This is a factory — never
 * called at module top-level — so that getEnv() only runs (and only throws
 * on misconfiguration) once a request actually needs auth.
 */
export function getAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }

  cachedAuth = buildAuth(getEnv());
  return cachedAuth;
}
