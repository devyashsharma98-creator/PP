import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AuthContext } from "@/lib/middleware/with-auth";
import type { ScopedAccess } from "@/lib/app/scope";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/audit", () => ({ auditAndActivity: vi.fn(), writeAuditLog: vi.fn() }));

/**
 * A small fake of the Drizzle query builder. Each call to db.select() /
 * db.update() / db.delete() pops the next queued result, so a test can script
 * exactly what the service sees without a database. Every builder method
 * returns `this` and the object is awaitable.
 */
const queued: unknown[][] = [];
const writes: Array<{ kind: string }> = [];

function builder(result: unknown[]) {
  const chain: Record<string, unknown> = {};
  const passthrough = [
    "from", "where", "innerJoin", "leftJoin", "orderBy", "limit", "offset",
    "groupBy", "set", "values", "returning", "onConflictDoNothing",
  ];
  for (const method of passthrough) {
    chain[method] = () => chain;
  }
  chain.then = (resolve: (v: unknown[]) => unknown) => Promise.resolve(result).then(resolve);
  return chain;
}

function nextResult(): unknown[] {
  return queued.shift() ?? [];
}

vi.mock("@/db/client", () => ({
  db: {
    select: () => builder(nextResult()),
    selectDistinct: () => builder(nextResult()),
    insert: () => { writes.push({ kind: "insert" }); return builder(nextResult()); },
    update: () => { writes.push({ kind: "update" }); return builder(nextResult()); },
    delete: () => { writes.push({ kind: "delete" }); return builder(nextResult()); },
  },
}));

const taskService = await import("./task-service");

const ORG = "00000000-0000-0000-0000-0000000000aa";
const WORKER = "00000000-0000-0000-0000-000000000001";
const STRANGER = "00000000-0000-0000-0000-000000000002";
const PROJECT = "00000000-0000-0000-0000-0000000000p1".replace(/p/g, "9");
const TASK = "00000000-0000-0000-0000-0000000000b1";

function emptyScope(): ScopedAccess {
  return {
    orgWide: false,
    unitIds: new Set(),
    departmentIds: new Set(),
    eventIds: new Set(),
    articleIds: new Set(),
  };
}

/** A karyakarta with no organisational scope. */
function workerCtx(): AuthContext {
  return {
    session: {
      userId: WORKER,
      orgId: ORG,
      email: "worker@example.org",
      displayName: "Worker",
      effectiveRoleCodes: ["karyakarta"],
      assignments: [],
    },
    permissions: { canUpdateTask: true, canCreateTask: true },
  } as unknown as AuthContext;
}

/** Project and task both belonging to somebody else, in no shared department. */
const foreignProjectRow = {
  id: PROJECT,
  departmentId: "00000000-0000-0000-0000-0000000000d2",
  createdBy: STRANGER,
  ownerUserId: STRANGER,
};

const foreignTaskRow = {
  id: TASK,
  projectId: PROJECT,
  assigneeUserId: STRANGER,
  createdBy: STRANGER,
  status: "todo",
};

async function statusOf(response: { status: number }) {
  return response.status;
}

beforeEach(() => {
  queued.length = 0;
  writes.length = 0;
  vi.clearAllMocks();
});

