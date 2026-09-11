import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * The legacy /api/app/actions router shared a session cookie with /api/v1 but
 * not its rules: `updateVritt` allowed any event editor to set `reviewed` with
 * no reviewer check and no content lock, and the two status actions updated a
 * row then wrote history separately. Every protection added to the v1 routes was
 * reachable around them.
 *
 * Those three actions are now retired. These tests hold that line: if one is
 * ever quietly reinstated, they fail.
 */

const { LegacyActionRetiredError } = await import("./repository");

describe("retired legacy actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("names its replacement rather than failing blankly", () => {
    const error = new LegacyActionRetiredError("updateVritt", "POST /api/v1/events/{eventId}/vritt");
    expect(error.message).toContain("updateVritt");
    expect(error.message).toContain("/api/v1/events/{eventId}/vritt");
    expect(error.replacement).toBe("POST /api/v1/events/{eventId}/vritt");
  });

  it("is an Error, so the route's instanceof check holds", () => {
    const error = new LegacyActionRetiredError("updateEventStatus", "x");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("LegacyActionRetiredError");
  });
});

describe("the repository source", () => {
  it("no longer writes a vritt, an event status or an article status", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/lib/neon/repository.ts", "utf8");

    for (const action of ["updateVritt", "updateEventStatus", "updateArticleStatus"]) {
      const start = source.indexOf(`case "${action}": {`);
      expect(start, `${action} case should still exist so callers get a clear 410`).toBeGreaterThan(-1);
      const body = source.slice(start, source.indexOf("\n    }", start));
      expect(body).toContain("LegacyActionRetiredError");
      // The decisive check: no write statements survive in these branches.
      expect(body).not.toMatch(/insert\s+into/i);
      expect(body).not.toMatch(/update\s+public\./i);
      expect(body).not.toContain("writeEventStatusHistory");
    }
  });

  it("still supports the legacy actions that have no v1 replacement", async () => {
    const { readFileSync } = await import("node:fs");
    const source = readFileSync("src/lib/neon/repository.ts", "utf8");
    // Retiring the three above must not have taken working actions with it.
    for (const action of ["createEvent", "castVote", "markAttendance", "updatePracharPlatform"]) {
      expect(source).toContain(`case "${action}": {`);
    }
  });
});
