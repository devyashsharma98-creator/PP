export type TargetBox = {
  width: number;
  height: number;
  hidden: boolean;
};

export type OverflowBox = {
  left: number;
  right: number;
  viewport: number;
  decorative: boolean;
};

export function classifyTarget(box: TargetBox) {
  if (box.hidden) {
    return "ignored" as const;
  }

  return box.width >= 44 && box.height >= 44 ? "pass" as const : "too-small" as const;
}

export function isUnintendedOverflow(box: OverflowBox) {
  if (box.decorative) {
    return false;
  }

  return box.left < 0 || box.right > box.viewport;
}
