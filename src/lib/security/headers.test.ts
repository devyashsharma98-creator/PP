import { describe, expect, it } from "vitest";
import { securityHeaders } from "./headers";

describe("securityHeaders", () => {
  it("includes baseline browser hardening headers", () => {
    const byKey = new Map(securityHeaders.map((header) => [header.key, header.value]));

    expect(byKey.get("Content-Security-Policy")).toContain("default-src 'self'");
    expect(byKey.get("X-Frame-Options")).toBe("DENY");
    expect(byKey.get("X-Content-Type-Options")).toBe("nosniff");
    expect(byKey.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });
});
