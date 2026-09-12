import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import type { WebhookProcessPayload } from "@railhead/queue";

// -----------------------------------------------------------------------
// Mocks. vi.mock factories are hoisted above imports, so the spies they
// close over must be created via vi.hoisted() to be usable both inside the
// factory and inside the test bodies below.
// -----------------------------------------------------------------------
const mocks = vi.hoisted(() => {
  return {
    insertValuesSpy: vi.fn(),
    onConflictDoUpdateSpy: vi.fn(),
    updateSetSpy: vi.fn(),
    updateWhereSpy: vi.fn(),
    selectResult: [] as { id: string }[],
    enqueueSendReceipt: vi.fn(async () => ({ id: "job_1" })),
  };
});

vi.mock("@railhead/queue", async (importActual) => {
  const actual = await importActual<typeof import("@railhead/queue")>();
  return {
    ...actual,
    enqueueSendReceipt: mocks.enqueueSendReceipt,
  };
});

vi.mock("@railhead/db", async (importActual) => {
  const actual = await importActual<typeof import("@railhead/db")>();

  const db = {
    insert(table: unknown) {
      return {
        values(data: Record<string, unknown>) {
          // jobs_log inserts (from log-job.ts) — just need a fake id back.
          if (table === actual.jobsLog) {
            return { returning: async () => [{ id: 1 }] };
          }
          // subscriptions upsert — the thing this test actually verifies.
          mocks.insertValuesSpy(data);
          return {
            onConflictDoUpdate(args: unknown) {
              mocks.onConflictDoUpdateSpy(args);
              return Promise.resolve();
            },
          };
        },
      };
    },
    update(table: unknown) {
      return {
        set(data: Record<string, unknown>) {
          if (table === actual.jobsLog) {
            return { where: async () => undefined };
          }
          mocks.updateSetSpy(data);
          return {
            where(condition: unknown) {
              mocks.updateWhereSpy(condition);
              return {
                returning: async () => [{ id: "sub_row_1" }],
              };
            },
          };
        },
      };
    },
    select() {
      return {
        from() {
          return {
            where() {
              return { limit: async () => mocks.selectResult };
            },
          };
        },
      };
    },
  };

  return { ...actual, db };
});

const { processWebhookProcess } = await import(
  "../apps/worker/src/processors/webhook-process"
);
const { jobsLog, subscriptions } = await import("@railhead/db");

function makeJob(payload: WebhookProcessPayload) {
  return { data: payload, attemptsMade: 0 } as unknown as import("bullmq").Job<WebhookProcessPayload>;
}

beforeEach(() => {
  mocks.insertValuesSpy.mockClear();
  mocks.onConflictDoUpdateSpy.mockClear();
  mocks.updateSetSpy.mockClear();
  mocks.updateWhereSpy.mockClear();
  mocks.enqueueSendReceipt.mockClear();
  mocks.selectResult = [];
});

