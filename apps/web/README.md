# web

Next.js 15 App Router front end and API for Railhead.

## Routes

| Route | Method | Description |
| --- | --- | --- |
| `/` | GET | Pricing/landing page. "Subscribe" buttons POST to `/api/checkout` and redirect to the returned Stripe Checkout URL. |
| `/sign-in` | GET | Email + password sign-in / sign-up form (better-auth client). |
| `/dashboard` | GET | Server component; redirects to `/sign-in` if unauthenticated, otherwise shows the signed-in user's subscription status from `@railhead/db`. |
| `/admin/jobs` | GET | Lists dead-letter (failed) jobs for every queue via `getDeadLetterJobs` from `@railhead/queue`, for manual inspection. |
| `/api/auth/[...all]` | GET/POST | Better Auth's catch-all handler (session, email/password, magic-link). |
| `/api/health` | GET | Returns `{ status: "ok" }`. Used as the Railway healthcheck path. Does not touch the database. |
| `/api/checkout` | POST | Body `{ plan: "monthly" \| "annual" }`. Creates a Stripe Checkout Session in subscription mode and returns `{ url }`. |
| `/api/webhooks/stripe` | POST | Verifies the Stripe signature against the raw request body, then immediately enqueues a `webhook-process` job (`enqueueWebhookProcess`) and returns 200. Does no database work itself — the worker processes the event asynchronously. |

## Auth

`src/lib/auth.ts` configures Better Auth with the Drizzle adapter against `@railhead/db`'s `db`/`schema`, `emailAndPassword` enabled, and the `magicLink` plugin. Better Auth never sends email directly from this app — `sendMagicLink` calls `enqueueMagicLink({ email, url })` from `@railhead/queue`, and the worker (via `@railhead/email`) is responsible for actually sending it.

## Environment variables

Validated lazily (inside request handlers, never at module load) by `src/lib/env.ts`'s `getEnv()`:

- `DATABASE_URL`
- `REDIS_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_MONTHLY`
- `STRIPE_PRICE_ID_ANNUAL`

`RESEND_API_KEY` is intentionally not required here — it's only used by the worker.

## Development

```
npm run dev --workspace apps/web
```
