import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Organisation-aligned icon tones. Each maps to an `--icon-*` CSS variable
 * (defined in globals.css) with calm, rooted light/dark values. Use these
 * instead of raw Tailwind palette classes (text-blue-500 etc.) so icons stay
 * on-brand and theme-aware.
 */
export type IconTone =
  | "primary"
  | "muted"
  | "success"
  | "warning"
  | "info"
  | "research"
  | "vimarsh"
  | "sanskriti"
  | "yuva"
  | "mahila"
  | "prachar"
  | "admin";

export type IconSize = "sm" | "md" | "lg";

const TONE_TEXT: Record<IconTone, string> = {
  primary: "text-icon-primary",
  muted: "text-icon-muted",
  success: "text-icon-success",
  warning: "text-icon-warning",
  info: "text-icon-info",
  research: "text-icon-research",
  vimarsh: "text-icon-vimarsh",
  sanskriti: "text-icon-sanskriti",
  yuva: "text-icon-yuva",
  mahila: "text-icon-mahila",
  prachar: "text-icon-prachar",
  admin: "text-icon-admin",
};

const SIZE_CLASS: Record<IconSize, string> = {
  sm: "h-4 w-4", // 16px
  md: "h-5 w-5", // 20px
  lg: "h-6 w-6", // 24px
};

export type AppIconProps = {
  /** Lucide icon component, e.g. `BookOpen`. */
  icon: LucideIcon;
  /** Organisation tone token. Defaults to `muted`. */
  tone?: IconTone;
  /** 16 / 20 / 24px. Defaults to `md` (20px). */
  size?: IconSize;
  /**
   * Accessible label. When provided the icon is exposed to assistive tech as
   * an image; when omitted the icon is treated as decorative (aria-hidden).
   */
  label?: string;
  className?: string;
};

export function AppIcon({ icon: Icon, tone = "muted", size = "md", label, className }: AppIconProps) {
  return (
    <Icon
      className={cn(SIZE_CLASS[size], TONE_TEXT[tone], "shrink-0", className)}
      strokeWidth={1.75}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    />
  );
}
