/**
 * Status + recommendation styling for Prakashan (publications).
 */
import type { IssueStatus, ArticleStatus, Recommendation } from "@/hooks/api/use-publications";

type StatusStyle = { labelEn: string; labelHi: string; className: string };

export const ISSUE_STATUS_STYLE: Record<IssueStatus, StatusStyle> = {
  draft: { labelEn: "Draft", labelHi: "प्रारूप", className: "bg-muted text-muted-foreground border-border" },
  preparing: { labelEn: "Preparing", labelHi: "तैयारी", className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  reviewing: { labelEn: "In Review", labelHi: "समीक्षाधीन", className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400" },
  published: { labelEn: "Published", labelHi: "प्रकाशित", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
};

export const ARTICLE_STATUS_STYLE: Record<ArticleStatus, StatusStyle> = {
  submitted: { labelEn: "Submitted", labelHi: "प्रस्तुत", className: "bg-slate-500/15 text-slate-700 border-slate-500/30 dark:text-slate-300" },
  under_review: { labelEn: "Under Review", labelHi: "समीक्षाधीन", className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400" },
  revision_requested: { labelEn: "Revision Requested", labelHi: "संशोधन अपेक्षित", className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  accepted: { labelEn: "Accepted", labelHi: "स्वीकृत", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  rejected: { labelEn: "Rejected", labelHi: "अस्वीकृत", className: "bg-destructive/15 text-destructive border-destructive/30" },
  published: { labelEn: "Published", labelHi: "प्रकाशित", className: "bg-emerald-600/15 text-emerald-700 border-emerald-600/30 dark:text-emerald-400" },
  withdrawn: { labelEn: "Withdrawn", labelHi: "वापस लिया", className: "bg-muted text-muted-foreground border-border opacity-70" },
};

export const RECOMMENDATION_STYLE: Record<Recommendation, StatusStyle> = {
  accept: { labelEn: "Accept", labelHi: "स्वीकार", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  minor_revision: { labelEn: "Minor Revision", labelHi: "लघु संशोधन", className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  major_revision: { labelEn: "Major Revision", labelHi: "वृहद संशोधन", className: "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400" },
  reject: { labelEn: "Reject", labelHi: "अस्वीकार", className: "bg-destructive/15 text-destructive border-destructive/30" },
};
