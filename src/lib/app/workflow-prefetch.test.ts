import { describe, expect, it } from "vitest";

import { getWorkflowPrefetchRoutes } from "./workflow-prefetch";

describe("getWorkflowPrefetchRoutes", () => {
  it("returns no routes for unauthenticated users", () => {
    expect(getWorkflowPrefetchRoutes("/dashboard", false)).toEqual([]);
  });

  it("prefetches high-traffic workflow routes after authentication", () => {
    expect(getWorkflowPrefetchRoutes("/dashboard", true)).toEqual([
      "/calendar",
      "/aalekh",
      "/prachar",
      "/task-board",
      "/notifications",
      "/feed",
    ]);
  });

  it("does not prefetch the route the user is already viewing", () => {
    expect(getWorkflowPrefetchRoutes("/calendar", true)).not.toContain("/calendar");
  });

  it("does not duplicate route groups for nested paths", () => {
    expect(getWorkflowPrefetchRoutes("/calendar/month", true)).not.toContain("/calendar");
  });
});
