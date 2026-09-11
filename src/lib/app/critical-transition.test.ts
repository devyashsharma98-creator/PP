import { describe, expect, it, vi } from "vitest";

import { commitCriticalTransition } from "./critical-transition";

/**
 * Stand-in for the single CTE statement the real callers run: an UPDATE guarded
 * by the expected prior status, with the history row inserted from that UPDATE's
 * output. Modelled as one indivisible step, because that is what Postgres gives
 * us — either both writes land or neither does.
 */
function makeRecord(initialStatus: string) {
  const store = { status: initialStatus };
  const history: Array<{ from: string; to: string }> = [];
  const notifications: string[] = [];

  return {
    store,
    history,
    notifications,
    /** The whole statement. `failAt` simulates the statement aborting. */
    statement(expected: string, next: string, opts: { recipient?: string | null; failAt?: "history" } = {}) {
      if (store.status !== expected) return null; // compare-and-swap matched nothing
      if (opts.failAt === "history") {
        // Postgres aborts the statement: the UPDATE never becomes visible.
        throw new Error("history write failed");
      }
      store.status = next;
      history.push({ from: expected, to: next });
      const notificationRows = opts.recipient ? 1 : 0;
      if (opts.recipient) notifications.push(opts.recipient);
      return { id: "r1", status: next, notification_rows: notificationRows };
    },
  };
}

describe("commitCriticalTransition", () => {
  it("commits when the record is still in the expected state", async () => {
    const rec = makeRecord("submitted");

    const outcome = await commitCriticalTransition({
      expectedFrom: "submitted",
      run: async () => rec.statement("submitted", "approved"),
    });

    expect(outcome.status).toBe("committed");
    expect(rec.store.status).toBe("approved");
    expect(rec.history).toHaveLength(1);
  });

  it("reports a stale transition instead of overwriting a newer state", async () => {
    const rec = makeRecord("approved"); // somebody already moved it on

    const outcome = await commitCriticalTransition({
      expectedFrom: "submitted",
      run: async () => rec.statement("submitted", "rejected"),
    });

    expect(outcome).toEqual({ status: "stale", expectedFrom: "submitted" });
    expect(rec.store.status).toBe("approved");
    expect(rec.history).toHaveLength(0);
  });

  it("lets exactly one of two conflicting transitions from the same state win", async () => {
    const rec = makeRecord("submitted");

    const attempt = (next: string) =>
      commitCriticalTransition({
        expectedFrom: "submitted",
        run: async () => rec.statement("submitted", next),
      });

    const [a, b] = await Promise.all([attempt("approved"), attempt("rejected")]);

    expect([a.status, b.status].sort()).toEqual(["committed", "stale"]);
    expect(rec.history).toHaveLength(1);
  });

  it("leaves no status change behind when the history write fails", async () => {
    const rec = makeRecord("submitted");

    const outcome = await commitCriticalTransition({
      expectedFrom: "submitted",
      run: async () => rec.statement("submitted", "approved", { failAt: "history" }),
    });

    expect(outcome.status).toBe("failed");
    // The status change and the history row are one statement, so a failure in
    // either leaves the record exactly as it was. No compensation, and so no
    // possibility of a compensation that silently does nothing.
    expect(rec.store.status).toBe("submitted");
    expect(rec.history).toHaveLength(0);
  });

  it("reports a failed transition without claiming anything was saved", async () => {
    const outcome = await commitCriticalTransition({
      expectedFrom: "submitted",
      run: async () => { throw new Error("connection reset"); },
    });

    expect(outcome.status).toBe("failed");
    if (outcome.status === "failed") expect(outcome.error).toBeInstanceOf(Error);
    // The outcome carries no "compensated" claim, because there is nothing to
    // compensate — the old helper's false "compensated: true" is unreachable.
    expect(Object.keys(outcome).sort()).toEqual(["error", "status"]);
  });

  it("reports the notification as written only when the statement wrote one", async () => {
    const rec = makeRecord("submitted");

    const withRecipient = await commitCriticalTransition({
      expectedFrom: "submitted",
      run: async () => rec.statement("submitted", "approved", { recipient: "author-1" }),
      wroteNotification: (row) => Number(row.notification_rows) > 0,
    });

    expect(withRecipient.status).toBe("committed");
    if (withRecipient.status === "committed") expect(withRecipient.notificationWritten).toBe(true);
    expect(rec.notifications).toEqual(["author-1"]);
  });

  it("reports no notification when the actor is the only interested party", async () => {
    const rec = makeRecord("submitted");

    const outcome = await commitCriticalTransition({
      expectedFrom: "submitted",
      run: async () => rec.statement("submitted", "approved", { recipient: null }),
      wroteNotification: (row) => Number(row.notification_rows) > 0,
    });

    expect(outcome.status).toBe("committed");
    // Reported honestly as not written, rather than assumed queued.
    if (outcome.status === "committed") expect(outcome.notificationWritten).toBe(false);
    expect(rec.notifications).toEqual([]);
  });

  it("never runs anything after a failed statement", async () => {
    const wroteNotification = vi.fn();

    const outcome = await commitCriticalTransition({
      expectedFrom: "submitted",
      run: async () => { throw new Error("boom"); },
      wroteNotification,
    });

    expect(outcome.status).toBe("failed");
    expect(wroteNotification).not.toHaveBeenCalled();
  });
});
