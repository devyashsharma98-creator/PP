/**
 * Style + icon resolution for Prachar outreach types and statuses.
 * Colour tokens reuse the vishaya palette so the institutional system stays
 * consistent across modules.
 */
import {
  BookOpen,
  Presentation,
  GraduationCap,
  Newspaper,
  FlaskConical,
  Megaphone,
  type LucideIcon,
} from "lucide-react";
import { vishayaColor, type VishayaColorClasses } from "./vishaya-style";
import type { OutreachStatus } from "./outreach-types";

const OUTREACH_ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Presentation,
  GraduationCap,
  Newspaper,
  FlaskConical,
  Megaphone,
};

export function outreachIcon(icon: string | null | undefined): LucideIcon {
  return OUTREACH_ICONS[icon ?? "Megaphone"] ?? Megaphone;
}

export function outreachColor(color: string | null | undefined): VishayaColorClasses {
  return vishayaColor(color);
}

export const OUTREACH_STATUS_STYLE: Record<OutreachStatus, { labelEn: string; labelHi: string; className: string }> = {
  pending: { labelEn: "Pending", labelHi: "लंबित", className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  in_progress: { labelEn: "In Progress", labelHi: "प्रगति में", className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400" },
  completed: { labelEn: "Completed", labelHi: "पूर्ण", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  skipped: { labelEn: "Skipped", labelHi: "छोड़ा गया", className: "bg-muted text-muted-foreground border-border" },
};
