"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  PenLine, CalendarDays, Megaphone, BookMarked, FlaskConical, ClipboardCheck,
  RotateCcw, Send, ArrowUpRight, type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useAppContext } from "@/context/AppContext";
import { useArticles } from "@/hooks/api/use-aalekh";
import { useDashboardEvents } from "@/hooks/api/use-dashboard";
import { useOutreachAnalytics } from "@/hooks/api/use-outreach";
import { usePublicationArticles } from "@/hooks/api/use-publications";
import { useResearchProjects } from "@/hooks/api/use-research";

interface KpiCard {
  icon: LucideIcon;
  tone: string;
  value: number;
  labelEn: string;
  labelHi: string;
  subEn: string;
  subHi: string;
  href: string;
}

const IN_REVIEW_PUB = ["submitted", "under_review", "revision_requested"];

/**
 * Role-specific KPI cards for the dashboard "Today" tab — each designation sees
 * the queue/metrics relevant to its place in the review chain, distinct from the
 * shared cross-module strip.
 */
export function RoleKpiCards() {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { viewer, role } = useAppContext();
  const primaryRole = viewer?.primaryRoleCode ?? role;

  const { data: articles = [] } = useArticles();
  const { data: events = [] } = useDashboardEvents();
  const { data: outreach } = useOutreachAnalytics();
  const { data: pubArticles = [] } = usePublicationArticles();
  const { data: myPubArticles = [] } = usePublicationArticles({ mine: true });
  const { data: projects = [] } = useResearchProjects();

  const art = (status: string) => articles.filter((a) => a.status === status).length;
  const evt = (status: string) => events.filter((e) => e.status === status).length;
  const allPending =
    articles.filter((a) => a.status.startsWith("Pending")).length +
    events.filter((e) => e.status.startsWith("Pending") || e.status === "Submitted by Unit").length;
  const pubInReview = pubArticles.filter((a) => IN_REVIEW_PUB.includes(a.status)).length;
  const myInReview = myPubArticles.filter((a) => IN_REVIEW_PUB.includes(a.status)).length;
  const activeResearch = projects.filter((p) => p.status === "active").length;
  const outreachPending = outreach?.pending ?? 0;

  const outreachCard: KpiCard = {
    icon: Megaphone, tone: "text-amber-600", value: outreachPending,
    labelEn: "Outreach pending", labelHi: "प्रसार लंबित",
    subEn: `${outreach?.completionRate ?? 0}% complete`, subHi: `${outreach?.completionRate ?? 0}% पूर्ण`, href: "/prachar",
  };
  const researchCard: KpiCard = {
    icon: FlaskConical, tone: "text-blue-600", value: activeResearch,
    labelEn: "Active research", labelHi: "सक्रिय शोध",
    subEn: `${projects.length} total`, subHi: `${projects.length} कुल`, href: "/shodh",
  };
  const pubReviewCard: KpiCard = {
    icon: BookMarked, tone: "text-violet-600", value: pubInReview,
    labelEn: "Publications in review", labelHi: "समीक्षाधीन प्रकाशन",
    subEn: "Editorial queue", subHi: "संपादकीय कतार", href: "/prakashan",
  };

  let cards: KpiCard[] = [];

  switch (primaryRole) {
    case "karyakarta":
      cards = [
        { icon: BookMarked, tone: "text-violet-600", value: myInReview, labelEn: "My submissions in review", labelHi: "मेरी समीक्षाधीन प्रस्तुतियाँ", subEn: `${myPubArticles.length} total`, subHi: `${myPubArticles.length} कुल`, href: "/prakashan" },
        { icon: RotateCcw, tone: "text-rose-600", value: art("Returned for Revision"), labelEn: "Returned for revision", labelHi: "संशोधन हेतु लौटाए", subEn: "Needs your action", subHi: "आपकी कार्रवाई चाहिए", href: "/aalekh" },
        outreachCard,
      ];
      break;
    case "unit_head":
      cards = [
        { icon: PenLine, tone: "text-amber-600", value: art("Pending Unit Head Review"), labelEn: "Articles awaiting your review", labelHi: "आपकी समीक्षा हेतु लेख", subEn: "Unit Head queue", subHi: "इकाई प्रमुख कतार", href: "/aalekh" },
        outreachCard,
        researchCard,
      ];
      break;
    case "aayam_pramukh":
    case "prant_aayam_pramukh":
      cards = [
        { icon: PenLine, tone: "text-amber-600", value: art("Pending Aayam Review"), labelEn: "Articles awaiting Aayam review", labelHi: "आयाम समीक्षा हेतु लेख", subEn: "Your review queue", subHi: "आपकी समीक्षा कतार", href: "/aalekh" },
        { icon: CalendarDays, tone: "text-blue-600", value: evt("Pending Aayam Review"), labelEn: "Events awaiting Aayam review", labelHi: "आयाम समीक्षा हेतु कार्यक्रम", subEn: "Calendar queue", subHi: "कैलेंडर कतार", href: "/calendar" },
        outreachCard,
      ];
      break;
    case "vibhag_pramukh":
      cards = [
        { icon: PenLine, tone: "text-amber-600", value: art("Pending Vibhag Review"), labelEn: "Articles awaiting Vibhag review", labelHi: "विभाग समीक्षा हेतु लेख", subEn: "Your review queue", subHi: "आपकी समीक्षा कतार", href: "/aalekh" },
        { icon: CalendarDays, tone: "text-blue-600", value: evt("Pending Vibhag Review"), labelEn: "Events awaiting Vibhag review", labelHi: "विभाग समीक्षा हेतु कार्यक्रम", subEn: "Calendar queue", subHi: "कैलेंडर कतार", href: "/calendar" },
        pubReviewCard,
        outreachCard,
      ];
      break;
    default:
      // super_admin / org_admin / prant_sanyojak / kshetra_reviewer — oversight
      cards = [
        { icon: ClipboardCheck, tone: "text-primary", value: allPending, labelEn: "Pending approvals", labelHi: "लंबित अनुमोदन", subEn: "Across the review chain", subHi: "समीक्षा श्रृंखला भर में", href: "/overview" },
        pubReviewCard,
        researchCard,
        { icon: Send, tone: "text-amber-600", value: outreachPending, labelEn: "Outreach pending", labelHi: "प्रसार लंबित", subEn: `${outreach?.completionRate ?? 0}% complete`, subHi: `${outreach?.completionRate ?? 0}% पूर्ण`, href: "/prachar" },
      ];
  }

  return (
    <section className="space-y-3">
      <p className="section-seal">{t("Your Desk", "आपका कक्ष")}</p>
      <div className={cn("grid grid-cols-2 gap-3", cards.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {cards.map((c, i) => (
          <motion.div key={c.labelEn} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link href={c.href}>
              <Card className="institution-panel group h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted/30">
                    <c.icon className={cn("h-5 w-5", c.tone)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xl font-bold leading-none text-foreground">{c.value}</p>
                    <p className="mt-1 text-xs font-semibold leading-tight text-foreground/90">{isHi ? c.labelHi : c.labelEn}</p>
                    <p className="text-[10px] text-muted-foreground">{isHi ? c.subHi : c.subEn}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
