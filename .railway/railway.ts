import { defineRailway, github, postgres, redis, service } from "railway/iac";

export default defineRailway((ctx) => {
  const db = postgres("Postgres");
  const cache = redis("Redis");

  const publicUrl = "https://${{RAILWAY_PUBLIC_DOMAIN}}";

  const web = service("web", {
    source: github("Alphine/Railhead", { branch: "main" }),
    build: "npm run build --workspaces --if-present",
    start: "npm run start --workspace=apps/web",
    healthcheck: "/api/health",
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      BETTER_AUTH_SECRET: { value: ctx.randomString("better-auth-secret", 32) },
      BETTER_AUTH_URL: publicUrl,
      NEXT_PUBLIC_APP_URL: publicUrl,
      STRIPE_SECRET_KEY: {
        description: "Server-side Stripe API key used to create Checkout Sessions",
        isOptional: true,
      },
      STRIPE_WEBHOOK_SECRET: {
        description: "Signing secret for the Stripe CLI/dashboard webhook endpoint",
        isOptional: true,
      },
      STRIPE_PRICE_ID_MONTHLY: {
        description: "Stripe Price ID shown on the pricing page's monthly plan",
        isOptional: true,
      },
      STRIPE_PRICE_ID_ANNUAL: {
        description: "Stripe Price ID shown on the pricing page's annual plan",
        isOptional: true,
      },
    },
  });

  const worker = service("worker", {
    source: github("Alphine/Railhead", { branch: "main" }),
    build: "npm run build --workspaces --if-present",
    start: "npm run start --workspace=apps/worker",
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      REDIS_URL: cache.env.REDIS_URL,
      NEXT_PUBLIC_APP_URL: "https://${{web.RAILWAY_PUBLIC_DOMAIN}}",
      RESEND_API_KEY: {
        description: "Resend API key used by the worker to send magic-link and receipt email",
        isOptional: true,
      },
      RESEND_FROM_EMAIL: {
        description: "Verified sender address for outgoing mail",
        isOptional: true,
      },
    },
  });

  return {
    name: "Railhead",
    resources: [db, cache, web, worker],
  };
});
