import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { getEnv } from "../../../src/lib/env";

const checkoutRequestSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: `Invalid request body: ${parsed.error.message}` },
      { status: 400 }
    );
  }

  const env = getEnv();

  // Constructed inside the handler, never at module scope, so a missing
  // STRIPE_SECRET_KEY surfaces as a clear getEnv() error rather than a
  // top-level crash at import time.
  const stripe = new Stripe(env.STRIPE_SECRET_KEY);

  const priceId =
    parsed.data.plan === "monthly"
      ? env.STRIPE_PRICE_ID_MONTHLY
      : env.STRIPE_PRICE_ID_ANNUAL;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/?checkout=cancelled`,
  });

  return NextResponse.json({ url: session.url });
}
