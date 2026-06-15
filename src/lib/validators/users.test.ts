import { describe, expect, it } from "vitest";
import { assignRoleSchema } from "./users";

describe("assignRoleSchema", () => {
  it("rejects event and article scope assignment through the user role API", () => {
    expect(assignRoleSchema.safeParse({ roleCode: "karyakarta", scopeType: "event" }).success).toBe(false);
    expect(assignRoleSchema.safeParse({ roleCode: "karyakarta", scopeType: "article" }).success).toBe(false);
  });

  it("requires the matching entity id for unit and department scopes", () => {
    expect(assignRoleSchema.safeParse({ roleCode: "karyakarta", scopeType: "unit" }).success).toBe(false);
    expect(assignRoleSchema.safeParse({ roleCode: "karyakarta", scopeType: "department" }).success).toBe(false);
  });
});
