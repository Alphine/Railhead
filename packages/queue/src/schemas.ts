import { z } from "zod";

export const MagicLinkPayloadSchema = z.object({
  email: z.string().email(),
  url: z.string().url(),
});
export type MagicLinkPayload = z.infer<typeof MagicLinkPayloadSchema>;

export const SendReceiptPayloadSchema = z.object({
  email: z.string().email(),
  subscriptionId: z.string(),
  amount: z.number(),
  currency: z.string(),
});
export type SendReceiptPayload = z.infer<typeof SendReceiptPayloadSchema>;

export const WebhookProcessPayloadSchema = z.object({
  stripeEventId: z.string(),
  type: z.string(),
  rawEvent: z.unknown(),
});
export type WebhookProcessPayload = z.infer<typeof WebhookProcessPayloadSchema>;