describe("processWebhookProcess: checkout.session.completed", () => {
  it("upserts the subscriptions row with the fields from the event", async () => {
    const rawEvent = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_1",
          customer: "cus_123",
          subscription: "sub_456",
          customer_details: { email: "buyer@example.com" },
          metadata: { userId: "user_789" },
          amount_total: 2500,
          currency: "usd",
        },
      },
    } as unknown as Stripe.Event;

    const job = makeJob({
      stripeEventId: "evt_1",
      type: "checkout.session.completed",
      rawEvent,
    });

    await processWebhookProcess(job);

    expect(mocks.insertValuesSpy).toHaveBeenCalledTimes(1);
    const insertedRow = mocks.insertValuesSpy.mock.calls[0][0];
    expect(insertedRow).toMatchObject({
      userId: "user_789",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
      status: "active",
    });
    expect(typeof insertedRow.id).toBe("string");
    expect(insertedRow.updatedAt).toBeInstanceOf(Date);

    expect(mocks.onConflictDoUpdateSpy).toHaveBeenCalledTimes(1);
    const conflictArgs = mocks.onConflictDoUpdateSpy.mock.calls[0][0];
    expect(conflictArgs.target).toBe(subscriptions.stripeCustomerId);
    expect(conflictArgs.set).toMatchObject({
      stripeSubscriptionId: "sub_456",
      status: "active",
    });

    // A receipt email job is enqueued using the checkout session's amount,
    // currency, and email.
    expect(mocks.enqueueSendReceipt).toHaveBeenCalledWith({
      email: "buyer@example.com",
      subscriptionId: "sub_456",
      amount: 2500,
      currency: "usd",
    });
  });

  it("falls back to matching by email when metadata.userId is absent", async () => {
    mocks.selectResult = [{ id: "user_from_email" }];

    const rawEvent = {
      id: "evt_2",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_2",
          customer: "cus_999",
          subscription: "sub_999",
          customer_email: "matched@example.com",
          amount_total: 1000,
          currency: "usd",
        },
      },
    } as unknown as Stripe.Event;

    const job = makeJob({
      stripeEventId: "evt_2",
      type: "checkout.session.completed",
      rawEvent,
    });

    await processWebhookProcess(job);

    const insertedRow = mocks.insertValuesSpy.mock.calls[0][0];
    expect(insertedRow.userId).toBe("user_from_email");
  });

  it("throws (and does not upsert) when no user can be resolved", async () => {
    mocks.selectResult = [];

    const rawEvent = {
      id: "evt_3",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_3",
          customer: "cus_000",
          subscription: "sub_000",
        },
      },
    } as unknown as Stripe.Event;

    const job = makeJob({
      stripeEventId: "evt_3",
      type: "checkout.session.completed",
      rawEvent,
    });

    await expect(processWebhookProcess(job)).rejects.toThrow(/could not resolve a user/);
    expect(mocks.insertValuesSpy).not.toHaveBeenCalled();
  });
});

describe("processWebhookProcess: customer.subscription.updated", () => {
  it("updates status and currentPeriodEnd for the matching stripe_customer_id", async () => {
    const periodEndUnix = 1_800_000_000; // seconds
    const rawEvent = {
      id: "evt_4",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_555",
          customer: "cus_555",
          status: "past_due",
          current_period_end: periodEndUnix,
        },
      },
    } as unknown as Stripe.Event;

    const job = makeJob({
      stripeEventId: "evt_4",
      type: "customer.subscription.updated",
      rawEvent,
    });

    await processWebhookProcess(job);

    expect(mocks.updateSetSpy).toHaveBeenCalledTimes(1);
    const setArgs = mocks.updateSetSpy.mock.calls[0][0];
    expect(setArgs.stripeSubscriptionId).toBe("sub_555");
    expect(setArgs.status).toBe("past_due");
    expect(setArgs.currentPeriodEnd).toEqual(new Date(periodEndUnix * 1000));
  });

  it("throws when no existing subscriptions row matches the customer id", async () => {
    // Simulate "no rows updated" by having update().set().where() resolve to
    // an empty array from .returning().
    const rawEvent = {
      id: "evt_5",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_gone",
          customer: "cus_unknown",
          status: "active",
        },
      },
    } as unknown as Stripe.Event;

    // Temporarily override the mocked db.update chain to return no rows.
    const dbModule = await import("@railhead/db");
    const originalUpdate = dbModule.db.update;
    // @ts-expect-error -- reassigning the mocked db method for this test only
    dbModule.db.update = (table: unknown) => ({
      set: (data: Record<string, unknown>) => {
        if (table === jobsLog) return { where: async () => undefined };
        mocks.updateSetSpy(data);
        return { where: () => ({ returning: async () => [] }) };
      },
    });

    const job = makeJob({
      stripeEventId: "evt_5",
      type: "customer.subscription.updated",
      rawEvent,
    });

    await expect(processWebhookProcess(job)).rejects.toThrow(
      /no existing subscriptions row/
    );

    // @ts-expect-error -- restoring the mocked db method
    dbModule.db.update = originalUpdate;
  });
});
