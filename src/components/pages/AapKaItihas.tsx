"use client";

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  History, CalendarDays, MapPin, CheckCircle2, Activity,
  Sparkles, Star, Clock, BookOpen, Award, Compass, TrendingUp,
  Shield, User, Landmark
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';

// ── AapKaItihas Context Types ───────────────────────────────────────────

type AapKaItihasContextItem = {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
};

function AapKaItihasMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: AapKaItihasContextItem[];
}) {
  return (
    <div className="dashboard-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Institutional Memory', 'संस्थागत स्मृति')}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('Aap Ka Itihas', 'आपका इतिहास')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(
                'A personal record of your journey within Pragya Pravah, celebrating your contributions and aligning your path with the historical momentum of our civilization.',
                'प्रज्ञा प्रवाह के भीतर आपकी यात्रा का एक व्यक्तिगत अभिलेख, जो आपके योगदान का सम्मान करता है और आपके मार्ग को हमारी सभ्यता की ऐतिहासिक गतिशीलता के साथ जोड़ता है।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-context-grid">
        {contexts.map((context) => (
          <div key={context.labelEn} className="dashboard-context-card">
            <p className="shell-copy">{t(context.labelEn, context.labelHi)}</p>
            <p className="dashboard-context-value">{t(context.valueEn, context.valueHi ?? context.valueEn)}</p>
            <p className="dashboard-context-detail">{t(context.detailEn, context.detailHi)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const historyItems = [
  { date: '2026-02-15', title: 'Yuva Sangam organized', titleHi: 'युवा संगम आयोजित', unit: 'Bhopal Shahar', type: 'Event' },
  { date: '2026-01-20', title: 'Joined Prachar Aayam', titleHi: 'प्रचार आयाम में शामिल', unit: 'Bhopal', type: 'Milestone' },
  { date: '2025-12-10', title: 'Bharatiya Vigyan Pradarshani', titleHi: 'भारतीय विज्ञान प्रदर्शनी', unit: 'Raisen', type: 'Event' },
  { date: '2025-11-05', title: 'Promoted to Unit Head', titleHi: 'इकाई प्रमुख पदोन्नत', unit: 'Bhopal Shahar', type: 'Milestone' },
  { date: '2025-09-18', title: 'Samajik Samarasta Sammelan', titleHi: 'सामाजिक समरसता सम्मेलन', unit: 'Sehore', type: 'Event' },
  { date: '2025-08-15', title: 'Independence Day celebration', titleHi: 'स्वतंत्रता दिवस समारोह', unit: 'Bhopal Shahar', type: 'Event' },
  { date: '2025-06-01', title: 'Completed Karyakarta Training', titleHi: 'कार्यकर्ता प्रशिक्षण पूर्ण', unit: 'Vidisha', type: 'Milestone' },
  { date: '2025-03-22', title: 'E-Library contribution — 5 books uploaded', titleHi: 'ई-पुस्तकालय में 5 पुस्तकें अपलोड', unit: 'Bhopal', type: 'Contribution' },
  { date: '2024-12-01', title: 'First event organized as Karyakarta', titleHi: 'कार्यकर्ता के रूप में पहला कार्यक्रम', unit: 'Bhopal Shahar', type: 'Event' },
  { date: '2024-08-10', title: 'Onboarded as Karyakarta', titleHi: 'कार्यकर्ता के रूप में जुड़े', unit: 'Bhopal Shahar', type: 'Milestone' },
];

const typeConfig: Record<string, { color: string; bg: string; border: string; icon: typeof Star }> = {
  Event: { color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: CalendarDays },
  Milestone: { color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: Award },
  Contribution: { color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: BookOpen },
};

const historicalFacts = [
  { year: '1969', event: 'हिंदी सिनेमा की मशहूर अभिनेत्री मधुबाला का निधन हुआ था।', eventEn: 'Famous Hindi cinema actress Madhubala passed away.' },
  { year: '1969', event: 'प्रसिद्ध ऐतिहासिक उपन्यासकार वृंदावनलाल वर्मा का निधन हुआ।', eventEn: 'Renowned historical novelist Vrindavanlal Verma passed away.' },
  { year: '1954', event: 'बाबा हरदेव सिंह, संत निरंकारी मिशन के आध्यात्मिक गुरु का जन्म।', eventEn: 'Baba Hardev Singh, spiritual guru of Sant Nirankari Mission, was born.' },
  { year: '1468', event: 'छापेखाने के आविष्कारक जोहान गुटेनबर्ग का निधन।', eventEn: 'Johann Gutenberg, inventor of the printing press, passed away.' },
];

// ── Main Component ───────────────────────────────────────────────────────────

export default function AapKaItihas() {
  const t = useT();
  const isHi = t('en', 'hi') === 'hi';
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  // Stats
  const eventCount = historyItems.filter(i => i.type === 'Event').length;
  const milestoneCount = historyItems.filter(i => i.type === 'Milestone').length;
  const contributionCount = historyItems.filter(i => i.type === 'Contribution').length;

  const contexts: AapKaItihasContextItem[] = [
    {
      labelEn: "Service Span",
      labelHi: "सेवा अवधि",
      valueEn: "1.5 Years",
      valueHi: "१.५ वर्ष",
      detailEn: "Active contribution since August 2024.",
      detailHi: "अगस्त २०२४ से सक्रिय योगदान।",
    },
    {
      labelEn: "Current Role",
      labelHi: "वर्तमान दायित्व",
      valueEn: "Unit Head",
      valueHi: "इकाई प्रमुख",
      detailEn: "Bhopal Shahar Unit · Prachar Aayam.",
      detailHi: "भोपाल शहर इकाई · प्रचार आयाम।",
    },
    {
      labelEn: "Institutional Legacy",
      labelHi: "संस्थागत विरासत",
      valueEn: `${eventCount} Organized Events`,
      valueHi: `${eventCount} आयोजित कार्यक्रम`,
      detailEn: "Cumulative record of intellectual action.",
      detailHi: "बौद्धिक कार्य का संचयी अभिलेख।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <AapKaItihasMasthead t={t} contexts={contexts} />

      {/* ── SECTION: On This Day ─────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Historical Context', 'ऐतिहासिक संदर्भ')}</p>
            <h2 className="dashboard-section-heading">
              <Landmark className="w-5 h-5 text-primary" />
              {t('On This Day in History', 'इतिहास में आज का दिन')}
            </h2>
          </div>
          <div className="bg-muted/50 px-4 py-1.5 rounded-full border border-border/40 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {today}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {historicalFacts.map((fact, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
              <Card className="institution-panel hover-lift border-l-4 border-l-primary/40 h-full bg-background/40">
                <CardContent className="py-5 px-5 flex gap-4">
                  <div className="shrink-0">
                    <span className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
                      <span className="text-sm font-bold text-primary">{fact.year}</span>
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed ${isHi ? 'font-devanagari' : ''} text-foreground/80`}>
                    {isHi ? fact.event : fact.eventEn}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="sutra-divider" />

      {/* ── SECTION: Your Activity Timeline ───────────────────────────── */}
      <section className="space-y-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Personal Chronicle', 'व्यक्तिगत विवरणिका')}</p>
            <h2 className="dashboard-section-heading">
              <Activity className="w-5 h-5 text-emerald-500" />
              {t('Your Institutional Journey', 'आपकी संस्थागत यात्रा')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" /> {t('Growing Momentum', 'बढ़ती गति')}
            </Badge>
          </div>
        </div>

        <div className="relative pl-2 sm:pl-0">
          {/* Timeline line */}
          <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/40 via-border to-transparent" />

          <div className="space-y-5">
            {historyItems.map((item, i) => {
              const cfg = typeConfig[item.type] || typeConfig.Event;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                  className="flex gap-5 relative group"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center z-10 shrink-0 transition-all duration-300",
                    "bg-background border-2 shadow-sm group-hover:scale-110",
                    cfg.border
                  )}>
                    <Icon className={cn("w-5 h-5", cfg.color)} />
                  </div>

                  <Card className="institution-panel flex-1 hover-lift border-border/60 hover:border-primary/30 transition-all duration-300">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <h3 className={cn(
                              "font-bold text-base tracking-tight",
                              isHi ? "font-devanagari" : ""
                            )}>
                              {isHi ? item.titleHi : item.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 opacity-60" />{item.date}
                            </span>
                            <span className="flex items-center gap-1.5 bg-muted/40 px-2 py-0.5 rounded-md">
                              <MapPin className="w-3 h-3 opacity-60" />{item.unit}
                            </span>
                          </div>
                        </div>
                        <Badge className={cn("text-[9px] border-0 shrink-0 font-bold uppercase tracking-widest py-1", cfg.bg, cfg.color)}>
                          {item.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom alignment card */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
        <Card className="institution-panel border-primary/15 bg-primary/5 shadow-sm">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Compass className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left space-y-1">
              <p className="font-bold text-base font-devanagari text-foreground/90">
                {t('Aligned with the Institutional Vision', 'संस्थागत दृष्टिकोण के साथ संरेखित')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari">
                {t('Every organized event and documented thought contributes to the civilisational narrative of Pragya Pravah.', 'हर आयोजित कार्यक्रम और प्रलेखित विचार प्रज्ञा प्रवाह के सभ्यतागत कथ्य में योगदान देता है।')}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-ping" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-success">{t('Journey Continues', 'यात्रा निरंतर है')}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
