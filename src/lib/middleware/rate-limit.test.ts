import { describe, expect, it } from "vitest";
import { checkLoginRateLimit } from "./rate-limit";

describe("login rate limiting", () => {
  it("locks an account key after repeated failed logins", () => {
    const key = `test-${crypto.randomUUID()}@example.com`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = checkLoginRateLimit("203.0.113.10", key);
      expect(response).toBeNull();
    }

    const blocked = checkLoginRateLimit("203.0.113.10", key);
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get("Retry-After")).toBeTruthy();
  });

  it("keeps separate counters for different accounts from the same IP", () => {
    const firstAccount = `first-${crypto.randomUUID()}@example.com`;
    const secondAccount = `second-${crypto.randomUUID()}@example.com`;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(checkLoginRateLimit("203.0.113.11", firstAccount)).toBeNull();
    }

    expect(checkLoginRateLimit("203.0.113.11", secondAccount)).toBeNull();
  });
});
