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

interface HistoryContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
}

function HistoryMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: HistoryContextItem[];
}) {
  return (
    <div className="history-masthead space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Institutional Memory', 'संस्थागत स्मृति')}</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('Aap Ka Itihas', 'आपका इतिहास')}
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                'A personal record of your journey within Pragya Pravah, celebrating your contributions and aligning your path with the historical momentum of our civilization.',
                'प्रज्ञा प्रवाह के भीतर आपकी यात्रा का एक व्यक्तिगत अभिलेख, जो आपके योगदान का सम्मान करता है और आपके मार्ग को हमारी सभ्यता की ऐतिहासिक गतिशीलता के साथ जोड़ता है।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="history-context-grid">
        {contexts.map((ctx) => (
          <div key={ctx.labelEn} className="history-context-card">
            <p className="shell-copy">{t(ctx.labelEn, ctx.labelHi)}</p>
            <p className="history-context-value">
              {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
            </p>
            <p className="history-context-detail">
              {t(ctx.detailEn, ctx.detailHi)}
            </p>
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

  const contexts: HistoryContextItem[] = [
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
      <HistoryMasthead t={t} contexts={contexts} />

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
          <div className="bg-muted/50 px-5 py-2 rounded-2xl border border-border/60 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] shadow-inner">
            {today}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {historicalFacts.map((fact, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
              <Card className="institution-panel hover-lift group border-l-4 border-l-primary/40 h-full bg-background/30 transition-all duration-500 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
                <CardContent className="py-6 px-6 flex gap-5 relative z-10">
                  <div className="shrink-0">
                    <div className="inline-flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                      <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest leading-none mb-1">Year</span>
                      <span className="text-lg font-bold text-primary leading-none">{fact.year}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-px w-8 bg-primary/30" />
                    <p className={`text-sm md:text-base leading-relaxed ${isHi ? 'font-devanagari' : ''} text-foreground/80 font-medium`}>
                      {isHi ? fact.event : fact.eventEn}
                    </p>
                  </div>
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
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.2em] bg-emerald-500/5 text-emerald-600 border-emerald-500/20 px-3 py-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1.5" /> {t('Growing Momentum', 'बढ़ती गति')}
            </Badge>
          </div>
        </div>

        <div className="relative pl-4 sm:pl-0 max-w-4xl mx-auto">
          {/* Timeline line */}
          <div className="absolute left-[23px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary via-border to-transparent opacity-30" />

          <div className="space-y-8">
            {historyItems.map((item, i) => {
              const cfg = typeConfig[item.type] || typeConfig.Event;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + i * 0.03 }}
                  className="flex flex-col sm:flex-row gap-6 sm:gap-8 relative group"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center z-10 shrink-0 transition-all duration-500",
                    "bg-background border-2 shadow-md group-hover:scale-110 group-hover:rotate-12 ml-[1px] sm:ml-0",
                    cfg.border
                  )}>
                    <Icon className={cn("w-6 h-6", cfg.color)} />
                  </div>

                  <Card className="institution-panel flex-1 hover-lift border-border/60 hover:border-primary/30 transition-all duration-500 bg-background/40">
                    <CardContent className="py-6 px-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <Badge className={cn("text-[9px] border-0 shrink-0 font-bold uppercase tracking-[0.2em] py-1 px-2.5 mb-2", cfg.bg, cfg.color)}>
                              {item.type}
                            </Badge>
                            <h3 className={cn(
                              "font-bold text-lg md:text-xl tracking-tight text-foreground/90",
                              isHi ? "font-devanagari" : ""
                            )}>
                              {isHi ? item.titleHi : item.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-5 text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">
                            <span className="flex items-center gap-2 bg-muted/50 px-2.5 py-1 rounded-lg border border-border/40">
                              <Clock className="w-3.5 h-3.5 opacity-60 text-primary/60" />{item.date}
                            </span>
                            <span className="flex items-center gap-2 bg-muted/50 px-2.5 py-1 rounded-lg border border-border/40">
                              <MapPin className="w-3.5 h-3.5 opacity-60 text-primary/60" />{item.unit}
                            </span>
                          </div>
                        </div>
                        
                        <div className="hidden md:block">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity", cfg.bg)}>
                            <CheckCircle2 className={cn("w-5 h-5", cfg.color)} />
                          </div>
                        </div>
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
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="pt-6">
        <Card className="institution-panel border-primary/20 bg-primary/5 shadow-lg overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-primary/15 transition-colors" />
          <CardContent className="py-10 flex flex-col md:flex-row items-center gap-8 px-10 relative z-10">
            <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 shadow-inner group-hover:rotate-12 transition-transform duration-700">
              <Landmark className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <p className="font-bold text-xl font-devanagari text-foreground/90 tracking-tight">
                {t('Aligned with the Institutional Vision', 'संस्थागत दृष्टिकोण के साथ संरेखित')}
              </p>
              <p className="text-base text-muted-foreground font-devanagari leading-relaxed max-w-3xl">
                {t('Every organized event and documented thought contributes to the civilisational narrative of Pragya Pravah. Your journey is a vital thread in the unfolding history of Bharatiya resurgence.', 'हर आयोजित कार्यक्रम और प्रलेखित विचार प्रज्ञा प्रवाह के सभ्यतागत कथ्य में योगदान देता है। आपकी यात्रा भारतीय पुनर्जागरण के उभरते इतिहास में एक महत्वपूर्ण सूत्र है।')}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3 bg-background/60 px-5 py-2.5 rounded-full border border-primary/20 shadow-sm">
              <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-success">{t('Journey Continues', 'यात्रा निरंतर है')}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
