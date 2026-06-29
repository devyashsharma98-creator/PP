"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3 } from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/useT";
import { useOutreachAnalytics } from "@/hooks/api/use-outreach";
import { OutreachAnalytics } from "@/components/pages/prachar/OutreachAnalytics";

export default function PracharVishleshan() {
  const t = useT();
  const { data } = useOutreachAnalytics();

  const contexts = [
    {
      labelEn: "Total outreach", labelHi: "कुल प्रसार",
      valueEn: `${data?.total ?? 0} items`, valueHi: `${data?.total ?? 0} कार्य`,
      detailEn: "Across journals, conferences, campus, newsletters, and shivirs.",
      detailHi: "पत्रिका, सम्मेलन, परिसर, समाचार पत्र एवं शिविर सहित।",
    },
    {
      labelEn: "Completion rate", labelHi: "पूर्णता दर",
      valueEn: `${data?.completionRate ?? 0}%`, valueHi: `${data?.completionRate ?? 0}%`,
      detailEn: "Actionable outreach carried through (skipped excluded).",
      detailHi: "पूर्ण किया गया क्रियाशील प्रसार (छोड़े गए को छोड़कर)।",
    },
    {
      labelEn: "Open follow-through", labelHi: "खुला अनुवर्तन",
      valueEn: `${data?.pending ?? 0} pending`, valueHi: `${data?.pending ?? 0} लंबित`,
      detailEn: "Outreach still awaiting action before the next cycle.",
      detailHi: "अगले चक्र से पहले कार्रवाई की प्रतीक्षा में प्रसार।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
      <Link href="/prachar">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("Back to Prachar", "प्रचार पर वापस")}
        </Button>
      </Link>

      <Masthead
        compact
        seal="Outreach Analytics"
        sealHi="प्रसार विश्लेषण"
        title="Reach Before the Next Cycle"
        titleHi="अगले चक्र से पहले पहुँच"
        contexts={contexts}
        actions={
          <Link href="/prachar">
            <Button size="sm" variant="outline" className="h-8 gap-1.5 px-3 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> {t("Open Prachar queue", "प्रचार कतार खोलें")}
            </Button>
          </Link>
        }
      />

      <OutreachAnalytics />
    </motion.div>
  );
}
