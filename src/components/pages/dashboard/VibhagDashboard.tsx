"use client";

import Link from "next/link";
import CountUp from "react-countup";
import { motion } from "framer-motion";
import { GatividhiEvent } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { eventStatusHi } from "./constants";
import {
  CheckCircle2, Clock, Eye, ArrowRight, BarChart3, Users,
  X, FileText, QrCode,
} from "lucide-react";

type TFn = (en: string, hi: string) => string;

interface VibhagDashboardProps {
  events: GatividhiEvent[];
  permissions: { canPublishEvent: boolean };
  t: TFn;
  lastPublished: string | null;
  setLastPublished: (v: string | null) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info', subMessage?: string) => void;
  updateEventStatus: (id: string, status: string) => Promise<boolean>;
  openVrittEditor: (event: GatividhiEvent) => void;
  setQrEvent: (event: GatividhiEvent | null) => void;
}

export default function VibhagDashboard({
  events,
  permissions,
  t,
  lastPublished,
  setLastPublished,
  addToast,
  updateEventStatus,
  openVrittEditor,
  setQrEvent,
}: VibhagDashboardProps) {
  const totalEvents = events.length;
  const published = events.filter(e => e.status === "Published").length;
  const pending = events.filter(e =>
    e.status === "Pending Vibhag Review" ||
    e.status === "Pending Prant Authorization" ||
    e.status === "Pending Prant Dual Authorization"
  );
  const units = new Set(events.map(e => e.unit)).size;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="dashboard-masthead space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <p className="section-seal">{t("Bhopal Vibhag Activity Console", "भोपाल विभाग गतिविधि डेस्क")}</p>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t("Vibhag Review Board", "विभाग समीक्षा मंडल")}</h1>
              <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                {t("Vibhag review, Prant forwarding, and unit coordination in one operational view.", "विभाग समीक्षा, प्रांत को अग्रेषण और इकाई समन्वय।")}
              </p>
            </div>
          </div>
        </div>
        <div className="dashboard-context-grid sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              labelEn: "Scope", labelHi: "क्षेत्र", valueEn: "Bhopal Vibhag", valueHi: "भोपाल विभाग",
              detailEn: "Regional oversight across active units and review lanes.", detailHi: "सक्रिय इकाइयों और समीक्षा धाराओं पर क्षेत्रीय दृष्टि।",
            },
            {
              labelEn: "Operational focus", labelHi: "परिचालन केंद्र", valueEn: "Vibhag & Prant Review Lane", valueHi: "विभाग और प्रांत समीक्षा धारा",
              detailEn: "Prioritise event approvals, feed publishing, and prachar follow-through.", detailHi: "कार्यक्रम अनुमोदन, फीड प्रकाशन और प्रचार अनुवर्ती को प्राथमिकता दें।",
            },
            {
              labelEn: "Current activity", labelHi: "वर्तमान गतिविधि",
              valueEn: `${pending.length} items in active review`, valueHi: `${pending.length} प्रविष्टियाँ सक्रिय समीक्षा में`,
              detailEn: "Published work, pending approvals, and unit participation tracked together.", detailHi: "प्रकाशित कार्य, लंबित अनुमोदन और इकाई सहभागिता एक साथ दिखाई देती है।",
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("Total Events", "कुल कार्यक्रम"), value: totalEvents, icon: BarChart3, color: "text-primary", barColor: "bg-primary", sparkData: [30, 50, 40, 70, 60, 80, 75] },
          { label: t("Published", "प्रकाशित"), value: published, icon: CheckCircle2, color: "text-success", barColor: "bg-green-500", sparkData: [20, 35, 45, 40, 55, 65, 60] },
          { label: t("Pending Approval", "अनुमोदन प्रतीक्षित"), value: pending.length, icon: Clock, color: "text-warning", barColor: "bg-amber-500", sparkData: [60, 45, 50, 30, 25, 15, 20] },
          { label: t("Active Units", "सक्रिय इकाइयाँ"), value: units, icon: Users, color: "text-info", barColor: "bg-blue-500", sparkData: [40, 45, 50, 55, 60, 58, 65] },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="institution-kpi hover-lift">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">
                      <CountUp end={stat.value} duration={1.8} delay={0.2 + i * 0.1} />
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-xl ${stat.color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-end gap-[3px] h-6 mt-3">
                  {stat.sparkData.map((v, j) => (
                    <motion.div
                      key={j}
                      className={`flex-1 rounded-sm ${stat.barColor} opacity-60`}
                      initial={{ height: 0 }}
                      animate={{ height: `${(v / 100) * 100}%` }}
                      transition={{ delay: 0.5 + j * 0.05, duration: 0.4, ease: "easeOut" }}
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
            <Eye className="w-5 h-5 text-primary" /> {t('Vibhag & Prant Approval Queue', 'विभाग और प्रांत अनुमोदन कतार')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">{t('No events pending vibhag/prant approval.', 'विभाग या प्रांत अनुमोदन प्रतीक्षित कोई कार्यक्रम नहीं।')}</p>
          ) : (
            <div className="space-y-3">
              {pending.map(event => (
                <motion.div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50 gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-sm md:text-base truncate">{event.title}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                      <span>{event.unit}</span>
                      <span className="opacity-40">•</span>
                      <span>{event.date}</span>
                      <span className="opacity-40">•</span>
                      <span className="text-primary font-bold">{t(event.status, eventStatusHi[event.status])}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {event.status === "Pending Vibhag Review" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none h-8 text-[11px] gap-1.5"
                        onClick={async () => {
                          const ok = await updateEventStatus(event.id, "Pending Prant Authorization");
                          if (ok) addToast(t('Forwarded to Prant', 'प्रांत को भेजा'), 'info');
                        }}
                      >
                        <ArrowRight className="w-3.5 h-3.5" /> {t('Forward', 'भेजें')}
                      </Button>
                    )}
                    {(event.status === "Pending Prant Authorization" || event.status === "Pending Prant Dual Authorization") && (
                      <Button
                        size="sm"
                        className="flex-1 sm:flex-none h-8 text-[11px] gap-1.5 saffron-gradient text-white border-0"
                        disabled={!permissions.canPublishEvent}
                        onClick={async () => {
                          const ok = await updateEventStatus(event.id, "Published");
                          if (!ok) {
                            addToast(t('Publish not allowed', 'प्रकाशन की अनुमति नहीं है'), 'error');
                            return;
                          }
                          setLastPublished(event.title);
                          addToast(t('Published to Feed!', 'फ़ीड में प्रकाशित!'), 'success', t('Update Prachar now', 'प्रचार अद्यतन करें'));
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('Publish', 'प्रकाशित करें')}
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
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300 font-devanagari">
                          <span className="font-semibold">{lastPublished}</span> {t('published! Update Prachar now.', 'प्रकाशित! प्रचार अद्यतन करना न भूलें।')}
                        </p>
                        <Link href="/prachar">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-green-700 dark:text-green-400 hover:text-green-900">
                            {t('Go to Prachar', 'प्रचार पर जाएं')} <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <button onClick={() => setLastPublished(null)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Dismiss">
                      <X className="w-4 h-4" />
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
              <CheckCircle2 className="w-5 h-5 text-success" /> {t('Published Events Management', 'प्रकाशित कार्यक्रम प्रबंधन')}
            </div>
            <Badge variant="outline" className="text-[10px]">{published} {t('Active', 'सक्रिय')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.filter(e => e.status === "Published").map(event => (
              <div key={event.id} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-3">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-sm leading-tight">{event.title}</h4>
                  <Badge className="bg-green-500/10 text-green-600 border-0 text-[9px] uppercase font-bold tracking-widest">{t('Live', 'सक्रिय')}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{event.unit} · {event.date}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 flex-1" onClick={() => setQrEvent(event)}>
                    <QrCode className="w-3.5 h-3.5 text-amber-600" /> {t('Venue QR', 'क्यूआर')}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1.5 flex-1" onClick={() => openVrittEditor(event)}>
                    <FileText className="w-3.5 h-3.5 text-primary" /> {t('Vritt', 'वृत्त')}
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
