import { describe, expect, it } from "vitest";

import {
  createPracharCampaignSchema,
  updatePracharCampaignSchema,
} from "./prachar-campaigns";

describe("prachar campaign validators", () => {
  it("requires title when creating a campaign", () => {
    const result = createPracharCampaignSchema.safeParse({
      description: "A short outreach push",
      startsAt: "2026-06-17T09:00:00.000Z",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Campaign title is required.");
    }
  });

  it("rejects invalid campaign datetime values", () => {
    const result = createPracharCampaignSchema.safeParse({
      title: "Campus outreach",
      startsAt: "17 June 2026",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("Invalid campaign date.");
    }
  });

  it("rejects an empty update payload", () => {
    const result = updatePracharCampaignSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toBe("At least one campaign field is required.");
    }
  });
});
