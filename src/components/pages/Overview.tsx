"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Megaphone, BookMarked, FlaskConical, Tags, TrendingUp, ArrowUpRight } from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useOutreachAnalytics } from "@/hooks/api/use-outreach";
import { usePublications, usePublicationArticles } from "@/hooks/api/use-publications";
import { useResearchProjects } from "@/hooks/api/use-research";
import { useVishayas } from "@/hooks/api/use-vishayas";
import { OutreachAnalytics } from "@/components/pages/prachar/OutreachAnalytics";
import { ARTICLE_STATUS_STYLE } from "@/lib/app/publication-style";
import { PROJECT_STATUS_STYLE } from "@/lib/app/research-style";
import { vishayaColor } from "@/lib/app/vishaya-style";
import type { ArticleStatus } from "@/hooks/api/use-publications";
import type { ProjectStatus } from "@/hooks/api/use-research";

export default function Overview() {
  const t = useT();
  const isHi = t("en", "hi") === "hi";

  const { data: outreach } = useOutreachAnalytics();
  const { data: issues = [] } = usePublications();
  const { data: articles = [] } = usePublicationArticles();
  const { data: projects = [] } = useResearchProjects();
  const { data: vishayas = [] } = useVishayas();

  const pub = useMemo(() => {
    const by: Record<string, number> = {};
    for (const a of articles) by[a.status] = (by[a.status] ?? 0) + 1;
    const inReview = (by.submitted ?? 0) + (by.under_review ?? 0) + (by.revision_requested ?? 0);
    const published = (by.published ?? 0) + (by.accepted ?? 0);
    return { by, inReview, published, total: articles.length, issues: issues.length };
  }, [articles, issues]);

  const research = useMemo(() => {
    const by: Record<string, number> = {};
    for (const p of projects) by[p.status] = (by[p.status] ?? 0) + 1;
    const active = projects.filter((p) => p.status === "active");
    const avgProgress = active.length ? Math.round(active.reduce((s, p) => s + p.progress, 0) / active.length) : 0;
    return { by, active: active.length, avgProgress, total: projects.length };
  }, [projects]);

  const topVishayas = useMemo(
    () => [...vishayas].sort((a, b) => b.contentCount - a.contentCount).slice(0, 8),
    [vishayas],
  );
  const taggedTotal = useMemo(() => vishayas.reduce((s, v) => s + v.contentCount, 0), [vishayas]);

  const kpis = [
    { icon: Megaphone, tone: "text-amber-600", label: t("Outreach completion", "प्रसार पूर्णता"), value: outreach ? `${outreach.completionRate}%` : "—", sub: t(`${outreach?.total ?? 0} items`, `${outreach?.total ?? 0} कार्य`), href: "/prachar" },
    { icon: BookMarked, tone: "text-violet-600", label: t("Publication pipeline", "प्रकाशन प्रवाह"), value: pub.inReview, sub: t(`${pub.issues} issues · ${pub.published} published`, `${pub.issues} अंक · ${pub.published} प्रकाशित`), href: "/prakashan" },
    { icon: FlaskConical, tone: "text-blue-600", label: t("Active research", "सक्रिय शोध"), value: research.active, sub: t(`${research.avgProgress}% avg progress`, `${research.avgProgress}% औसत प्रगति`), href: "/shodh" },
    { icon: Tags, tone: "text-primary", label: t("Tagged content", "टैग सामग्री"), value: taggedTotal, sub: t(`${vishayas.length} vishayas`, `${vishayas.length} विषय`), href: "/vishay" },
  ];

  const contexts = [
    { labelEn: "Scope", labelHi: "क्षेत्र", valueEn: "Institution-wide", valueHi: "संस्थान-व्यापी", detailEn: "Cross-module signals from across the ERP.", detailHi: "ERP के सभी मॉड्यूल से संकेत।" },
    { labelEn: "Outreach", labelHi: "प्रसार", valueEn: `${outreach?.completionRate ?? 0}% complete`, valueHi: `${outreach?.completionRate ?? 0}% पूर्ण`, detailEn: "Academic outreach carried through.", detailHi: "शैक्षिक प्रसार की पूर्णता।" },
    { labelEn: "Knowledge output", labelHi: "ज्ञान उत्पादन", valueEn: `${pub.published + research.total} works`, valueHi: `${pub.published + research.total} कार्य`, detailEn: "Published articles and research projects.", detailHi: "प्रकाशित लेख एवं शोध परियोजनाएँ।" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <Masthead
        compact
        seal="Institutional Overview"
        sealHi="संस्थागत अवलोकन"
        title="The Whole Institution at a Glance"
        titleHi="समग्र संस्थान एक दृष्टि में"
        contexts={contexts}
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link href={k.href}>
              <Card className="institution-panel group h-full transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <CardContent className="space-y-1.5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                    <k.icon className={cn("h-4 w-4", k.tone)} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{k.value}</p>
                  <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    {k.sub}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Outreach analytics (reused) */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="section-seal">{t("Prachar", "प्रचार")}</p>
          <h2 className="dashboard-section-heading"><Megaphone className="h-5 w-5 text-primary" />{t("Outreach Analytics", "प्रसार विश्लेषण")}</h2>
        </div>
        <OutreachAnalytics />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Publications pipeline */}
        <section className="space-y-3">
          <div className="space-y-1">
            <p className="section-seal">{t("Prakashan", "प्रकाशन")}</p>
            <h2 className="dashboard-section-heading"><BookMarked className="h-5 w-5 text-primary" />{t("Publication Pipeline", "प्रकाशन प्रवाह")}</h2>
          </div>
          <Card className="institution-panel">
            <CardContent className="space-y-3 p-5">
              {articles.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("No submissions yet.", "अभी कोई प्रस्तुति नहीं।")}</p>
              ) : (
                (["submitted", "under_review", "revision_requested", "accepted", "published", "rejected"] as ArticleStatus[])
                  .filter((s) => (pub.by[s] ?? 0) > 0)
                  .map((s) => {
                    const style = ARTICLE_STATUS_STYLE[s];
                    const count = pub.by[s] ?? 0;
                    const pct = Math.round((count / pub.total) * 100);
                    return (
                      <div key={s} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant="outline" className={cn("text-[10px]", style.className)}>{isHi ? style.labelHi : style.labelEn}</Badge>
                          <span className="text-muted-foreground">{count} · {pct}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })
              )}
            </CardContent>
          </Card>
        </section>

        {/* Research progress */}
        <section className="space-y-3">
          <div className="space-y-1">
            <p className="section-seal">{t("Shodh", "शोध")}</p>
            <h2 className="dashboard-section-heading"><FlaskConical className="h-5 w-5 text-primary" />{t("Research Status", "शोध स्थिति")}</h2>
          </div>
          <Card className="institution-panel">
            <CardContent className="space-y-3 p-5">
              {projects.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t("No research projects yet.", "अभी कोई शोध परियोजना नहीं।")}</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {(["proposed", "active", "under_review", "completed", "published"] as ProjectStatus[])
                      .filter((s) => (research.by[s] ?? 0) > 0)
                      .map((s) => {
                        const style = PROJECT_STATUS_STYLE[s];
                        return (
                          <Badge key={s} variant="outline" className={cn("gap-1 text-[10px]", style.className)}>
                            {isHi ? style.labelHi : style.labelEn} · {research.by[s]}
                          </Badge>
                        );
                      })}
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="h-3.5 w-3.5" />{t("Avg progress (active)", "औसत प्रगति (सक्रिय)")}</span>
                      <span className="font-semibold text-foreground">{research.avgProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${research.avgProgress}%` }} /></div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Vishay distribution */}
      <section className="space-y-3">
        <div className="space-y-1">
          <p className="section-seal">{t("Vishay", "विषय")}</p>
          <h2 className="dashboard-section-heading"><Tags className="h-5 w-5 text-primary" />{t("Most-Tagged Subjects", "सर्वाधिक टैग विषय")}</h2>
        </div>
        <Card className="institution-panel">
          <CardContent className="p-5">
            {taggedTotal === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t("No content tagged with vishayas yet.", "अभी किसी सामग्री पर विषय टैग नहीं।")}</p>
            ) : (
              <div className="space-y-2.5">
                {topVishayas.filter((v) => v.contentCount > 0).map((v) => {
                  const c = vishayaColor(v.color);
                  const max = topVishayas[0]?.contentCount || 1;
                  const pct = Math.round((v.contentCount / max) * 100);
                  return (
                    <div key={v.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground">{isHi ? v.nameHi : v.nameEn}</span>
                        <span className="text-muted-foreground">{v.contentCount}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", c.dot)} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-muted-foreground">
        <Activity className="h-3.5 w-3.5" />
        {t("Live institutional analytics across all modules.", "सभी मॉड्यूल में सजीव संस्थागत विश्लेषण।")}
      </div>
    </motion.div>
  );
}
