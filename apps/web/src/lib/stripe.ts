import Stripe from "stripe";

/**
 * Verifies a raw Stripe webhook request body against the given signature
 * header and webhook secret, returning the parsed Stripe.Event on success.
 *
 * Factored out of app/api/webhooks/stripe/route.ts so the signature
 * verification logic can be unit tested (with a fake Stripe instance /
 * secret) without going through a Next.js request object.
 *
 * Throws whatever error `stripe.webhooks.constructEvent` throws (a
 * Stripe.errors.StripeSignatureVerificationError) when the signature is
 * missing, malformed, or does not match the payload.
 */
export function verifyStripeEvent(
  rawBody: string,
  signature: string,
  secret: string
): Stripe.Event {
  // The Stripe client here is only used for its webhook signature
  // verification (a pure, local HMAC check) — no API key/network call is
  // involved, so a placeholder key is fine.
  const stripe = new Stripe("sk_placeholder_not_used_for_webhook_verification");
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
