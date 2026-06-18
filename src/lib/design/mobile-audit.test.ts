import { describe, expect, it } from "vitest";

import { classifyTarget, isUnintendedOverflow } from "./mobile-audit";

describe("mobile UI audit thresholds", () => {
  it("rejects visible operational targets smaller than 44px", () => {
    expect(classifyTarget({ width: 36, height: 36, hidden: false })).toBe("too-small");
    expect(classifyTarget({ width: 44, height: 44, hidden: false })).toBe("pass");
  });

  it("ignores hidden targets and decorative overflow", () => {
    expect(classifyTarget({ width: 12, height: 12, hidden: true })).toBe("ignored");
    expect(isUnintendedOverflow({ left: -24, right: 120, viewport: 390, decorative: true })).toBe(false);
    expect(isUnintendedOverflow({ left: 24, right: 460, viewport: 390, decorative: false })).toBe(true);
  });
});
