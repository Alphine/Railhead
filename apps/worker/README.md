# worker

Long-running Node.js background worker for Railhead. No HTTP server, no
public port — it just connects to Redis (via `@railhead/queue`) and Postgres
(via `@railhead/db`) and processes BullMQ jobs.

## Job types

### `magic-link` (`src/processors/magic-link.ts`)
Payload: `MagicLinkPayload` (`{ email, url }`).
Sends the passwordless sign-in email via `sendMagicLinkEmail` from
`@railhead/email`. Success/failure is recorded in the `jobs_log` table.

### `send-receipt` (`src/processors/send-receipt.ts`)
Payload: `SendReceiptPayload` (`{ email, subscriptionId, amount, currency }`).
Sends the payment receipt email via `sendReceiptEmail` from
`@railhead/email`. Success/failure is recorded in `jobs_log`.

### `webhook-process` (`src/processors/webhook-process.ts`)
Payload: `WebhookProcessPayload` (`{ stripeEventId, type, rawEvent }`).
Handles two Stripe event types:

- **`checkout.session.completed`** — resolves the local user (see below),
  upserts a row in `subscriptions` keyed by `stripe_customer_id`, and
  enqueues a `send-receipt` job for the checkout email/amount/currency.
- **`customer.subscription.updated`** — updates the existing `subscriptions`
  row (matched by `stripe_customer_id`) with the new status and
  `current_period_end`.

Any other event type is logged as a no-op success (nothing to do, not an
error).

**User resolution strategy** (how a `stripe_customer_id` maps to a local
user id): a `checkout.session.completed` event first tries
`session.metadata.userId`, which the app is expected to set when it creates
the Checkout Session (Stripe echoes session metadata back on the completed
event) — this is the authoritative path. If that's absent, it falls back to
matching `session.customer_details.email` / `customer_email` against
`users.email`. `customer.subscription.updated` events carry no app
metadata, so they are resolved purely by looking up the *existing*
`subscriptions` row by `stripe_customer_id` (created by the
`checkout.session.completed` handler above); an update for an unknown
customer is logged as a failed job rather than guessed at.

Every outcome (success or failure) for all three job types is recorded via
`logJob` / `updateJobStatus` in `src/log-job.ts`, which writes to the
`jobs_log` table.

## Graceful shutdown

`src/index.ts` starts one BullMQ `Worker` per queue (`magic-link`,
`send-receipt`, `webhook-process`), each with concurrency 5, sharing the
Redis connection from `getConnection()`. On `SIGTERM` (sent by Railway on
redeploy/stop) or `SIGINT`, the process calls `worker.close()` on all three
workers — this waits for in-flight jobs to finish before letting BullMQ
disconnect — and then exits.

## Scripts

- `npm run dev` — `tsx watch src/index.ts`
- `npm run build` — compiles to `dist/`
- `npm start` — runs the compiled `dist/index.js`
- `npm run typecheck` — `tsc --noEmit`

## Environment variables

- `REDIS_URL` — required by `@railhead/queue`
- `DATABASE_URL` — required by `@railhead/db`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` — required by `@railhead/email`

