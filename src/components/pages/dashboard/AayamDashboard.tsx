"use client";

import { motion } from "framer-motion";
import { GatividhiEvent } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusBadge, eventStatusHi } from "./constants";
import {
  Clock, TrendingUp, MapPin, CalendarDays, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TFn = (en: string, hi: string) => string;

interface AayamDashboardProps {
  events: GatividhiEvent[];
  t: TFn;
  addToast: (message: string, type: 'success' | 'error' | 'info', subMessage?: string) => void;
  updateEventStatus: (id: string, status: string) => Promise<boolean>;
}

export default function AayamDashboard({
  events,
  t,
  addToast,
  updateEventStatus,
}: AayamDashboardProps) {
  const pendingReview = events.filter(e => e.status === "Pending Aayam Review" || e.status === "Submitted by Unit");
  const forwarded = events.filter(e =>
    e.status !== "Pending Aayam Review" &&
    e.status !== "Submitted by Unit" &&
    e.status !== "Draft" &&
    e.status !== "Cancelled"
  );

  const statusLabel = (status: string) => t(status, eventStatusHi[status] ?? status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="dashboard-masthead space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="section-seal">{t("Aayam Review Desk", "आयाम समीक्षा डेस्क")}</p>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("Aayam Review Board", "आयाम समीक्षा मंडल")}</h1>
              <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                {t("Review incoming programmes, forward for vibhag review, and keep the organisational lane clear.", "आगत कार्यक्रमों की समीक्षा करें, विभाग समीक्षा हेतु आगे भेजें और संगठनात्मक धारा स्पष्ट रखें।")}
              </p>
            </div>
          </div>
        </div>
        <div className="dashboard-context-grid sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              labelEn: "Review queue", labelHi: "समीक्षा कतार",
              valueEn: `${pendingReview.length} programmes awaiting review`, valueHi: `${pendingReview.length} कार्यक्रम समीक्षा हेतु प्रतीक्षित`,
              detailEn: "Programmes submitted by units arrive here for thematic review.", detailHi: "इकाइयों द्वारा भेजे गए कार्यक्रम विषयगत समीक्षा के लिए यहाँ आते हैं।",
            },
            {
              labelEn: "Forwarded lane", labelHi: "अग्रेषित धारा",
              valueEn: `${forwarded.length} items moved ahead`, valueHi: `${forwarded.length} प्रविष्टियाँ आगे भेजी गईं`,
              detailEn: "Track what has already reached vibhag/prant review or publication.", detailHi: "जो कार्य विभाग/प्रांत समीक्षा या प्रकाशन तक पहुँच चुका है, वह यहाँ दिखता है।",
            },
            {
              labelEn: "Operational focus", labelHi: "परिचालन केंद्र",
              valueEn: "Thematic Review & Forwarding", valueHi: "विषयगत समीक्षा और अग्रेषण",
              detailEn: "Keep the review lane moving cleanly for vibhag-level action.", detailHi: "विभाग स्तर की कार्रवाई के लिए समीक्षा धारा को स्पष्ट और गतिशील रखें।",
            },
          ].map((context) => (
            <div key={context.labelEn} className="dashboard-context-card">
              <p className="shell-copy">{t(context.labelEn, context.labelHi)}</p>
              <p className="dashboard-context-value">{t(context.valueEn, context.valueHi ?? context.valueEn)}</p>
              <p className="dashboard-context-detail">{t(context.detailEn, context.detailHi)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Reviews */}
        <Card className="institution-panel">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" /> {t(`Pending Reviews (${pendingReview.length})`, `समीक्षा प्रतीक्षित (${pendingReview.length})`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReview.length === 0 ? (
              <p className="text-muted-foreground text-sm py-6 text-center">{t('All caught up! No pending reviews.', 'सब ठीक है! कोई समीक्षा प्रतीक्षित नहीं।')}</p>
            ) : (
              pendingReview.map(event => (
                <motion.div key={event.id} className="p-4 rounded-lg bg-accent/50 border border-border/50 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-sm md:text-base truncate">{event.title}</p>
                      <p className="text-[10px] md:text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.unit}</span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{event.date}</span>
                      </p>
                    </div>
                    <Badge className={cn(statusBadge(event.status), "shrink-0 self-start")}>{t(event.status, eventStatusHi[event.status])}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <div className="space-y-1">
                    <Button size="sm" onClick={async () => {
                      const ok = await updateEventStatus(event.id, "Pending Vibhag Review");
                      if (!ok) {
                        addToast(t('Forward not allowed', 'आगे भेजने की अनुमति नहीं है'), 'error');
                        return;
                      }
                      addToast(t('Forwarded for vibhag review', 'विभाग समीक्षा के लिए भेजा'), 'info', t('Sent to Vibhag Pramukh', 'विभाग प्रमुख की समीक्षा के लिए भेजा'));
                    }}>
                      {t('Review & Forward to Vibhag', 'समीक्षा करें और विभाग को भेजें')} <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    <p className="text-xs text-muted-foreground pl-0.5 font-devanagari">
                      {t('Forwarded events are visible to Vibhag Pramukh for further review.', 'अग्रेषित कार्यक्रम विभाग प्रमुख को अगली समीक्षा के लिए दिखाई देंगे।')}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Forwarded */}
        <Card className="institution-panel">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" /> {t(`Forwarded (${forwarded.length})`, `अग्रेषित (${forwarded.length})`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {forwarded.map(event => (
              <div key={event.id} className="p-4 rounded-lg bg-muted/30 border border-border/30">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm">{event.title}</p>
                  <Badge className={statusBadge(event.status)}>{statusLabel(event.status)}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{event.unit} · {event.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
