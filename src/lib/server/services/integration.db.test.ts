/**
 * Integration tests against a real Postgres.
 *
 * These exercise the exact SQL the services emit — time-bounded membership, the
 * single-statement status transition, and the conditional vritt write — which
 * mocked query builders cannot check. They are skipped unless a database is
 * configured, so the ordinary suite still runs without one:
 *
 *   npx dotenv -e .env.local -- npx vitest run --config vitest.integration.config.ts
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";

const HAS_DB = Boolean(process.env.DATABASE_URL);
const suite = HAS_DB ? describe : describe.skip;

let db: typeof import("@/db/client").db;
let sql: typeof import("drizzle-orm").sql;
let membership: typeof import("./membership-service");
let eventService: typeof import("./event-service");

const ORG = randomUUID();
const UNIT = randomUUID();
const DEPT = randomUUID();
const CURRENT_MEMBER = randomUUID();
const EXPIRED_MEMBER = randomUUID();
const FUTURE_MEMBER = randomUUID();
const ACTOR = randomUUID();

beforeAll(async () => {
  if (!HAS_DB) return;
  ({ db } = await import("@/db/client"));
  ({ sql } = await import("drizzle-orm"));
  membership = await import("./membership-service");
  eventService = await import("./event-service");

  await db.execute(sql`
    INSERT INTO org_settings (id, org_code, name)
    VALUES (${ORG}::uuid, ${"IT" + ORG.slice(0, 6)}, 'Integration Org')
  `);
  await db.execute(sql`
    INSERT INTO units (id, org_id, code, name, unit_kind)
    VALUES (${UNIT}::uuid, ${ORG}::uuid, ${"U" + UNIT.slice(0, 8)}, 'Test Unit', 'shakha')
  `);
  await db.execute(sql`
    INSERT INTO departments_or_aayams (id, org_id, code, name, department_kind)
    VALUES (${DEPT}::uuid, ${ORG}::uuid, ${"D" + DEPT.slice(0, 8)}, 'Test Aayam', 'vimarsh')
  `);

  for (const [id, name] of [
    [CURRENT_MEMBER, "Current Member"],
    [EXPIRED_MEMBER, "Expired Member"],
    [FUTURE_MEMBER, "Future Member"],
    [ACTOR, "Actor"],
  ] as const) {
    await db.execute(sql`
      INSERT INTO profiles (id, org_id, email, password_hash, display_name, is_active)
      VALUES (${id}::uuid, ${ORG}::uuid, ${`${id}@integration.test`}, 'x', ${name}, true)
    `);
  }

  const roleRow = await db.execute(sql`SELECT id FROM roles WHERE code = 'karyakarta' LIMIT 1`);
  const rows = (roleRow as unknown as { rows?: Array<{ id: string }> }).rows
    ?? (roleRow as unknown as Array<{ id: string }>);
  const roleId = rows[0]!.id;

  // Live, expired, and not-yet-started placements in the same unit.
  await db.execute(sql`
    INSERT INTO user_role_assignments (user_id, role_id, scope_type, org_id, unit_id, starts_at, ends_at)
    VALUES
      (${CURRENT_MEMBER}::uuid, ${roleId}::uuid, 'unit', ${ORG}::uuid, ${UNIT}::uuid, now() - interval '30 days', NULL),
      (${EXPIRED_MEMBER}::uuid, ${roleId}::uuid, 'unit', ${ORG}::uuid, ${UNIT}::uuid, now() - interval '400 days', now() - interval '30 days'),
      (${FUTURE_MEMBER}::uuid,  ${roleId}::uuid, 'unit', ${ORG}::uuid, ${UNIT}::uuid, now() + interval '30 days', NULL)
  `);
});

afterAll(async () => {
  if (!HAS_DB || !db) return;
  await db.execute(sql`DELETE FROM org_settings WHERE id = ${ORG}::uuid`);
});

function unitScope() {
  return {
    orgWide: false,
    unitIds: new Set([UNIT]),
    departmentIds: new Set<string>(),
    eventIds: new Set<string>(),
    articleIds: new Set<string>(),
  };
}

suite("time-bounded membership", () => {
  it("includes a member whose placement is current", async () => {
    const found = await membership.findMembersInScope({ orgId: ORG, scope: unitScope() });
    expect(found.map((m) => m.id)).toContain(CURRENT_MEMBER);
  });

  it("excludes a member whose placement has ended", async () => {
    const found = await membership.findMembersInScope({ orgId: ORG, scope: unitScope() });
    expect(found.map((m) => m.id)).not.toContain(EXPIRED_MEMBER);
  });

  it("excludes a member whose placement has not started", async () => {
    const found = await membership.findMembersInScope({ orgId: ORG, scope: unitScope() });
    expect(found.map((m) => m.id)).not.toContain(FUTURE_MEMBER);
  });

  it("reports the current placement alongside each member", async () => {
    const found = await membership.findMembersInScope({ orgId: ORG, scope: unitScope() });
    const current = found.find((m) => m.id === CURRENT_MEMBER);
    expect(current?.unitIds).toContain(UNIT);
  });

  it("returns no unit for a member whose only placement expired", async () => {
    const m = await membership.getCurrentMembership(EXPIRED_MEMBER);
    expect(m.unitIds).toEqual([]);
  });

  it("returns no unit for a member whose placement is in the future", async () => {
    const m = await membership.getCurrentMembership(FUTURE_MEMBER);
    expect(m.unitIds).toEqual([]);
  });
});

async function createEvent(status = "draft"): Promise<string> {
  const id = randomUUID();
  await db.execute(sql`
    INSERT INTO events (id, org_id, unit_id, title, status, created_by)
    VALUES (${id}::uuid, ${ORG}::uuid, ${UNIT}::uuid, 'Integration Event', ${status}::event_status, ${CURRENT_MEMBER}::uuid)
  `);
  return id;
}

function actorCtx() {
  return {
    session: {
      userId: ACTOR,
      orgId: ORG,
      email: "actor@integration.test",
      displayName: "Actor",
      effectiveRoleCodes: ["org_admin"],
      assignments: [],
    },
    permissions: {},
  } as never;
}

async function statusOf(eventId: string): Promise<string> {
  const res = await db.execute(sql`SELECT status FROM events WHERE id = ${eventId}::uuid`);
  const rows = (res as unknown as { rows?: Array<{ status: string }> }).rows
    ?? (res as unknown as Array<{ status: string }>);
  return rows[0]!.status;
}

async function historyCount(eventId: string): Promise<number> {
  const res = await db.execute(sql`SELECT count(*)::int AS n FROM event_status_history WHERE event_id = ${eventId}::uuid`);
  const rows = (res as unknown as { rows?: Array<{ n: number }> }).rows
    ?? (res as unknown as Array<{ n: number }>);
  return Number(rows[0]!.n);
}

suite("atomic event status transitions", () => {
  it("writes the status, its history and the author notification together", async () => {
    const eventId = await createEvent("draft");
    const event = {
      id: eventId, title: "Integration Event", status: "draft",
      unitId: UNIT, departmentId: null, createdBy: CURRENT_MEMBER,
    };

    const result = await eventService.transitionEventWorkflow(
      eventId, event, "submitted_by_unit", undefined, actorCtx(), "127.0.0.1",
    );

    expect(result.ok).toBe(true);
    expect(await statusOf(eventId)).toBe("submitted_by_unit");
    expect(await historyCount(eventId)).toBe(1);

    const notif = await db.execute(sql`
      SELECT count(*)::int AS n FROM notifications
       WHERE entity_id = ${eventId}::uuid AND recipient_user_id = ${CURRENT_MEMBER}::uuid
    `);
    const rows = (notif as unknown as { rows?: Array<{ n: number }> }).rows
      ?? (notif as unknown as Array<{ n: number }>);
    expect(Number(rows[0]!.n)).toBe(1);
  });

  it("lets only one of two concurrent transitions from the same state win", async () => {
    const eventId = await createEvent("submitted_by_unit");
    const event = {
      id: eventId, title: "Integration Event", status: "submitted_by_unit",
      unitId: UNIT, departmentId: null, createdBy: CURRENT_MEMBER,
    };

    const [a, b] = await Promise.all([
      eventService.transitionEventWorkflow(eventId, event, "pending_aayam_review", undefined, actorCtx(), "127.0.0.1"),
      eventService.transitionEventWorkflow(eventId, event, "rejected", "no", actorCtx(), "127.0.0.1"),
    ]);

    const outcomes = [a.ok, b.ok].sort();
    expect(outcomes).toEqual([false, true]);
    // Exactly one history row: the loser wrote nothing at all.
    expect(await historyCount(eventId)).toBe(1);
  });

  it("refuses a transition from a status the record has already left", async () => {
    const eventId = await createEvent("submitted_by_unit");
    await db.execute(sql`UPDATE events SET status = 'rejected'::event_status WHERE id = ${eventId}::uuid`);

    const result = await eventService.transitionEventWorkflow(
      eventId,
      { id: eventId, title: "Integration Event", status: "submitted_by_unit", unitId: UNIT, departmentId: null, createdBy: CURRENT_MEMBER },
      "pending_aayam_review", undefined, actorCtx(), "127.0.0.1",
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(409);
    expect(await statusOf(eventId)).toBe("rejected");
    expect(await historyCount(eventId)).toBe(0);
  });

  it("leaves no status change behind when only the history insert fails", async () => {
    const eventId = await createEvent("draft");

    // Fail the history INSERT and nothing else. `actor_name_snapshot` is
    // varchar(256) on event_status_history and is not written by the events
    // UPDATE, so an over-long display name aborts the history insert alone.
    // (An earlier version of this test used a non-existent actor id, which also
    // violates events.updated_by — that could fail the UPDATE first and so did
    // not isolate history-write failure at all.)
    const longNameCtx = {
      session: {
        userId: ACTOR, orgId: ORG, email: "actor@integration.test",
        displayName: "N".repeat(300),
        effectiveRoleCodes: ["org_admin"], assignments: [],
      },
      permissions: {},
    } as never;

    const result = await eventService.transitionEventWorkflow(
      eventId,
      { id: eventId, title: "Integration Event", status: "draft", unitId: UNIT, departmentId: null, createdBy: CURRENT_MEMBER },
      "submitted_by_unit", undefined, longNameCtx, "127.0.0.1",
    );

    expect(result.ok).toBe(false);
    // The decisive assertion: the UPDATE was valid on its own and would have
    // committed, but the statement aborted as a whole.
    expect(await statusOf(eventId)).toBe("draft");
    expect(await historyCount(eventId)).toBe(0);
  });

  it("proves that same actor and transition succeed when history can be written", async () => {
    // Control for the test above: with a name that fits, the identical
    // transition commits. That is what shows the failure was the history insert
    // and not something wrong with the actor or the transition itself.
    const eventId = await createEvent("draft");

    const result = await eventService.transitionEventWorkflow(
      eventId,
      { id: eventId, title: "Integration Event", status: "draft", unitId: UNIT, departmentId: null, createdBy: CURRENT_MEMBER },
      "submitted_by_unit", undefined, actorCtx(), "127.0.0.1",
    );

    expect(result.ok).toBe(true);
    expect(await statusOf(eventId)).toBe("submitted_by_unit");
    expect(await historyCount(eventId)).toBe(1);
  });
});

suite("conditional vritt writes", () => {
  async function vrittStatus(eventId: string): Promise<string> {
    const res = await db.execute(sql`SELECT status FROM event_vritt WHERE event_id = ${eventId}::uuid`);
    const rows = (res as unknown as { rows?: Array<{ status: string }> }).rows
      ?? (res as unknown as Array<{ status: string }>);
    return rows[0]!.status;
  }

  it("creates a draft when none exists", async () => {
    const eventId = await createEvent();
    const result = await eventService.upsertEventVritt(
      eventId, { content: "First draft", status: "draft" }, "Integration Event", actorCtx(), "127.0.0.1", null,
    );
    expect(result.ok).toBe(true);
    expect(await vrittStatus(eventId)).toBe("draft");
  });

  async function vrittRow(eventId: string) {
    const res = await db.execute(sql`
      SELECT content, content_hi, attendance_count, media_urls, status, review_notes,
             submitted_by, reviewed_by
        FROM event_vritt WHERE event_id = ${eventId}::uuid
    `);
    const rows = (res as unknown as { rows?: Array<Record<string, unknown>> }).rows
      ?? (res as unknown as Array<Record<string, unknown>>);
    return rows[0]!;
  }

  it("preserves report data through a status-only submission", async () => {
    const eventId = await createEvent();
    await eventService.upsertEventVritt(
      eventId,
      { content: "Fifty attended.", contentHi: "पचास उपस्थित रहे।", attendanceCount: 50, mediaUrls: ["https://example.org/a.jpg"], status: "draft" },
      "Integration Event", actorCtx(), "127.0.0.1", null,
    );

    // Exactly what the submit action sends: a status and nothing else.
    const submitted = await eventService.upsertEventVritt(
      eventId, { status: "submitted" }, "Integration Event", actorCtx(), "127.0.0.1", "draft",
    );
    expect(submitted.ok).toBe(true);

    const row = await vrittRow(eventId);
    // Previously all four of these were wiped by the submission.
    expect(row.content).toBe("Fifty attended.");
    expect(row.content_hi).toBe("पचास उपस्थित रहे।");
    expect(Number(row.attendance_count)).toBe(50);
    expect(row.media_urls).toEqual(["https://example.org/a.jpg"]);
    expect(row.status).toBe("submitted");
    expect(row.submitted_by).toBe(ACTOR);
  });

  it("preserves report data through review, and records the reviewer", async () => {
    const eventId = await createEvent();
    await eventService.upsertEventVritt(
      eventId, { content: "Fifty attended.", attendanceCount: 50, status: "draft" },
      "Integration Event", actorCtx(), "127.0.0.1", null,
    );
    await eventService.upsertEventVritt(
      eventId, { status: "submitted" }, "Integration Event", actorCtx(), "127.0.0.1", "draft",
    );
    const reviewed = await eventService.upsertEventVritt(
      eventId, { status: "reviewed", reviewNotes: "Accepted." },
      "Integration Event", actorCtx(), "127.0.0.1", "submitted",
    );
    expect(reviewed.ok).toBe(true);

    const row = await vrittRow(eventId);
    expect(row.content).toBe("Fifty attended.");
    expect(Number(row.attendance_count)).toBe(50);
    expect(row.status).toBe("reviewed");
    expect(row.reviewed_by).toBe(ACTOR);
    expect(row.review_notes).toBe("Accepted.");
  });

  it("keeps a partial draft edit from erasing the fields it does not mention", async () => {
    const eventId = await createEvent();
    await eventService.upsertEventVritt(
      eventId, { content: "First pass.", contentHi: "पहला प्रारूप।", attendanceCount: 40, status: "draft" },
      "Integration Event", actorCtx(), "127.0.0.1", null,
    );
    await eventService.upsertEventVritt(
      eventId, { attendanceCount: 62, status: "draft" },
      "Integration Event", actorCtx(), "127.0.0.1", "draft",
    );

    const row = await vrittRow(eventId);
    expect(Number(row.attendance_count)).toBe(62);
    expect(row.content).toBe("First pass.");
    expect(row.content_hi).toBe("पहला प्रारूप।");
  });

  it("ignores content offered alongside a review, keeping what was submitted", async () => {
    const eventId = await createEvent();
    await eventService.upsertEventVritt(
      eventId, { content: "What actually happened.", status: "draft" },
      "Integration Event", actorCtx(), "127.0.0.1", null,
    );
    await eventService.upsertEventVritt(
      eventId, { status: "submitted" }, "Integration Event", actorCtx(), "127.0.0.1", "draft",
    );
    // The route refuses this payload outright; the service is the second line of
    // defence, and must not write the substituted text either.
    await eventService.upsertEventVritt(
      eventId, { content: "Rewritten during sign-off.", status: "reviewed" },
      "Integration Event", actorCtx(), "127.0.0.1", "submitted",
    );

    const row = await vrittRow(eventId);
    expect(row.content).toBe("What actually happened.");
    expect(row.status).toBe("reviewed");
  });

  it("refuses a write authorized against a status the vritt has already left", async () => {
    const eventId = await createEvent();
    await eventService.upsertEventVritt(
      eventId, { content: "Draft", status: "draft" }, "Integration Event", actorCtx(), "127.0.0.1", null,
    );
    // A reviewer submits it while our editor still has the draft open.
    await eventService.upsertEventVritt(
      eventId, { content: "Draft", status: "submitted" }, "Integration Event", actorCtx(), "127.0.0.1", "draft",
    );

    // The stale write still believes the vritt is a draft.
    const stale = await eventService.upsertEventVritt(
      eventId, { content: "Overwritten by stale editor", status: "draft" }, "Integration Event", actorCtx(), "127.0.0.1", "draft",
    );

    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.response.status).toBe(409);
    expect(await vrittStatus(eventId)).toBe("submitted");

    const res = await db.execute(sql`SELECT content FROM event_vritt WHERE event_id = ${eventId}::uuid`);
    const rows = (res as unknown as { rows?: Array<{ content: string }> }).rows
      ?? (res as unknown as Array<{ content: string }>);
    expect(rows[0]!.content).toBe("Draft");
  });
});
