import { describe, expect, it } from "vitest";
import {
  MagicLinkPayloadSchema,
  SendReceiptPayloadSchema,
  WebhookProcessPayloadSchema,
} from "@railhead/queue";

describe("MagicLinkPayloadSchema", () => {
  it("accepts a valid payload", () => {
    const result = MagicLinkPayloadSchema.safeParse({
      email: "user@example.com",
      url: "https://example.com/magic?token=abc",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing field", () => {
    const result = MagicLinkPayloadSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed email", () => {
    const result = MagicLinkPayloadSchema.safeParse({
      email: "not-an-email",
      url: "https://example.com/magic?token=abc",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed url", () => {
    const result = MagicLinkPayloadSchema.safeParse({
      email: "user@example.com",
      url: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("SendReceiptPayloadSchema", () => {
  it("accepts a valid payload", () => {
    const result = SendReceiptPayloadSchema.safeParse({
      email: "user@example.com",
      subscriptionId: "sub_123",
      amount: 1999,
      currency: "usd",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing field", () => {
    const result = SendReceiptPayloadSchema.safeParse({
      email: "user@example.com",
      subscriptionId: "sub_123",
      currency: "usd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects the wrong type for amount", () => {
    const result = SendReceiptPayloadSchema.safeParse({
      email: "user@example.com",
      subscriptionId: "sub_123",
      amount: "1999",
      currency: "usd",
    });
    expect(result.success).toBe(false);
  });
});

describe("WebhookProcessPayloadSchema", () => {
  it("accepts a valid payload with an arbitrary rawEvent", () => {
    const result = WebhookProcessPayloadSchema.safeParse({
      stripeEventId: "evt_123",
      type: "checkout.session.completed",
      rawEvent: { id: "evt_123", anything: "goes" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing stripeEventId", () => {
    const result = WebhookProcessPayloadSchema.safeParse({
      type: "checkout.session.completed",
      rawEvent: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects a non-string type field", () => {
    const result = WebhookProcessPayloadSchema.safeParse({
      stripeEventId: "evt_123",
      type: 42,
      rawEvent: {},
    });
    expect(result.success).toBe(false);
  });
});
