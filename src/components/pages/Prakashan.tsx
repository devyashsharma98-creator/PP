"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, FileText, Inbox, Star, ChevronRight } from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useAppContext } from "@/context/AppContext";
import { usePublications, usePublicationArticles, type Publication, type PublicationArticle } from "@/hooks/api/use-publications";
import { ISSUE_STATUS_STYLE, ARTICLE_STATUS_STYLE, RECOMMENDATION_STYLE } from "@/lib/app/publication-style";
import { CreateIssueDialog } from "@/components/pages/prakashan/CreateIssueDialog";
import { SubmitArticleDialog } from "@/components/pages/prakashan/SubmitArticleDialog";
import { ArticleReviewPanel } from "@/components/pages/prakashan/ArticleReviewPanel";

type Tab = "overview" | "issues" | "queue" | "mine";

const REVIEW_QUEUE_STATUSES = ["submitted", "under_review", "revision_requested"];

export default function Prakashan() {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { permissions } = useAppContext();
  const canEdit = permissions.canPublishArticle;   // editorial — manage issues, publish
  const canReview = permissions.canReviewArticle;  // reviewer
  const canSubmit = permissions.canCreateArticle;  // author

  const [tab, setTab] = useState<Tab>("overview");
  const [issueDialog, setIssueDialog] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Publication | null>(null);
  const [submitDialog, setSubmitDialog] = useState(false);
  const [reviewArticle, setReviewArticle] = useState<PublicationArticle | null>(null);

  const { data: issues = [], isLoading: issuesLoading } = usePublications();
  const { data: allArticles = [], isLoading: articlesLoading } = usePublicationArticles();
  const { data: myArticles = [] } = usePublicationArticles({ mine: true });

  const queue = useMemo(() => allArticles.filter((a) => REVIEW_QUEUE_STATUSES.includes(a.status)), [allArticles]);
  const stats = useMemo(() => ({
    issuesInProgress: issues.filter((i) => i.status !== "published").length,
    published: issues.filter((i) => i.status === "published").length,
    awaitingReview: queue.length,
    accepted: allArticles.filter((a) => a.status === "accepted" || a.status === "published").length,
  }), [issues, queue, allArticles]);

  const openIssueEdit = (i: Publication) => { setEditingIssue(i); setIssueDialog(true); };
  const openNewIssue = () => { setEditingIssue(null); setIssueDialog(true); };

  const contexts = [
    {
      labelEn: "Editorial pipeline", labelHi: "संपादकीय प्रवाह",
      valueEn: `${stats.issuesInProgress} issues in progress`, valueHi: `${stats.issuesInProgress} अंक प्रगति में`,
      detailEn: "Journal volumes and compendia moving toward publication.",
      detailHi: "प्रकाशन की ओर अग्रसर पत्रिका अंक एवं संग्रह।",
    },
    {
      labelEn: "Review queue", labelHi: "समीक्षा कतार",
      valueEn: `${stats.awaitingReview} awaiting review`, valueHi: `${stats.awaitingReview} समीक्षा प्रतीक्षित`,
      detailEn: "Submitted articles in the peer-review process.",
      detailHi: "सहकर्मी समीक्षा प्रक्रिया में प्रस्तुत लेख।",
    },
    {
      labelEn: "Your role", labelHi: "आपकी भूमिका",
      valueEn: canEdit ? "Editorial board" : canReview ? "Reviewer" : "Contributor",
      valueHi: canEdit ? "संपादक मंडल" : canReview ? "समीक्षक" : "योगदानकर्ता",
      detailEn: canEdit ? "Manage issues, review, and publish." : canReview ? "Review assigned submissions." : "Submit scholarly articles.",
      detailHi: canEdit ? "अंक प्रबंधन, समीक्षा एवं प्रकाशन।" : canReview ? "नियत प्रस्तुतियों की समीक्षा।" : "विद्वत लेख प्रस्तुत करें।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
      <Masthead
        compact
        seal="Prakashan — Editorial & Publishing"
        sealHi="प्रकाशन — संपादकीय एवं प्रकाशन"
        title="From Manuscript to Published Word"
        titleHi="पांडुलिपि से प्रकाशित शब्द तक"
        contexts={contexts}
        actions={
          <div className="flex gap-2">
            {canSubmit && (
              <Button size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setSubmitDialog(true)}>
                <FileText className="h-3.5 w-3.5" /> {t("Submit Article", "लेख प्रस्तुत करें")}
              </Button>
            )}
            {canEdit && (
              <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={openNewIssue}>
                <Plus className="h-3.5 w-3.5" /> {t("New Issue", "नया अंक")}
              </Button>
            )}
          </div>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-9 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/50 bg-muted/30 p-1">
          {([
            ["overview", t("Overview", "अवलोकन")],
            ["issues", t("Issues", "अंक")],
            ["queue", t(`Review Queue (${stats.awaitingReview})`, `समीक्षा कतार (${stats.awaitingReview})`)],
            ["mine", t("My Submissions", "मेरी प्रस्तुतियाँ")],
          ] as const).map(([v, label]) => (
            <TabsTrigger key={v} value={v} className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("Issues in progress", "प्रगति में अंक"), value: stats.issuesInProgress, icon: BookOpen },
            { label: t("Published issues", "प्रकाशित अंक"), value: stats.published, icon: BookOpen },
            { label: t("Awaiting review", "समीक्षा प्रतीक्षित"), value: stats.awaitingReview, icon: Inbox },
            { label: t("Accepted articles", "स्वीकृत लेख"), value: stats.accepted, icon: Star },
          ].map((k) => (
            <Card key={k.label} className="institution-panel">
              <CardContent className="space-y-1.5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <k.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(tab === "issues" || tab === "overview") && (
        <section className="space-y-3">
          {tab === "overview" && <h2 className="dashboard-section-heading"><BookOpen className="h-5 w-5 text-primary" />{t("Issues", "अंक")}</h2>}
          {issuesLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
          ) : issues.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {issues.map((issue) => {
                const s = ISSUE_STATUS_STYLE[issue.status];
                return (
                  <Card key={issue.id} className="institution-panel group transition-all hover:border-primary/40">
                    <CardContent className="space-y-2 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-foreground">{isHi ? issue.titleHi : issue.title}</h3>
                          {issue.issueNumber && <p className="text-[11px] text-muted-foreground">{issue.issueNumber}</p>}
                        </div>
                        <Badge variant="outline" className={cn("shrink-0 text-[10px]", s.className)}>{isHi ? s.labelHi : s.labelEn}</Badge>
                      </div>
                      {issue.subtitle && <p className="line-clamp-1 text-xs text-muted-foreground">{issue.subtitle}</p>}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] text-muted-foreground">{issue.articleCount} {t("articles", "लेख")}</span>
                        {canEdit && (
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => openIssueEdit(issue)}>
                            {t("Manage", "प्रबंधन")} <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState text={t("No issues yet.", "अभी कोई अंक नहीं।")} />
          )}
        </section>
      )}

      {tab === "queue" && (
        <ArticleList
          articles={queue}
          loading={articlesLoading}
          isHi={isHi}
          onOpen={setReviewArticle}
          emptyText={t("No articles awaiting review.", "समीक्षा हेतु कोई लेख नहीं।")}
        />
      )}

      {tab === "mine" && (
        <ArticleList
          articles={myArticles}
          loading={false}
          isHi={isHi}
          onOpen={setReviewArticle}
          emptyText={t("You have not submitted any articles yet.", "आपने अभी कोई लेख प्रस्तुत नहीं किया।")}
        />
      )}

      <CreateIssueDialog open={issueDialog} onOpenChange={setIssueDialog} editing={editingIssue} />
      <SubmitArticleDialog open={submitDialog} onOpenChange={setSubmitDialog} />
      <ArticleReviewPanel article={reviewArticle} open={!!reviewArticle} onOpenChange={(v) => !v && setReviewArticle(null)} canReview={canReview} canPublish={canEdit} />
    </motion.div>
  );
}

function ArticleList({ articles, loading, isHi, onOpen, emptyText }: {
  articles: PublicationArticle[];
  loading: boolean;
  isHi: boolean;
  onOpen: (a: PublicationArticle) => void;
  emptyText: string;
}) {
  const t = useT();
  if (loading) return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;
  if (articles.length === 0) return <EmptyState text={emptyText} />;

  return (
    <div className="space-y-2.5">
      {articles.map((a) => {
        const s = ARTICLE_STATUS_STYLE[a.status];
        const rec = a.recommendation ? RECOMMENDATION_STYLE[a.recommendation] : null;
        return (
          <Card key={a.id} className="institution-panel group cursor-pointer transition-all hover:border-primary/40" onClick={() => onOpen(a)}>
            <CardContent className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={cn("text-[10px]", s.className)}>{isHi ? s.labelHi : s.labelEn}</Badge>
                  {rec && <Badge variant="outline" className={cn("text-[10px]", rec.className)}>{isHi ? rec.labelHi : rec.labelEn}</Badge>}
                  {a.rating != null && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{a.rating}</span>
                  )}
                  {a.version > 1 && <span className="text-[10px] text-muted-foreground">v{a.version}</span>}
                </div>
                <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary">{isHi ? (a.titleHi || a.title) : a.title}</h3>
                <p className="text-[11px] text-muted-foreground">
                  {a.submitterName && <>{a.submitterName}</>}
                  {a.publicationTitle && <> · {a.publicationTitle}</>}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Card className="institution-panel-muted">
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
          <Inbox className="h-7 w-7 text-muted-foreground/40" />
        </span>
        <p className="text-sm font-medium text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
