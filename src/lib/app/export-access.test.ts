import { describe, expect, it } from "vitest";

import type { ScopedAccess } from "./scope";
import {
  buildExportAuditPayload,
  canExportEntity,
  canExportMembers,
  normaliseExportEntity,
} from "./export-access";

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

describe("export entity parsing", () => {
  it("maps the legacy 'users' entity onto members", () => {
    expect(normaliseExportEntity("users")).toBe("members");
  });

  it("rejects an unknown entity", () => {
    expect(normaliseExportEntity("payroll")).toBeNull();
    expect(normaliseExportEntity(null)).toBeNull();
  });
});

describe("member export authority", () => {
  it("refuses an ordinary karyakarta", () => {
    const decision = canExportMembers({ roleCodes: ["karyakarta"], scope: scope() });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/vibhag_pramukh/);
  });

  it("refuses a unit head, who can see people but may not export them", () => {
    const decision = canExportMembers({
      roleCodes: ["unit_head"],
      scope: scope({ departmentIds: new Set(["d1"]) }),
    });
    expect(decision.allowed).toBe(false);
  });

  it("refuses an aayam_pramukh", () => {
    expect(
      canExportMembers({
        roleCodes: ["aayam_pramukh"],
        scope: scope({ departmentIds: new Set(["d1"]) }),
      }).allowed,
    ).toBe(false);
  });

  it("allows a vibhag_pramukh with a record scope", () => {
    expect(
      canExportMembers({
        roleCodes: ["vibhag_pramukh"],
        scope: scope({ departmentIds: new Set(["d1"]) }),
      }).allowed,
    ).toBe(true);
  });

  it("allows an org_admin", () => {
    expect(
      canExportMembers({ roleCodes: ["org_admin"], scope: scope({ orgWide: true }) }).allowed,
    ).toBe(true);
  });

  it("refuses an authorised role that has no record scope at all", () => {
    const decision = canExportMembers({ roleCodes: ["vibhag_pramukh"], scope: scope() });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toMatch(/scope/i);
  });
});

describe("content exports", () => {
  it("stay open to any member, because rows are scope-filtered individually", () => {
    expect(canExportEntity("events", { roleCodes: ["karyakarta"], scope: scope() }).allowed).toBe(true);
    expect(canExportEntity("articles", { roleCodes: ["karyakarta"], scope: scope() }).allowed).toBe(true);
  });

  it("routes members through the member rule", () => {
    expect(canExportEntity("members", { roleCodes: ["karyakarta"], scope: scope() }).allowed).toBe(false);
  });
});

describe("export audit payload", () => {
  it("records shape and size but no exported rows", () => {
    const payload = buildExportAuditPayload({
      entity: "members",
      rowCount: 812,
      filters: { status: "active", search: "", from: undefined },
      orgWide: false,
      truncated: false,
    });

    expect(payload).toEqual({
      entity: "members",
      rowCount: 812,
      filters: { status: "active" },
      scope: "scoped",
      truncated: false,
    });

    // Nothing resembling a person may appear in the audit payload.
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toMatch(/@/);
    expect(Object.keys(payload)).not.toContain("rows");
    expect(Object.keys(payload)).not.toContain("email");
  });

  it("flags a truncated export rather than hiding it", () => {
    const payload = buildExportAuditPayload({
      entity: "events",
      rowCount: 50000,
      filters: {},
      orgWide: true,
      truncated: true,
    });
    expect(payload.truncated).toBe(true);
    expect(payload.scope).toBe("org_wide");
  });
});
