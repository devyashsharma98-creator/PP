"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Masthead } from "@/components/Masthead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { AalekhArticle, ArticleStatus } from "@/context/AppContext";
import { ArticleCard, EditForwardDialog, ReturnWithNotesDialog } from "./shared";

interface UnitHeadViewProps {
  articles: AalekhArticle[];
  viewToggle?: React.ReactNode;
  updateArticleStatus: (
    id: string,
    status: ArticleStatus,
    edits?: Partial<Pick<AalekhArticle, "title" | "content" | "summary">>,
    opts?: { reviewNotes?: string | null },
  ) => Promise<boolean>;
}

export function UnitHeadView({ articles, updateArticleStatus }: UnitHeadViewProps) {
  const t = useT();
  const { addToast } = useToast();
  const queue = articles.filter(a => a.status === "Pending Unit Head Review");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        compact
        seal="First Editorial Review Desk"
        sealHi="प्रथम संपादकीय समीक्षा कक्ष"
        title="Review and Route Aalekh"
        titleHi="आलेख की समीक्षा करें और आगे बढ़ाएँ"
        contexts={[
          {
            labelEn: "Current lane",
            labelHi: "वर्तमान चरण",
            valueEn: "Pending first-review queue",
            valueHi: "प्रथम समीक्षा प्रतीक्षारत पंक्ति",
            detailEn: "Send notes back when needed, or move the draft to aayam once it is ready.",
            detailHi: "ज़रूरत हो तो नोट के साथ लौटाएं, नहीं तो तैयार मसौदा आयाम को भेजें।",
          },
          {
            labelEn: "Editorial responsibility",
            labelHi: "संपादकीय दायित्व",
            valueEn: "Strengthen clarity before escalation",
            valueHi: "अगले चरण से पहले स्पष्टता सुदृढ़ करें",
            detailEn: "This is the quality gate between first writing and final publication review.",
            detailHi: "यह शुरुआती लेखन और अंतिम प्रकाशन समीक्षा के बीच की गुणवत्ता जांच है।",
          },
          {
            labelEn: "Next movement",
            labelHi: "अगला प्रवाह",
            valueEn: "Forward to Aayam Pramukh",
            valueHi: "आयाम प्रमुख को भेजें",
            detailEn: "Approved drafts move ahead for thematic review and publication approval.",
            detailHi: "स्वीकृत मसौदे आगे विषयगत समीक्षा और प्रकाशन अनुमोदन में जाते हैं।",
          },
        ]}
      />

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-amber-500" /> {t(`Pending First-Review Queue (${queue.length})`, `प्रथम समीक्षा प्रतीक्षारत (${queue.length})`)}
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            {t("Return with notes or send to aayam", "टिप्पणियों के साथ लौटाएं या आयाम को भेजें")}
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">{t('No aalekh are waiting for review.', 'अभी कोई आलेख समीक्षा में प्रतीक्षित नहीं है।')}</p>
          ) : (
            queue.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <ArticleCard
                  article={a}
                  actions={
                    <div className="flex items-center gap-2 flex-wrap">
                      <EditForwardDialog
                        article={a}
                        targetStatus="Pending Aayam Review"
                        actionLabel={t("Review and Send to Aayam", "समीक्षा करें और आयाम को भेजें")}
                        onDone={async (edits) => {
                          const ok = await updateArticleStatus(a.id, "Pending Aayam Review", edits);
                          if (!ok) return false;
                          addToast(t('Article forwarded!', 'आलेख आगे भेजा!'), 'info', t('Sent for Aayam Pramukh review', 'आयाम प्रमुख की समीक्षा के लिए'));
                          return true;
                        }}
                      />
                      <ReturnWithNotesDialog
                        articleId={a.id}
                        onReturn={async (reviewNotes) => {
                          const ok = await updateArticleStatus(a.id, "Draft", undefined, { reviewNotes: reviewNotes ?? null });
                          if (!ok) return;
                          addToast(t('Returned to writer', 'लेखक को वापस भेजा'), 'warning', t('Sent back for revision', 'संशोधन के लिए वापस भेजा'));
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

    </motion.div>
  );
}
