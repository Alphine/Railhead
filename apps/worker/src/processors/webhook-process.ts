import type { Job } from "bullmq";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, users, subscriptions } from "@railhead/db";
import { enqueueSendReceipt, type WebhookProcessPayload } from "@railhead/queue";
import { logJob, updateJobStatus } from "../log-job.js";

const HANDLED_EVENT_TYPES = new Set([
  "checkout.session.completed",
  "customer.subscription.updated",
]);

/**
 * Narrow shape we actually read off a Stripe checkout.session.completed
 * event's `data.object`. We don't import Stripe.Checkout.Session directly
 * because `rawEvent` arrives from the queue as `unknown` (it was
 * JSON-serialized when the job was enqueued, so it is a plain object, not a
 * real Stripe.Event instance) — we defensively read only the fields we need.
 */
interface CheckoutSessionLike {
  id: string;
  customer: string | { id: string } | null;
  subscription: string | { id: string } | null;
  customer_email?: string | null;
  customer_details?: { email?: string | null } | null;
  metadata?: Record<string, string> | null;
  amount_total?: number | null;
  currency?: string | null;
}

/**
 * Narrow shape we read off a customer.subscription.updated event's
 * `data.object`.
 */
interface SubscriptionLike {
  id: string;
  customer: string | { id: string } | null;
  status: string;
  current_period_end?: number | null;
  metadata?: Record<string, string> | null;
}

function isCheckoutSessionCompleted(
  event: Stripe.Event
): event is Stripe.Event & { data: { object: CheckoutSessionLike } } {
  return event.type === "checkout.session.completed";
}

function isSubscriptionUpdated(
  event: Stripe.Event
): event is Stripe.Event & { data: { object: SubscriptionLike } } {
  return event.type === "customer.subscription.updated";
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

/**
 * BullMQ processor for the "webhook-process" queue. Handles the two Stripe
 * event types the app cares about, upserts the local `subscriptions` row,
 * and (for a completed checkout) enqueues the receipt email.
 *
 * User resolution strategy for "which user does this stripe_customer_id
 * belong to":
 *   1. checkout.session.completed carries `metadata.userId` — this is set
 *      by the app when it creates the Checkout Session (Stripe echoes
 *      session-creation metadata back on the completed event), so this is
 *      the primary, most reliable lookup: it directly names the user id
 *      that initiated the checkout.
 *   2. If metadata.userId is absent (e.g. an older session, or metadata was
 *      stripped), fall back to matching on the account email via
 *      `customer_details.email` / `customer_email` against `users.email`.
 *   3. customer.subscription.updated events only carry the Stripe customer
 *      id (no app metadata), so those are resolved by looking up the
 *      *existing* subscriptions row by `stripe_customer_id` — that row was
 *      created during step 1/2's checkout.session.completed handling, so a
 *      subscription.updated event for a customer we've never seen a
 *      completed checkout for is logged as failed rather than guessed at.
 */
export async function processWebhookProcess(
  job: Job<WebhookProcessPayload>
): Promise<void> {
  const payload = job.data;
  const event = payload.rawEvent as Stripe.Event;

  const logId = await logJob({
    type: "webhook-process",
    payload: { stripeEventId: payload.stripeEventId, type: payload.type },
    status: "pending",
    attempts: job.attemptsMade + 1,
  });

  try {
    if (!HANDLED_EVENT_TYPES.has(payload.type)) {
      // Nothing to do for event types we don't act on, but the job still
      // counts as a success — there's no error condition here.
      await updateJobStatus(logId, "success");
      return;
    }

    if (isCheckoutSessionCompleted(event)) {
      await handleCheckoutSessionCompleted(event.data.object);
    } else if (isSubscriptionUpdated(event)) {
      await handleSubscriptionUpdated(event.data.object);
    }

    await updateJobStatus(logId, "success");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateJobStatus(logId, "failed", message);
    throw err;
  }
}

async function handleCheckoutSessionCompleted(
  session: CheckoutSessionLike
): Promise<void> {
  const customerId = idOf(session.customer);
  const subscriptionId = idOf(session.subscription);

  if (!customerId || !subscriptionId) {
    throw new Error(
      `checkout.session.completed ${session.id} is missing a customer or subscription id`
    );
  }

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const metadataUserId = session.metadata?.userId ?? null;

  let userId: string | null = metadataUserId;

  if (!userId && email) {
    const [matchedUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    userId = matchedUser?.id ?? null;
  }

  if (!userId) {
    throw new Error(
      `checkout.session.completed ${session.id}: could not resolve a user id (no metadata.userId and no matching email "${email ?? "unknown"}")`
    );
  }

  await db
    .insert(subscriptions)
    .values({
      id: crypto.randomUUID(),
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: "active",
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: subscriptions.stripeCustomerId,
      set: {
        stripeSubscriptionId: subscriptionId,
        status: "active",
        updatedAt: new Date(),
      },
    });

  const amount = session.amount_total ?? 0;
  const currency = session.currency ?? "usd";
  const receiptEmail = email;

  if (receiptEmail) {
    await enqueueSendReceipt({
      email: receiptEmail,
      subscriptionId,
      amount,
      currency,
    });
  }
}

async function handleSubscriptionUpdated(
  subscription: SubscriptionLike
): Promise<void> {
  const customerId = idOf(subscription.customer);

  if (!customerId) {
    throw new Error(
      `customer.subscription.updated ${subscription.id} is missing a customer id`
    );
  }

  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  const result = await db
    .update(subscriptions)
    .set({
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeCustomerId, customerId))
    .returning({ id: subscriptions.id });

  if (result.length === 0) {
    throw new Error(
      `customer.subscription.updated ${subscription.id}: no existing subscriptions row for stripe_customer_id "${customerId}" (expected checkout.session.completed to have created it first)`
    );
  }
}
