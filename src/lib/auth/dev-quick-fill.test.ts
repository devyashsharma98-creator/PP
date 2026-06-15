import { describe, expect, it } from "vitest";
import { LOCAL_ADMIN_QUICK_FILL } from "./dev-quick-fill";

describe("LOCAL_ADMIN_QUICK_FILL", () => {
  it("defines the single local admin credential used by the login quick-fill", () => {
    expect(LOCAL_ADMIN_QUICK_FILL).toEqual({
      email: "admin@pragyapravah.local",
      password: "Pragya@12345",
    });
  });
});
