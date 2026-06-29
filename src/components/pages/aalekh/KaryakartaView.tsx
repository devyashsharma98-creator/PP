"use client";

import { motion } from "framer-motion";
import { useT } from "@/lib/useT";
import { Masthead } from "@/components/Masthead";
import { Card, CardContent } from "@/components/ui/card";
import { PenLine } from "lucide-react";
import type { AalekhArticle } from "@/context/AppContext";
import { ArticleCard, WriteArticleDialog, ReviseArticleDialog, emptyForm } from "./shared";

interface KaryakartaViewProps {
  articles: AalekhArticle[];
  viewToggle?: React.ReactNode;
  initialTitle?: string;
  initialContent?: string;
  onResubmit: (id: string, form: { title: string; content: string; summary: string; socialUrl: string; documentUrl: string; valuesChecklist: { rashtraPratham: boolean; culturallyGrounded: boolean; balancedTone: boolean; noDivisiveContent: boolean } }) => Promise<boolean>;
  handleSubmit: (form: typeof emptyForm) => Promise<boolean>;
}

export function KaryakartaView({ articles, handleSubmit, viewToggle, initialTitle, initialContent, onResubmit }: KaryakartaViewProps) {
  const t = useT();
  const mine = articles.filter(a => a.author === "Current User");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        compact
        seal="Aalekh Writing Desk"
        sealHi="आलेख लेखन कक्ष"
        title="Draft and Submit Aalekh"
        titleHi="आलेख लिखें और समीक्षा हेतु भेजें"
        actions={<WriteArticleDialog onSubmit={handleSubmit} initialTitle={initialTitle} initialContent={initialContent} />}
        contexts={[
          {
            labelEn: "Current lane",
            labelHi: "वर्तमान चरण",
            valueEn: "Draft, revise, and send forward",
            valueHi: "लिखें, सुधारें, आगे भेजें",
            detailEn: "Work on new drafts, revise returned ones, and get them ready for unit review.",
            detailHi: "नए मसौदे लिखें, लौटे हुए सुधारें और उन्हें यूनिट समीक्षा के लिए तैयार करें।",
          },
          {
            labelEn: "Next movement",
            labelHi: "अगला प्रवाह",
            valueEn: "Send to Unit Head review",
            valueHi: "यूनिट प्रमुख समीक्षा को भेजें",
            detailEn: "Each ready draft first passes through the unit review desk.",
            detailHi: "हर तैयार मसौदा पहले यूनिट समीक्षा कक्ष से गुजरता है।",
          },
          {
            labelEn: "Published intent",
            labelHi: "प्रकाशन उद्देश्य",
            valueEn: "Ideas shaped for institutional publication",
            valueHi: "संस्थागत प्रकाशन हेतु तैयार विचार",
            detailEn: "Strong writing here moves into review and then into the published feed.",
            detailHi: "यहां की मजबूत लेखनी पहले समीक्षा में जाती है, फिर प्रकाशित फ़ीड तक पहुंचती है।",
          },
        ]}
      />
      {viewToggle && <div className="flex justify-end">{viewToggle}</div>}

      {mine.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-10 text-center text-muted-foreground text-sm space-y-3">
            <PenLine className="w-8 h-8 mx-auto opacity-40" />
            <p>{t("No aalekh yet. Write your first one.", "अभी कोई आलेख नहीं। पहला आलेख लिखें।")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mine.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ArticleCard
                article={a}
                actions={a.status === "Returned for Revision" ? (
                  <ReviseArticleDialog article={a} onResubmit={(form) => onResubmit(a.id, form)} />
                ) : undefined}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