describe("a worker acting on an out-of-scope task", () => {
  it("is refused a status change", async () => {
    queued.push(
      [],                    // buildTaskAccessSubject: no assigned projects
      [foreignProjectRow],   // loadProject
      [foreignTaskRow],      // loadTask
    );

    const result = await taskService.updateTask(
      PROJECT, TASK, { status: "done" }, workerCtx(), emptyScope(),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(403);
    expect(writes.filter((w) => w.kind === "update")).toHaveLength(0);
  });

  it("is refused a reassignment", async () => {
    queued.push([], [foreignProjectRow], [foreignTaskRow]);

    const result = await taskService.updateTask(
      PROJECT, TASK, { assigneeUserId: WORKER }, workerCtx(), emptyScope(),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(403);
    expect(writes.filter((w) => w.kind === "update")).toHaveLength(0);
  });

  it("is refused a deletion", async () => {
    queued.push([], [foreignProjectRow], [foreignTaskRow]);

    const result = await taskService.deleteTask(PROJECT, TASK, workerCtx(), emptyScope());

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(403);
    expect(writes.filter((w) => w.kind === "delete")).toHaveLength(0);
  });

  it("is refused a read of the owning project", async () => {
    queued.push([], [{ ...foreignProjectRow, name: "Someone else's project", status: "active" }]);

    const result = await taskService.getProject(
      PROJECT, ORG, emptyScope(), WORKER, ["karyakarta"],
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(403);
  });
});

describe("a worker acting on a task assigned to them", () => {
  const assignedTaskRow = { ...foreignTaskRow, assigneeUserId: WORKER };

  it("may report their own progress", async () => {
    queued.push(
      [{ projectId: PROJECT }],  // assigned project discovery
      [foreignProjectRow],
      [assignedTaskRow],
      [{ id: TASK, title: "Prepare agenda", status: "done" }],
    );

    const result = await taskService.updateTask(
      PROJECT, TASK, { status: "done" }, workerCtx(), emptyScope(),
    );

    expect(result.ok).toBe(true);
    expect(writes.filter((w) => w.kind === "update")).toHaveLength(1);
  });

  it("may not hand it on to somebody else", async () => {
    queued.push([{ projectId: PROJECT }], [foreignProjectRow], [assignedTaskRow]);

    const result = await taskService.updateTask(
      PROJECT, TASK, { assigneeUserId: STRANGER }, workerCtx(), emptyScope(),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(403);
    expect(writes.filter((w) => w.kind === "update")).toHaveLength(0);
  });

  it("may not rewrite the task itself", async () => {
    queued.push([{ projectId: PROJECT }], [foreignProjectRow], [assignedTaskRow]);

    const result = await taskService.updateTask(
      PROJECT, TASK, { title: "Rewritten" }, workerCtx(), emptyScope(),
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(403);
  });

  it("finds it through 'my tasks' regardless of project scope", async () => {
    queued.push([
      { id: TASK, projectId: PROJECT, projectName: "Another unit's project", title: "Prepare agenda", status: "todo" },
    ]);

    const result = await taskService.listMyTasks(ORG, WORKER, {});

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.rows).toHaveLength(1);
      expect(result.data.rows[0]).toMatchObject({ projectId: PROJECT });
    }
  });
});

describe("project removal", () => {
  it("archives by default rather than destroying tasks", async () => {
    queued.push(
      [],
      [{ ...foreignProjectRow, createdBy: WORKER, ownerUserId: WORKER }],
      [{ total: 4 }],
    );

    const result = await taskService.removeProject(PROJECT, workerCtx(), emptyScope(), {
      hardDelete: false,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.mode).toBe("archived");
    expect(writes.filter((w) => w.kind === "delete")).toHaveLength(0);
    expect(writes.filter((w) => w.kind === "update")).toHaveLength(1);
  });

  it("refuses an unconfirmed permanent deletion", async () => {
    queued.push(
      [],
      [{ ...foreignProjectRow, createdBy: WORKER, ownerUserId: WORKER }],
      [{ total: 4 }],
    );

    const ctx = workerCtx();
    ctx.session.effectiveRoleCodes = ["aayam_pramukh"];

    const result = await taskService.removeProject(PROJECT, ctx, emptyScope(), {
      hardDelete: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(409);
    expect(writes.filter((w) => w.kind === "delete")).toHaveLength(0);
  });

  it("refuses a permanent deletion whose affected-record count no longer matches", async () => {
    queued.push(
      [],
      [{ ...foreignProjectRow, createdBy: WORKER, ownerUserId: WORKER }],
      [{ total: 7 }],
    );

    const ctx = workerCtx();
    ctx.session.effectiveRoleCodes = ["aayam_pramukh"];

    const result = await taskService.removeProject(PROJECT, ctx, emptyScope(), {
      hardDelete: true,
      expectedTaskCount: 4,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(409);
    expect(writes.filter((w) => w.kind === "delete")).toHaveLength(0);
  });

  it("refuses a permanent deletion from a role below aayam_pramukh", async () => {
    queued.push(
      [],
      [{ ...foreignProjectRow, createdBy: WORKER, ownerUserId: WORKER }],
      [{ total: 0 }],
    );

    const result = await taskService.removeProject(PROJECT, workerCtx(), emptyScope(), {
      hardDelete: true,
      expectedTaskCount: 0,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(await statusOf(result.response)).toBe(403);
    expect(writes.filter((w) => w.kind === "delete")).toHaveLength(0);
  });

  it("permanently deletes when authority and confirmation both hold", async () => {
    queued.push(
      [],
      [{ ...foreignProjectRow, createdBy: WORKER, ownerUserId: WORKER }],
      [{ total: 4 }],
    );

    const ctx = workerCtx();
    ctx.session.effectiveRoleCodes = ["aayam_pramukh"];

    const result = await taskService.removeProject(PROJECT, ctx, emptyScope(), {
      hardDelete: true,
      expectedTaskCount: 4,
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.mode).toBe("deleted");
    expect(writes.filter((w) => w.kind === "delete")).toHaveLength(1);
  });
});
