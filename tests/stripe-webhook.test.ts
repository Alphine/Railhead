import { describe, expect, it } from "vitest";
import Stripe from "stripe";
import { verifyStripeEvent } from "../apps/web/src/lib/stripe";

// A throwaway signing secret used only within this test — never a real
// Stripe secret.
const WEBHOOK_SECRET = "whsec_test_secret_for_unit_tests_only";

function buildSignedPayload(payload: object) {
  const rawBody = JSON.stringify(payload);
  const header = Stripe.webhooks.generateTestHeaderString({
    payload: rawBody,
    secret: WEBHOOK_SECRET,
  });
  return { rawBody, header };
}

describe("verifyStripeEvent", () => {
  it("returns the parsed event when the signature is valid", () => {
    const { rawBody, header } = buildSignedPayload({
      id: "evt_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_123" } },
    });

    const event = verifyStripeEvent(rawBody, header, WEBHOOK_SECRET);

    expect(event.id).toBe("evt_123");
    expect(event.type).toBe("checkout.session.completed");
  });

  it("throws when the signature does not match the payload", () => {
    const { rawBody } = buildSignedPayload({
      id: "evt_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_123" } },
    });

    expect(() =>
      verifyStripeEvent(rawBody, "t=1,v1=deadbeef", WEBHOOK_SECRET)
    ).toThrow();
  });

  it("throws when verified against the wrong secret", () => {
    const { rawBody, header } = buildSignedPayload({
      id: "evt_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_123" } },
    });

    expect(() =>
      verifyStripeEvent(rawBody, header, "whsec_a_completely_different_secret")
    ).toThrow();
  });

  it("throws when the raw body has been tampered with after signing", () => {
    const { rawBody, header } = buildSignedPayload({
      id: "evt_123",
      type: "checkout.session.completed",
      data: { object: { id: "cs_123" } },
    });

    const tampered = rawBody.replace("cs_123", "cs_999");

    expect(() => verifyStripeEvent(tampered, header, WEBHOOK_SECRET)).toThrow();
  });
});
