import { describe, expect, it } from "vitest";

import { getNavItems } from "./navigation";

describe("app navigation", () => {
  it("surfaces every dashboard module for super admin navigation", () => {
    const labels = getNavItems(true, ["super_admin"]).map((item) => item.label);

    expect(labels).toEqual(
      expect.arrayContaining([
        "Dashboard",
        "Task Board",
        "Notifications",
        "Circulars",
        "Volunteers",
        "Media Library",
        "Conferences",
        "Surveys",
        "Aalekh",
        "Prachar",
        "Calendar",
        "System Access",
        "Users",
        "Overview",
      ]),
    );
  });
});
