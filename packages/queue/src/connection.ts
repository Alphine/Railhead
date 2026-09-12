import IORedis, { type Redis } from "ioredis";

let connection: Redis | undefined;

/**
 * Lazily creates (and caches) the shared ioredis connection used by BullMQ.
 *
 * Important: this must NOT run at module import time. It only reads
 * process.env.REDIS_URL and constructs the client the first time it is
 * actually called, so importing this module (or any module that imports it)
 * never throws or attempts a connection when REDIS_URL is unset.
 */
export function getConnection(): Redis {
  if (connection) {
    return connection;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error(
      "REDIS_URL environment variable is not set. Set REDIS_URL before using the queue package."
    );
  }

  connection = new IORedis(redisUrl, {
    // BullMQ requires this to be null so it can manage its own retry/backoff logic.
    maxRetriesPerRequest: null,
    lazyConnect: true,
  });

  return connection;
}
