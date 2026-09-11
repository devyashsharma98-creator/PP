import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ScopedAccess } from "@/lib/app/scope";

vi.mock("server-only", () => ({}));

/**
 * Service-level regression for the scoped assignee search.
 *
 * The pure rule was already covered and passing while the service returned an
 * empty list for every non-org-wide caller: the SQL found the right people, but
 * the shared rule was then re-applied without their membership, so nobody
 * survived it. These tests exercise searchAssignees() itself, with
 * findMembersInScope() mocked at the module boundary, so that mistake cannot
 * pass again.
 */

const findMembersInScope = vi.fn();
vi.mock("./membership-service", () => ({ findMembersInScope }));

const { searchAssignees } = await import("./assignee-service");

const ORG = "00000000-0000-0000-0000-0000000000aa";
const UNIT_A = "00000000-0000-0000-0000-0000000000u1".replace(/u/g, "1");
const DEPT_A = "00000000-0000-0000-0000-0000000000d1";
const HEAD = "00000000-0000-0000-0000-000000000003";
const WORKER = "00000000-0000-0000-0000-000000000001";

function scope(overrides: Partial<ScopedAccess> = {}): ScopedAccess {
  return {
    orgWide: false,
    unitIds: new Set(),
    departmentIds: new Set(),
    eventIds: new Set(),
    articleIds: new Set(),
    ...overrides,
  };
}

function member(id: string, extra: Partial<{ departmentIds: string[]; unitIds: string[]; isActive: boolean }> = {}) {
  return {
    id,
    orgId: ORG,
    isActive: extra.isActive ?? true,
    displayName: `Member ${id.slice(-1)}`,
    displayNameHi: null,
    responsibility: null,
    departmentIds: extra.departmentIds ?? [],
    unitIds: extra.unitIds ?? [],
  };
}

beforeEach(() => vi.clearAllMocks());

describe("a unit head searching their own unit", () => {
  it("finds a colleague who currently sits in that unit", async () => {
    findMembersInScope.mockResolvedValue([member(WORKER, { unitIds: [UNIT_A] })]);

    const result = await searchAssignees({
      orgId: ORG,
      userId: HEAD,
      roleCodes: ["unit_head"],
      scope: scope({ unitIds: new Set([UNIT_A]) }),
      limit: 50,
    });

    // The regression: this used to come back empty.
    expect(result.options).toHaveLength(1);
    expect(result.options[0]).toMatchObject({ id: WORKER });
    expect(result.scopeEmpty).toBe(false);
  });

  it("finds a colleague reached through a shared department", async () => {
    findMembersInScope.mockResolvedValue([member(WORKER, { departmentIds: [DEPT_A] })]);

    const result = await searchAssignees({
      orgId: ORG,
      userId: HEAD,
      roleCodes: ["unit_head"],
      scope: scope({ departmentIds: new Set([DEPT_A]) }),
      limit: 50,
    });

    expect(result.options.map((o) => o.id)).toEqual([WORKER]);
  });

  it("passes the search term down to the query", async () => {
    findMembersInScope.mockResolvedValue([]);

    await searchAssignees({
      orgId: ORG,
      userId: HEAD,
      roleCodes: ["unit_head"],
      scope: scope({ unitIds: new Set([UNIT_A]) }),
      search: "ram",
      limit: 25,
    });

    const args = findMembersInScope.mock.calls[0][0];
    expect(args.extraConditions).toHaveLength(1);
    expect(args.limit).toBe(25);
  });

  it("still excludes somebody the query returned who is out of reach", async () => {
    // Defence in depth: a widened or buggy query must not widen the result.
    findMembersInScope.mockResolvedValue([
      member(WORKER, { unitIds: ["some-other-unit"] }),
    ]);

    const result = await searchAssignees({
      orgId: ORG,
      userId: HEAD,
      roleCodes: ["unit_head"],
      scope: scope({ unitIds: new Set([UNIT_A]) }),
      limit: 50,
    });

    expect(result.options).toEqual([]);
  });

  it("always includes the caller themselves", async () => {
    findMembersInScope.mockResolvedValue([member(HEAD)]);

    const result = await searchAssignees({
      orgId: ORG,
      userId: HEAD,
      roleCodes: ["unit_head"],
      scope: scope({ unitIds: new Set([UNIT_A]) }),
      limit: 50,
    });

    expect(result.options.map((o) => o.id)).toEqual([HEAD]);
  });

  it("returns only name fields, never contact details", async () => {
    findMembersInScope.mockResolvedValue([member(WORKER, { unitIds: [UNIT_A] })]);

    const result = await searchAssignees({
      orgId: ORG,
      userId: HEAD,
      roleCodes: ["unit_head"],
      scope: scope({ unitIds: new Set([UNIT_A]) }),
      limit: 50,
    });

    expect(Object.keys(result.options[0]).sort()).toEqual([
      "displayName",
      "displayNameHi",
      "id",
      "responsibility",
    ]);
  });
});

describe("an org-wide caller", () => {
  it("sees every active member the query returns", async () => {
    findMembersInScope.mockResolvedValue([member(WORKER), member(HEAD)]);

    const result = await searchAssignees({
      orgId: ORG,
      userId: "00000000-0000-0000-0000-00000000000f",
      roleCodes: ["org_admin"],
      scope: scope({ orgWide: true }),
      limit: 50,
    });

    expect(result.options).toHaveLength(2);
  });
});
