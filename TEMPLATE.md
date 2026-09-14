# Railhead

A batteries-included SaaS starter: **Next.js + Postgres + Better Auth +
Stripe billing + Resend email + a Redis-backed worker**, wired together
and ready to deploy.

Most "SaaS starter" templates stop at auth and a database. Railhead goes
the rest of the way — Stripe Checkout and webhooks, transactional email,
and a real background worker — because those are the parts everyone
rebuilds from scratch and nobody wants to.

## What you get

- **Auth that's yours.** Better Auth, self-hosted on your own Postgres —
  email/password and magic links, no per-user fee to a third party.
- **Billing that's already wired.** Stripe Checkout for monthly/annual
  plans, and a webhook route that verifies, acks in under 5 seconds, and
  hands off the real work — never blocking on Stripe's timeout.
- **A worker that outlives a request.** A dedicated BullMQ service on
  Redis processes webhooks and sends email — the one thing a
  serverless/Vercel-style starter can't one-click.
- **Fail-fast config.** Missing an env var? The app tells you exactly
  which one, instead of a blank 500 page.

## Services this deploys

| Service | What it is |
| --- | --- |
| `web` | Next.js 15 app — UI, auth, Stripe checkout, webhook receipt |
| `worker` | BullMQ consumer — sends email, processes webhook events |
| Postgres | Users, sessions, subscriptions |
| Redis | Job queue + auth rate limiting |

## After deploying

1. Add your Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_ANNUAL`) and Resend keys
   (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) — both are optional at
   deploy time so the template boots without them, but sign-up and
   checkout need them to actually work.
2. Run the database migration once (see the repo README for the exact
   command) — Postgres starts empty.
3. You're live: sign up, subscribe, and the receipt email goes out
   through the worker.

Full architecture, data model, and the system design document behind
these decisions live in the [GitHub repo](https://github.com/Alphine/Railhead).

## License

Free and open source, [LGPL-3.0](https://github.com/Alphine/Railhead/blob/main/LICENSE).
Fork it and build a proprietary product on top — only changes to
Railhead itself need to stay open.
