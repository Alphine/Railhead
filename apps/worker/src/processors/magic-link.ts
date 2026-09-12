import type { Job } from "bullmq";
import type { MagicLinkPayload } from "@railhead/queue";
import { sendMagicLinkEmail } from "@railhead/email";
import { logJob, updateJobStatus } from "../log-job.js";

/**
 * BullMQ processor for the "magic-link" queue. Sends a magic-link sign-in
 * email and records the outcome in jobs_log.
 */
export async function processMagicLink(job: Job<MagicLinkPayload>): Promise<void> {
  const payload = job.data;

  const logId = await logJob({
    type: "magic-link",
    payload,
    status: "pending",
    attempts: job.attemptsMade + 1,
  });

  try {
    await sendMagicLinkEmail({ to: payload.email, url: payload.url });
    await updateJobStatus(logId, "success");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateJobStatus(logId, "failed", message);
    throw err;
  }
}
