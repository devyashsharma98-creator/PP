import { describe, expect, it } from "vitest";
import { ERP_FLOW_STEPS, STORY_STAGES } from "./story-content";

describe("Parichay story content", () => {
  it("defines a five-stage organization story from roots to ERP", () => {
    expect(STORY_STAGES.map((stage) => stage.id)).toEqual([
      "genesis",
      "manthan",
      "narrative",
      "action",
      "future",
    ]);
    expect(STORY_STAGES.every((stage) => !("image" in stage))).toBe(true);
    expect(STORY_STAGES[0].visual.glyphEn).toBe("ROOTS");
    expect(STORY_STAGES[0].visual.glyphHi).toBe("मूल");
    expect(STORY_STAGES[4].titleEn).toContain("ERP");
  });

  it("defines the public-to-operational ERP flow in order", () => {
    expect(ERP_FLOW_STEPS.map((step) => step.id)).toEqual([
      "idea",
      "publication",
      "dissemination",
      "discourse",
      "reporting",
    ]);
    expect(ERP_FLOW_STEPS.at(-1)?.moduleEn).toBe("Vritt");
  });

  it("keeps English and Hindi copy available together for bilingual visuals", () => {
    for (const stage of STORY_STAGES) {
      expect(stage.titleEn.length).toBeGreaterThan(4);
      expect(stage.titleHi.length).toBeGreaterThan(4);
      expect(stage.summaryEn.length).toBeGreaterThan(20);
      expect(stage.summaryHi.length).toBeGreaterThan(20);
    }
  });
});
