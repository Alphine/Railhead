# Deploy and Host Railhead on Railway

Railhead is a batteries-included SaaS starter: Next.js, Postgres, Better
Auth, Stripe billing, Resend email, and a Redis-backed worker, wired
together and ready to deploy. Most "SaaS starter" templates stop at auth
and a database — Railhead goes the rest of the way, because Stripe
Checkout and webhooks, transactional email, and a real background worker
are the parts everyone rebuilds from scratch and nobody wants to.

## About Hosting Railhead

This template deploys two Railway services (a Next.js app and a BullMQ
worker) plus a Postgres and a Redis plugin, wired together with
reference variables. The `web` service handles the UI, Better Auth
sign-up/sign-in, and Stripe Checkout; the `worker` service is a
dedicated, no-public-port BullMQ consumer that sends transactional email
and processes Stripe webhook events asynchronously, so a webhook is
always acknowledged inside Stripe's 5-second window regardless of
downstream load.

## Why Deploy Railhead on Railway?

Railway is a singular platform to deploy your infrastructure stack.
Railway will host your infrastructure so you don't have to deal with
configuration, while allowing you to vertically and horizontally scale
it. Deploying Railhead on Railway means every piece — the app, the
worker, Postgres, and Redis — lives on one dashboard with private
networking between them already wired in, and the worker service runs
as a genuine long-lived process, which is the one thing a
serverless/Vercel-style starter can't one-click.

## Common Use Cases

- Launching a subscription SaaS product without rebuilding auth and
  billing from scratch.
- A starting point for an indie developer or small team who wants
  Stripe Checkout and a background worker wired in from day one.
- A reference implementation of "ack fast, process async" for Stripe
  webhooks, worth reading even if you don't deploy it.

## Dependencies for Railhead Hosting

- A [Stripe](https://stripe.com) account (test or live) for
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the two price IDs.
- A [Resend](https://resend.com) account for `RESEND_API_KEY` and a
  verified `RESEND_FROM_EMAIL`.

Both are optional at deploy time — the template boots without them —
but sign-up and checkout need them filled in to actually work.

### Deployment Dependencies

- [Next.js](https://nextjs.org) 15 (App Router)
- [Drizzle ORM](https://orm.drizzle.team) on Postgres
- [Better Auth](https://www.better-auth.com)
- [Stripe](https://stripe.com) Checkout + webhooks
- [Resend](https://resend.com) + React Email
- [BullMQ](https://docs.bullmq.io) on Redis

Full architecture, data model, and the system design document behind
these decisions live in the [GitHub repo](https://github.com/Alphine/Railhead).
Railhead is free and open source under
[LGPL-3.0](https://github.com/Alphine/Railhead/blob/main/LICENSE) — fork
it and build a proprietary product on top; only changes to Railhead
itself need to stay open.
