"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Megaphone, BookMarked, FlaskConical, ArrowUpRight, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useOutreachAnalytics } from "@/hooks/api/use-outreach";
import { usePublicationArticles } from "@/hooks/api/use-publications";
import { useResearchProjects } from "@/hooks/api/use-research";
import { RoleKpiCards } from "@/components/pages/dashboard/RoleKpiCards";

/**
 * Cross-module institutional pulse for the dashboard "Today" tab. Surfaces live
 * signals from the newer modules (Prachar outreach, Prakashan, Shodh) so the
 * dashboard reflects the whole institution, not just the event workflow.
 * Renders only on the overview tab.
 */
export function WorkflowIntelligence({ activeTab }: { activeTab: string }) {
  const t = useT();
  const { data: outreach } = useOutreachAnalytics();
  const { data: articles = [] } = usePublicationArticles();
  const { data: projects = [] } = useResearchProjects();

  if (activeTab !== "today") return null;

  const inReview = articles.filter((a) =>
    ["submitted", "under_review", "revision_requested"].includes(a.status),
  ).length;
  const activeProjects = projects.filter((p) => p.status === "active").length;

  const cards: Array<{
    icon: LucideIcon; color: string; value: number; labelEn: string; labelHi: string;
    subEn: string; subHi: string; href: string;
  }> = [
    {
      icon: Megaphone, color: "text-amber-600",
      value: outreach?.pending ?? 0,
      labelEn: "Outreach pending", labelHi: "प्रसार लंबित",
      subEn: `${outreach?.completionRate ?? 0}% completion`, subHi: `${outreach?.completionRate ?? 0}% पूर्णता`,
      href: "/prachar",
    },
    {
      icon: BookMarked, color: "text-violet-600",
      value: inReview,
      labelEn: "Articles in review", labelHi: "समीक्षाधीन लेख",
      subEn: "Editorial queue", subHi: "संपादकीय कतार",
      href: "/prakashan",
    },
    {
      icon: FlaskConical, color: "text-blue-600",
      value: activeProjects,
      labelEn: "Active research", labelHi: "सक्रिय शोध",
      subEn: `${projects.length} total projects`, subHi: `${projects.length} कुल परियोजनाएँ`,
      href: "/shodh",
    },
  ];

  return (
    <div className="mt-4 space-y-5">
      <RoleKpiCards />

      <section className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="section-seal">{t("Across the Institution", "संस्थान भर में")}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div key={c.labelEn} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={c.href}>
              <Card className="institution-panel group h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-muted/30", "border-border/60")}>
                    <c.icon className={cn("h-5 w-5", c.color)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold leading-none text-foreground">{c.value}</p>
                    <p className="mt-1 text-xs font-semibold text-foreground/90">{t(c.labelEn, c.labelHi)}</p>
                    <p className="text-[10px] text-muted-foreground">{t(c.subEn, c.subHi)}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
      </section>
    </div>
  );
}
