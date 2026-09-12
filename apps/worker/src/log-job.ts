import { eq } from "drizzle-orm";
// NOTE: @railhead/db's index re-exports the schema tables as flat named
// exports (via `export * from "./schema.js"`), not as a `schema` namespace
// object, so we import the tables we need directly rather than as
// `{ db, schema }` and reference them as `schema.jobsLog` etc.
import { db, jobsLog } from "@railhead/db";

export type JobStatus = "pending" | "success" | "failed";

export interface LogJobParams {
  type: string;
  payload: unknown;
  status: JobStatus;
  attempts: number;
  error?: string;
}

/**
 * Inserts a row into the jobs_log table recording the outcome of a queue
 * job. Returns the id of the newly created row so callers can later update
 * it (e.g. after a retry) via updateJobStatus.
 */
export async function logJob({
  type,
  payload,
  status,
  attempts,
  error,
}: LogJobParams): Promise<number> {
  const [row] = await db
    .insert(jobsLog)
    .values({
      type,
      payload: payload as object | null,
      status,
      attempts,
      error: error ?? null,
      runAt: new Date(),
    })
    .returning({ id: jobsLog.id });

  return row.id;
}

/**
 * Updates the status (and optionally error message) of an existing
 * jobs_log row, identified by its primary key.
 */
export async function updateJobStatus(
  id: number,
  status: JobStatus,
  error?: string
): Promise<void> {
  await db
    .update(jobsLog)
    .set({
      status,
      error: error ?? null,
    })
    .where(eq(jobsLog.id, id));
}
