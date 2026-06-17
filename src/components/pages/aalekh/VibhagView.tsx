"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Masthead } from "@/components/Masthead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Clock, ArrowRight, BarChart3,
  Users, TrendingUp, X
} from "lucide-react";
import type { AalekhArticle, ArticleStatus } from "@/context/AppContext";
import type { AppPermissionSummary } from "@/lib/app/contracts";
import { ArticleCard, EditForwardDialog, ReturnWithNotesDialog } from "./shared";

interface VibhagViewProps {
  articles: AalekhArticle[];
  permissions: AppPermissionSummary;
  viewToggle?: React.ReactNode;
  updateArticleStatus: (id: string, status: ArticleStatus, edits?: Partial<Pick<AalekhArticle, "title" | "content" | "summary">>, opts?: { reviewNotes?: string | null }) => Promise<boolean>;
  lastPublished: string | null;
  setLastPublished: (val: string | null) => void;
}

export function VibhagView({ articles, permissions, updateArticleStatus, lastPublished, setLastPublished, viewToggle }: VibhagViewProps) {
  const t = useT();
  const { addToast } = useToast();

  const total = articles.length;
  const published = articles.filter(a => a.status === "Published").length;
  const pendingCount = articles.filter(a => a.status !== "Published" && a.status !== "Draft" && a.status !== "Archived").length;
  const vibhagQueue = articles.filter(a => a.status === "Pending Vibhag Review" || a.status === "Pending Prant Authorization");
  const publishedList = articles.filter(a => a.status === "Published");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal="Vibhag Editorial Console"
        sealHi="विभाग संपादकीय डेस्क"
        title="Vibhag Review Board"
        titleHi="विभाग समीक्षा मंडल"
        subtitle="Regional oversight of all aayams. Review, authorize, and publish institutional aalekh."
        subtitleHi="सभी आयामों की क्षेत्रीय दृष्टि। संस्थागत आलेखों की समीक्षा करें, अधिकृत करें और प्रकाशित करें।"
        contexts={[
          {
            labelEn: "Operational focus",
            labelHi: "परिचालन केंद्र",
            valueEn: "Vibhag & Prant Approval Lane",
            valueHi: "विभाग और प्रांत अनुमोदन धारा",
            detailEn: "Final quality gate before publication to the state-level feed.",
            detailHi: "राज्य-स्तरीय फ़ीड में प्रकाशन से पहले अंतिम गुणवत्ता जांच।",
          },
          {
            labelEn: "Current activity",
            labelHi: "वर्तमान गतिविधि",
            valueEn: `${vibhagQueue.length} items awaiting action`,
            valueHi: `${vibhagQueue.length} प्रविष्टियाँ कार्रवाई हेतु प्रतीक्षित`,
            detailEn: "Track pending approvals from across all active aayams.",
            detailHi: "सभी सक्रिय आयामों से लंबित अनुमोदनों पर नज़र रखें।",
          },
        ]}
      />
      {viewToggle && <div className="flex justify-end">{viewToggle}</div>}

      {lastPublished && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="border-green-500/40 bg-green-500/10">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-green-800 dark:text-green-300 text-sm font-devanagari">
                <strong>{lastPublished}</strong> {t('published to feed!', 'फ़ीड में प्रकाशित!')}
              </span>
              <div className="flex items-center gap-2 ml-3">
                <Link href="/feed">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-700 dark:text-green-400">
                    {t('View in Feed', 'फ़ीड में देखें')} <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
                <button onClick={() => setLastPublished(null)} className="text-muted-foreground hover:text-foreground" aria-label={t("Dismiss notification", "सूचना हटाएं")}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: t("Total Articles", "कुल आलेख"), value: total, icon: BarChart3, color: "text-primary" },
          { label: t("Published", "प्रकाशित"), value: published, icon: CheckCircle2, color: "text-green-600" },
          { label: t("In Review", "समीक्षाधीन"), value: pendingCount, icon: Clock, color: "text-amber-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card hover-lift">
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-70`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" /> {t(`Vibhag Review Queue (${vibhagQueue.length})`, `विभाग समीक्षा पंक्ति (${vibhagQueue.length})`)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {vibhagQueue.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">{t('No aalekh are waiting for vibhag/prant action.', 'अभी कोई आलेख विभाग या प्रांत कार्रवाई के लिए प्रतीक्षित नहीं है।')}</p>
          ) : (
            vibhagQueue.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ArticleCard
                  article={a}
                  actions={
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.status === "Pending Vibhag Review" && (
                        <Button size="sm" className="h-7 text-xs" onClick={async () => {
                          const ok = await updateArticleStatus(a.id, "Pending Prant Authorization");
                          if (ok) addToast(t('Forwarded to Prant', 'प्रांत को भेजा'), 'info');
                        }}>
                          <ArrowRight className="w-3 h-3 mr-1" /> {t('Forward to Prant', 'प्रांत को भेजें')}
                        </Button>
                      )}
                      {(a.status === "Pending Prant Authorization") && (
                        permissions.canPublishArticle ? (
                        <EditForwardDialog
                          article={a}
                          targetStatus="Published"
                          actionLabel={t("Review and Publish", "समीक्षा करें और प्रकाशित करें")}
                          onDone={async (edits) => {
                            const ok = await updateArticleStatus(a.id, "Published", edits);
                            if (!ok) return false;
                            setLastPublished(edits.title ?? a.title);
                            addToast(t('Article Published!', 'आलेख प्रकाशित!'), 'success', t('Available in Feed', 'फ़ीड में उपलब्ध'));
                            return true;
                          }}
                        />
                        ) : (
                          <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-[10px] text-violet-700 dark:text-violet-300">
                            {t("Waiting for Prant authorization", "प्रांत अनुमोदन प्रतीक्षित")}
                          </Badge>
                        )
                      )}
                      <ReturnWithNotesDialog
                        articleId={a.id}
                        onReturn={async (reviewNotes) => {
                          const ok = await updateArticleStatus(a.id, "Draft", undefined, { reviewNotes: reviewNotes ?? null });
                          if (!ok) return;
                          addToast(t('Returned to writer', 'लेखक को वापस भेजा'), 'warning', t('Sent back for revision', 'संशोधन के लिए वापस भेजा गया'));
                        }}
                      />
                    </div>
                  }
                />
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> {t('Published Articles', 'प्रकाशित आलेख')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {publishedList.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">{t('No published articles yet.', 'अभी कोई प्रकाशित आलेख नहीं।')}</p>
          ) : (
            publishedList.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ArticleCard article={a} />
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
