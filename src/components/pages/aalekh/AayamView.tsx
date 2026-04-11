"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Masthead } from "@/components/Masthead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";
import type { AalekhArticle, ArticleStatus } from "@/context/AppContext";
import { ArticleCard, EditForwardDialog, ReturnWithNotesDialog } from "./shared";

interface AayamViewProps {
  articles: AalekhArticle[];
  updateArticleStatus: (
    id: string,
    status: ArticleStatus,
    edits?: Partial<Pick<AalekhArticle, "title" | "content" | "summary">>,
    opts?: { reviewNotes?: string | null },
  ) => Promise<boolean>;
}

export function AayamView({ articles, updateArticleStatus }: AayamViewProps) {
  const t = useT();
  const { addToast } = useToast();
  const queue = articles.filter(a => a.status === "Pending Aayam Review");
  const forwarded = articles.filter(a =>
    a.status !== "Pending Aayam Review" &&
    a.status !== "Pending Unit Head Review" &&
    a.status !== "Draft"
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal="Aalekh Thematic Review Desk"
        sealHi="आलेख विषयगत समीक्षा कक्ष"
        title="Review and Route Aalekh"
        titleHi="आलेख की समीक्षा करें और आगे बढ़ाएँ"
        subtitle="Review the final drafts, make the thematic editorial call, and forward to Vibhag for final review."
        subtitleHi="अंतिम मसौदे देखें, विषयगत संपादकीय निर्णय लें और अंतिम समीक्षा के लिए विभाग को भेजें।"
        contexts={[
          {
            labelEn: "Current lane",
            labelHi: "वर्तमान चरण",
            valueEn: "Aayam Thematic Review",
            valueHi: "आयाम विषयगत समीक्षा",
            detailEn: "Approve the ready aalekh for vibhag review or return for unit revision.",
            detailHi: "विभाग समीक्षा के लिए तैयार आलेख भेजें या इकाई संशोधन के लिए लौटाएं।",
          },
          {
            labelEn: "Next movement",
            labelHi: "अगला प्रवाह",
            valueEn: "Forward to Vibhag Pramukh",
            valueHi: "विभाग प्रमुख को भेजें",
            detailEn: "Thematic clearance moves the aalekh into the regional approval rhythm.",
            detailHi: "विषयगत स्पष्टता आलेख को क्षेत्रीय अनुमोदन प्रवाह में ले जाती है।",
          },
          {
            labelEn: "Editorial standard",
            labelHi: "संपादकीय मानक",
            valueEn: "Thematic scrutiny & mission alignment",
            valueHi: "विषयगत जांच और मिशन-संगति",
            detailEn: "Keep tone, clarity, and organisation mission alignment intact.",
            detailHi: "स्वर, स्पष्टता और संगठन की मिशन-संगति बनाए रखें।",
          },
        ]}
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-blue-500" /> {t(`Aayam Review Queue (${queue.length})`, `आयाम समीक्षा पंक्ति (${queue.length})`)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">{t('Nothing is waiting for review.', 'अभी समीक्षा के लिए कुछ भी प्रतीक्षित नहीं है।')}</p>
          ) : (
            queue.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ArticleCard
                  article={a}
                  actions={
                    <div className="flex items-center gap-2 flex-wrap">
                      <EditForwardDialog
                        article={a}
                        targetStatus="Pending Vibhag Review"
                        actionLabel={t("Review and Send to Vibhag", "समीक्षा करें और विभाग को भेजें")}
                        onDone={async (edits) => {
                          const ok = await updateArticleStatus(a.id, "Pending Vibhag Review", edits);
                          if (!ok) return false;
                          addToast(t('Article forwarded!', 'आलेख आगे भेजा!'), 'info', t('Sent for Vibhag Pramukh review', 'विभाग प्रमुख की समीक्षा के लिए'));
                          return true;
                        }}
                      />
                      <ReturnWithNotesDialog
                        articleId={a.id}
                        onReturn={async (reviewNotes) => {
                          const ok = await updateArticleStatus(a.id, "Draft", undefined, { reviewNotes: reviewNotes ?? null });
                          if (!ok) return;
                          addToast(t('Returned for revision', 'संशोधन के लिए वापस भेजा'), 'warning', t('Sent back for revision', 'संशोधन के लिए वापस भेजा गया'));
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
            <TrendingUp className="w-4 h-4 text-primary" /> {t(`Forwarded / Published (${forwarded.length})`, `अग्रेषित / प्रकाशित (${forwarded.length})`)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {forwarded.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              {t("No aalekh have been moved ahead yet.", "अभी कोई आलेख आगे नहीं बढ़ाया गया है।")}
            </p>
          ) : (
            forwarded.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <ArticleCard article={a} />
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
