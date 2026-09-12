import type { Job } from "bullmq";
import type { SendReceiptPayload } from "@railhead/queue";
import { sendReceiptEmail } from "@railhead/email";
import { logJob, updateJobStatus } from "../log-job.js";

/**
 * BullMQ processor for the "send-receipt" queue. Sends a payment receipt
 * email and records the outcome in jobs_log.
 */
export async function processSendReceipt(job: Job<SendReceiptPayload>): Promise<void> {
  const payload = job.data;

  const logId = await logJob({
    type: "send-receipt",
    payload,
    status: "pending",
    attempts: job.attemptsMade + 1,
  });

  try {
    await sendReceiptEmail({
      to: payload.email,
      amount: payload.amount,
      currency: payload.currency,
      subscriptionId: payload.subscriptionId,
    });
    await updateJobStatus(logId, "success");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateJobStatus(logId, "failed", message);
    throw err;
  }
}
