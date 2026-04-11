"use client";

import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Clock, MapPin, TrendingUp } from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { AayamDashboardViewProps } from "./types";

export function AayamDashboardView({
  events,
  t,
  eventStatusHi,
  statusBadge,
  onForwardToVibhag,
}: AayamDashboardViewProps) {
  const pendingReview = events.filter((event) => event.status === "Pending Aayam Review" || event.status === "Submitted by Unit");
  const forwarded = events.filter(
    (event) =>
      event.status !== "Pending Aayam Review" &&
      event.status !== "Submitted by Unit" &&
      event.status !== "Draft" &&
      event.status !== "Cancelled",
  );

  const statusLabel = (status: string) => t(status, eventStatusHi[status] ?? status);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal="Aayam Review Desk"
        sealHi="आयाम समीक्षा डेस्क"
        title="Aayam Review Board"
        titleHi="आयाम समीक्षा मंडल"
        subtitle="Review incoming programmes, forward for vibhag review, and keep the organisational lane clear."
        subtitleHi="आगत कार्यक्रमों की समीक्षा करें, विभाग समीक्षा हेतु आगे भेजें और संगठनात्मक धारा स्पष्ट रखें।"
        contexts={[
          {
            labelEn: "Review queue",
            labelHi: "समीक्षा कतार",
            valueEn: `${pendingReview.length} programmes awaiting review`,
            valueHi: `${pendingReview.length} कार्यक्रम समीक्षा हेतु प्रतीक्षित`,
            detailEn: "Programmes submitted by units arrive here for thematic review.",
            detailHi: "इकाइयों द्वारा भेजे गए कार्यक्रम विषयगत समीक्षा के लिए यहाँ आते हैं।",
          },
          {
            labelEn: "Forwarded lane",
            labelHi: "अग्रेषित धारा",
            valueEn: `${forwarded.length} items moved ahead`,
            valueHi: `${forwarded.length} प्रविष्टियाँ आगे भेजी गईं`,
            detailEn: "Track what has already reached vibhag/prant review or publication.",
            detailHi: "जो कार्य विभाग/प्रान्त समीक्षा या प्रकाशन तक पहुँच चुका है, वह यहाँ दिखता है।",
          },
          {
            labelEn: "Operational focus",
            labelHi: "परिचालन केंद्र",
            valueEn: "Thematic Review & Forwarding",
            valueHi: "विषयगत समीक्षा और अग्रेषण",
            detailEn: "Keep the review lane moving cleanly for vibhag-level action.",
            detailHi: "विभाग स्तर की कार्रवाई के लिए समीक्षा धारा को स्पष्ट और गतिशील रखें।",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="institution-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> {t(`Pending Reviews (${pendingReview.length})`, `समीक्षा प्रतीक्षित (${pendingReview.length})`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingReview.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("All caught up! No pending reviews.", "सब ठीक है! कोई समीक्षा प्रतीक्षित नहीं।")}
              </p>
            ) : (
              pendingReview.map((event) => (
                <motion.div key={event.id} className="space-y-3 rounded-lg border border-border/50 bg-accent/50 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold md:text-base">{event.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground md:text-xs">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.unit}
                        </span>
                        <span className="opacity-40">•</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {event.date}
                        </span>
                      </p>
                    </div>
                    <Badge className={cn(statusBadge(event.status), "shrink-0 self-start")}>{statusLabel(event.status)}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{event.description}</p>
                  <div className="space-y-1">
                    <Button size="sm" onClick={() => void onForwardToVibhag(event.id, event.status)}>
                      {event.status === "Submitted by Unit"
                        ? t("Accept & Begin Review", "स्वीकारें और समीक्षा प्रारंभ करें")
                        : t("Review & Forward to Vibhag", "समीक्षा करें और विभाग को भेजें")} <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                    <p className="pl-0.5 font-devanagari text-xs text-muted-foreground">
                      {t(
                        "Forwarded events are visible to Vibhag Pramukh for further review.",
                        "अग्रेषित कार्यक्रम विभाग प्रमुख को अगली समीक्षा के लिए दिखाई देंगे।",
                      )}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="institution-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-success" /> {t(`Forwarded (${forwarded.length})`, `अग्रेषित (${forwarded.length})`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {forwarded.map((event) => (
              <div key={event.id} className="rounded-lg border border-border/30 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium">{event.title}</p>
                  <Badge className={statusBadge(event.status)}>{statusLabel(event.status)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {event.unit} · {event.date}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
