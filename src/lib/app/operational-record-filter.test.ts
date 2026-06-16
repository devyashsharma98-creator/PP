import { describe, expect, it } from "vitest";

import { filterOperationalEventRecords } from "./operational-record-filter";

describe("filterOperationalEventRecords", () => {
  it("removes live verification and smoke records from ERP event lists", () => {
    const records = filterOperationalEventRecords([
      { title: "Live API Test Event 20260416232100", submittedBy: "Demo Vibhag Pramukh" },
      { title: "Local Public Smoke 20260416232204", submittedBy: "Demo Super Admin" },
      { title: "Public Smoke Event 20260416223758", submittedBy: "Demo Vibhag Pramukh" },
      { title: "Vimarsh Satra - Test", description: "Updated description for the test event" },
      { title: "Bharatiya Chintan Baithak", submittedBy: "Dheerendra Chaturvedi" },
    ]);

    expect(records).toEqual([
      { title: "Bharatiya Chintan Baithak", submittedBy: "Dheerendra Chaturvedi" },
    ]);
  });

  it("keeps real institutional records even when the title mentions public work", () => {
    const records = filterOperationalEventRecords([
      { title: "Public Discourse on Family Strengthening", description: "Sahabhagita baithak" },
      { title: "Vimarsh Satra: Panch Parivartan", submittedBy: "Savita Bhadoriya" },
    ]);

    expect(records).toHaveLength(2);
  });
});
