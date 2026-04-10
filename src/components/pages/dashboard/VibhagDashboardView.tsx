"use client";

import Link from "next/link";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, CheckCircle2, Clock, Eye, FileText, QrCode, Users, X } from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import type { VibhagDashboardViewProps } from "./types";

export function VibhagDashboardView({
  events,
  permissions,
  t,
  eventStatusHi,
  onOpenVrittEditor,
  onOpenQr,
  lastPublished,
  onDismissPublished,
  onForwardToPrant,
  onPublishEvent,
}: VibhagDashboardViewProps) {
  const totalEvents = events.length;
  const published = events.filter((event) => event.status === "Published").length;
  const pending = events.filter(
    (event) =>
      event.status === "Pending Vibhag Review" ||
      event.status === "Pending Prant Authorization" ||
      event.status === "Pending Prant Dual Authorization",
  );
  const units = new Set(events.map((event) => event.unit)).size;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal="Bhopal Vibhag Activity Console"
        sealHi="भोपाल विभाग गतिविधि डेस्क"
        title="Vibhag Review Board"
        titleHi="विभाग समीक्षा मंडल"
        subtitle="Vibhag review, Prant forwarding, and unit coordination in one operational view."
        subtitleHi="विभाग समीक्षा, प्रान्त को अग्रेषण और इकाई समन्वय।"
        contexts={[
          {
            labelEn: "Scope",
            labelHi: "क्षेत्र",
            valueEn: "Bhopal Vibhag",
            valueHi: "भोपाल विभाग",
            detailEn: "Regional oversight across active units and review lanes.",
            detailHi: "सक्रिय इकाइयों और समीक्षा धाराओं पर क्षेत्रीय दृष्टि।",
          },
          {
            labelEn: "Operational focus",
            labelHi: "परिचालन केंद्र",
            valueEn: "Vibhag & Prant Review Lane",
            valueHi: "विभाग और प्रान्त समीक्षा धारा",
            detailEn: "Prioritise event approvals, feed publishing, and prachar follow-through.",
            detailHi: "कार्यक्रम अनुमोदन, फ़ीड प्रकाशन और प्रचार अनुवर्ती को प्राथमिकता दें।",
          },
          {
            labelEn: "Current activity",
            labelHi: "वर्तमान गतिविधि",
            valueEn: `${pending.length} items in active review`,
            valueHi: `${pending.length} प्रविष्टियाँ सक्रिय समीक्षा में`,
            detailEn: "Published work, pending approvals, and unit participation tracked together.",
            detailHi: "प्रकाशित कार्य, लंबित अनुमोदन और इकाई सहभागिता साथ में दिखती है।",
          },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t("Total Events", "कुल कार्यक्रम"),
            value: totalEvents,
            icon: BarChart3,
            color: "text-primary",
            barColor: "bg-primary",
            sparkData: [30, 50, 40, 70, 60, 80, 75],
          },
          {
            label: t("Published", "प्रकाशित"),
            value: published,
            icon: CheckCircle2,
            color: "text-success",
            barColor: "bg-green-500",
            sparkData: [20, 35, 45, 40, 55, 65, 60],
          },
          {
            label: t("Pending Approval", "अनुमोदन प्रतीक्षित"),
            value: pending.length,
            icon: Clock,
            color: "text-warning",
            barColor: "bg-amber-500",
            sparkData: [60, 45, 50, 30, 25, 15, 20],
          },
          {
            label: t("Active Units", "सक्रिय इकाइयाँ"),
            value: units,
            icon: Users,
            color: "text-info",
            barColor: "bg-blue-500",
            sparkData: [40, 45, 50, 55, 60, 58, 65],
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="institution-kpi hover-lift">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-3xl font-bold">
                      <CountUp end={stat.value} duration={1.8} delay={0.2 + index * 0.1} />
                    </p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color.replace("text-", "bg-")}/10`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3 flex h-6 items-end gap-[3px]">
                  {stat.sparkData.map((value, sparkIndex) => (
                    <motion.div
                      key={sparkIndex}
                      className={`flex-1 rounded-sm ${stat.barColor} opacity-60`}
                      initial={{ height: 0 }}
                      animate={{ height: `${value}%` }}
                      transition={{ delay: 0.5 + sparkIndex * 0.05, duration: 0.4, ease: "easeOut" }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="institution-panel">
        <CardHeader>
          <CardTitle className="dashboard-section-heading">
            <Eye className="h-5 w-5 text-primary" /> {t("Vibhag & Prant Approval Queue", "विभाग और प्रान्त अनुमोदन कतार")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("No events pending vibhag/prant approval.", "विभाग या प्रान्त अनुमोदन प्रतीक्षित कोई कार्यक्रम नहीं।")}
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((event) => (
                <motion.div
                  key={event.id}
                  className="flex flex-col justify-between gap-4 rounded-lg border border-border/50 bg-muted/50 p-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold md:text-base">{event.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground md:text-xs">
                      <span>{event.unit}</span>
                      <span className="opacity-40">•</span>
                      <span>{event.date}</span>
                      <span className="opacity-40">•</span>
                      <span className="font-bold text-primary">{t(event.status, eventStatusHi[event.status] ?? event.status)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {event.status === "Pending Vibhag Review" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-1 gap-1.5 text-[11px] sm:flex-none"
                        onClick={() => void onForwardToPrant(event.id)}
                      >
                        <ArrowRight className="h-3.5 w-3.5" /> {t("Forward", "भेजें")}
                      </Button>
                    )}
                    {(event.status === "Pending Prant Authorization" || event.status === "Pending Prant Dual Authorization") && (
                      <Button
                        size="sm"
                        className="saffron-gradient h-8 flex-1 gap-1.5 border-0 text-[11px] text-white sm:flex-none"
                        disabled={!permissions.canPublishEvent}
                        onClick={() => void onPublishEvent(event.id, event.title, event.status)}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> {t("Publish", "प्रकाशित करें")}
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {lastPublished && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <Card className="border border-green-500/40 bg-green-500/10">
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <div className="space-y-2">
                        <p className="font-devanagari text-sm font-medium text-green-800 dark:text-green-300">
                          <span className="font-semibold">{lastPublished}</span> {t("published! Update Prachar now.", "प्रकाशित! प्रचार अद्यतन करना न भूलें।")}
                        </p>
                        <Link href="/prachar">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-green-700 hover:text-green-900 dark:text-green-400">
                            {t("Go to Prachar", "प्रचार पर जाएँ")} <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={onDismissPublished}
                      className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card className="institution-panel">
        <CardHeader>
          <CardTitle className="dashboard-section-heading flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" /> {t("Published Events Management", "प्रकाशित कार्यक्रम प्रबंधन")}
            </div>
            <Badge variant="outline" className="text-[10px]">
              {published} {t("Active", "सक्रिय")}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {events
              .filter((event) => event.status === "Published")
              .map((event) => (
                <div key={event.id} className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-bold leading-tight">{event.title}</h4>
                    <Badge className="border-0 bg-green-500/10 text-[9px] font-bold uppercase tracking-widest text-green-600">
                      {t("Live", "सक्रिय")}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {event.unit} · {event.date}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" className="h-8 flex-1 gap-1.5 text-[10px]" onClick={() => onOpenQr(event)}>
                      <QrCode className="h-3.5 w-3.5 text-amber-600" /> {t("Venue QR", "क्यूआर")}
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 flex-1 gap-1.5 text-[10px]" onClick={() => onOpenVrittEditor(event)}>
                      <FileText className="h-3.5 w-3.5 text-primary" /> {t("Vritt", "वृत्त")}
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
