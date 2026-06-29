/**
 * Status + deliverable styling for Shodh (research).
 */
import { FileText, BookOpen, Presentation, Database, type LucideIcon } from "lucide-react";
import type { ProjectStatus, MilestoneStatus, DeliverableType } from "@/hooks/api/use-research";

type StatusStyle = { labelEn: string; labelHi: string; className: string };

export const PROJECT_STATUS_STYLE: Record<ProjectStatus, StatusStyle> = {
  proposed: { labelEn: "Proposed", labelHi: "प्रस्तावित", className: "bg-slate-500/15 text-slate-700 border-slate-500/30 dark:text-slate-300" },
  active: { labelEn: "Active", labelHi: "सक्रिय", className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400" },
  under_review: { labelEn: "Under Review", labelHi: "समीक्षाधीन", className: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  completed: { labelEn: "Completed", labelHi: "पूर्ण", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
  published: { labelEn: "Published", labelHi: "प्रकाशित", className: "bg-emerald-600/15 text-emerald-700 border-emerald-600/30 dark:text-emerald-400" },
};

export const MILESTONE_STATUS_STYLE: Record<MilestoneStatus, StatusStyle> = {
  pending: { labelEn: "Pending", labelHi: "लंबित", className: "bg-muted text-muted-foreground border-border" },
  in_progress: { labelEn: "In Progress", labelHi: "प्रगति में", className: "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400" },
  completed: { labelEn: "Completed", labelHi: "पूर्ण", className: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400" },
};

export const DELIVERABLE_META: Record<DeliverableType, { labelEn: string; labelHi: string; icon: LucideIcon }> = {
  report: { labelEn: "Report", labelHi: "प्रतिवेदन", icon: FileText },
  article: { labelEn: "Article", labelHi: "लेख", icon: BookOpen },
  presentation: { labelEn: "Presentation", labelHi: "प्रस्तुति", icon: Presentation },
  data: { labelEn: "Dataset", labelHi: "आँकड़े", icon: Database },
};
