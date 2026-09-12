# Railhead

A batteries-included SaaS starter for [Railway](https://railway.com): **Next.js
+ Postgres + Better Auth + Stripe billing + Resend email + a Redis-backed
worker**, wired together and ready to deploy.

Most "SaaS starter" templates stop at auth and a database. Railhead goes the
rest of the way — Stripe Checkout and webhooks, transactional email, and a
real background worker — because those are the parts everyone rebuilds from
scratch and nobody wants to. See [`docs/sdd.html`](docs/sdd.html) for the full
system design document (architecture, data model, flows, rollout plan).

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Database | Postgres via [Drizzle ORM](https://orm.drizzle.team) |
| Auth | [Better Auth](https://www.better-auth.com) (email/password + magic link) |
| Billing | Stripe Checkout + webhooks |
| Email | [Resend](https://resend.com) + React Email |
| Queue | [BullMQ](https://docs.bullmq.io) on Redis |

## Project structure

```
apps/
  web/      Next.js app — UI, API routes, auth, Stripe checkout & webhook receipt
  worker/   BullMQ consumer — sends email, processes webhook events, no public port
packages/
  db/       Drizzle schema, client, and migrations, shared by web and worker
  queue/    BullMQ queue definitions and zod-validated job payloads
  email/    React Email templates and the Resend send wrapper
docs/
  sdd.html  System design document
tests/      Vitest unit tests for the pieces above
railway.json  Service + reference-variable definitions for a one-click deploy
```

## Why a worker service

Stripe webhooks have a 5-second timeout. `apps/web`'s webhook route verifies
the signature and immediately returns 200 — it never touches the database.
The actual work (upserting a subscription, sending a receipt) is pushed onto
a Redis queue and handled by `apps/worker`, a separate long-running Railway
service with no public port. This is the one thing a serverless/Vercel-style
starter can't one-click: a process that outlives a single request.

## Local development

Requires Node 20+, a local Postgres, and a local Redis (or point `DATABASE_URL`
/ `REDIS_URL` at hosted ones).

```bash
npm install
cp .env.example .env
cp .env.example apps/web/.env   # Next.js only reads .env from its own directory

npm run db:generate   # generate Drizzle migrations from packages/db/src/schema.ts
npm run db:migrate    # apply them

npm run dev:web        # http://localhost:3000
npm run dev:worker      # in a second terminal
```

## Environment variables

| Variable | Used by | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | web, worker | Postgres connection string |
| `REDIS_URL` | web, worker | Redis connection string (queue + rate limiting) |
| `BETTER_AUTH_SECRET` | web | Signs session cookies |
| `BETTER_AUTH_URL` | web | Public app origin, for auth callbacks |
| `NEXT_PUBLIC_APP_URL` | web, worker | Public origin used in emails and Stripe redirects |
| `STRIPE_SECRET_KEY` | web | Creates Checkout Sessions |
| `STRIPE_WEBHOOK_SECRET` | web | Verifies incoming Stripe webhook signatures |
| `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_ANNUAL` | web | Price IDs shown on the pricing page |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | worker | Sends magic-link and receipt email |

On Railway, `DATABASE_URL` and `REDIS_URL` are injected automatically as
[reference variables](https://docs.railway.com/guides/variables#reference-variables)
from the Postgres and Redis plugins — see `railway.json`.

## Testing

```bash
npm test
```

19 unit tests cover job-payload validation, Stripe webhook signature
verification, and the subscription-upsert mapping — all without touching a
real database, Redis, or Stripe account.

## Deploying

Deploy Postgres and Redis as Railway plugins, then deploy `apps/web` and
`apps/worker` as separate services from this repo (`railway.json` sets each
service's root directory and wires the reference variables). Fill in the
Stripe and Resend variables from the table above and you have a working
sign-up → subscribe → receive-email loop.

## License

See [`LICENSE`](LICENSE).
