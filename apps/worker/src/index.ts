import { Worker } from "bullmq";
import { QUEUE_NAMES, getConnection } from "@railhead/queue";
import { processMagicLink } from "./processors/magic-link.js";
import { processSendReceipt } from "./processors/send-receipt.js";
import { processWebhookProcess } from "./processors/webhook-process.js";

const CONCURRENCY = 5;

const magicLinkWorker = new Worker(
  QUEUE_NAMES.MAGIC_LINK,
  processMagicLink,
  { connection: getConnection(), concurrency: CONCURRENCY }
);

const sendReceiptWorker = new Worker(
  QUEUE_NAMES.SEND_RECEIPT,
  processSendReceipt,
  { connection: getConnection(), concurrency: CONCURRENCY }
);

const webhookProcessWorker = new Worker(
  QUEUE_NAMES.WEBHOOK_PROCESS,
  processWebhookProcess,
  { connection: getConnection(), concurrency: CONCURRENCY }
);

const workers = [magicLinkWorker, sendReceiptWorker, webhookProcessWorker];

for (const worker of workers) {
  worker.on("completed", (job) => {
    console.log(`[worker:${worker.name}] job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `[worker:${worker.name}] job ${job?.id ?? "unknown"} failed: ${err.message}`
    );
  });

  worker.on("error", (err) => {
    console.error(`[worker:${worker.name}] worker error: ${err.message}`);
  });
}

console.log(
  `Worker started. Listening on queues: ${workers.map((w) => w.name).join(", ")} (concurrency=${CONCURRENCY})`
);

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`Received ${signal}, shutting down workers gracefully...`);

  const results = await Promise.allSettled(workers.map((worker) => worker.close()));

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Error closing a worker:", result.reason);
    }
  }

  console.log("All workers closed. Exiting.");
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
