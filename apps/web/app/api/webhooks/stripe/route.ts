import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { enqueueWebhookProcess } from "@railhead/queue";
import { getEnv } from "../../../../src/lib/env";
import { verifyStripeEvent } from "../../../../src/lib/stripe";

export async function POST(request: NextRequest) {
  const env = getEnv();

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  // Read the raw body — never req.json() — so the signature check runs
  // against the exact bytes Stripe signed.
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = verifyStripeEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    );
  }

  // Ack fast, process async: hand off to the worker immediately and do no
  // database work in this route.
  await enqueueWebhookProcess({
    stripeEventId: event.id,
    type: event.type,
    rawEvent: event,
  });

  return NextResponse.json({ received: true }, { status: 200 });
}
