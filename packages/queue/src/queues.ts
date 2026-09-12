import { Queue, type Job, type JobsOptions } from "bullmq";
import { getConnection } from "./connection.js";
import {
  MagicLinkPayloadSchema,
  SendReceiptPayloadSchema,
  WebhookProcessPayloadSchema,
  type MagicLinkPayload,
  type SendReceiptPayload,
  type WebhookProcessPayload,
} from "./schemas.js";

export const QUEUE_NAMES = {
  MAGIC_LINK: "magic-link",
  SEND_RECEIPT: "send-receipt",
  WEBHOOK_PROCESS: "webhook-process",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: 1000,
  removeOnFail: false,
};

const queueInstances = new Map<QueueName, Queue>();

/**
 * Lazily creates (and caches) the BullMQ Queue instance for the given queue
 * name. Queues are never constructed at module load time — only the first
 * time they are actually needed (e.g. via one of the enqueue* helpers below
 * or getDeadLetterJobs).
 */
function getQueue(name: QueueName): Queue {
  let queue = queueInstances.get(name);
  if (!queue) {
    queue = new Queue(name, { connection: getConnection() });
    queueInstances.set(name, queue);
  }
  return queue;
}

export async function enqueueMagicLink(payload: MagicLinkPayload): Promise<Job<MagicLinkPayload>> {
  const result = MagicLinkPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid MagicLinkPayload: ${result.error.message}`);
  }
  const queue = getQueue(QUEUE_NAMES.MAGIC_LINK);
  return queue.add(QUEUE_NAMES.MAGIC_LINK, result.data, DEFAULT_JOB_OPTIONS) as Promise<
    Job<MagicLinkPayload>
  >;
}

export async function enqueueSendReceipt(
  payload: SendReceiptPayload
): Promise<Job<SendReceiptPayload>> {
  const result = SendReceiptPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid SendReceiptPayload: ${result.error.message}`);
  }
  const queue = getQueue(QUEUE_NAMES.SEND_RECEIPT);
  return queue.add(QUEUE_NAMES.SEND_RECEIPT, result.data, DEFAULT_JOB_OPTIONS) as Promise<
    Job<SendReceiptPayload>
  >;
}

export async function enqueueWebhookProcess(
  payload: WebhookProcessPayload
): Promise<Job<WebhookProcessPayload>> {
  const result = WebhookProcessPayloadSchema.safeParse(payload);
  if (!result.success) {
    throw new Error(`Invalid WebhookProcessPayload: ${result.error.message}`);
  }
  const queue = getQueue(QUEUE_NAMES.WEBHOOK_PROCESS);
  return queue.add(QUEUE_NAMES.WEBHOOK_PROCESS, result.data, DEFAULT_JOB_OPTIONS) as Promise<
    Job<WebhookProcessPayload>
  >;
}

/**
 * Returns the failed ("dead letter") jobs for a given queue, for use in a
 * simple admin inspector page.
 */
export async function getDeadLetterJobs(
  queueName: QueueName,
  start = 0,
  end = 100
): Promise<Job[]> {
  const queue = getQueue(queueName);
  return queue.getFailed(start, end);
}
