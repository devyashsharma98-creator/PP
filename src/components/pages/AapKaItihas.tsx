"use client";

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  History, CalendarDays, MapPin, CheckCircle2, Activity,
  Sparkles, Star, Clock, BookOpen, Award,
} from 'lucide-react';
import { useT } from '@/lib/useT';

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-3xl mx-auto pb-10">

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h1 className="text-2xl font-bold font-devanagari">{t("Aaj ka Itihas", "आज का इतिहास")}</h1>
        </div>
        <p className="text-muted-foreground text-sm">{today} · {t("Today in History + Your Journey", "इतिहास में आज + आपकी यात्रा")}</p>

        {/* Mini KPI strip */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: t('Events', 'कार्यक्रम'), count: eventCount, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
            { label: t('Milestones', 'उपलब्धियाँ'), count: milestoneCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: t('Contributions', 'योगदान'), count: contributionCount, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          ].map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${kpi.bg} border ${kpi.border}`}
            >
              <span className={`text-lg font-bold ${kpi.color}`}>{kpi.count}</span>
              <span className="text-[10px] text-muted-foreground font-devanagari">{kpi.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Historical Facts ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-primary/30 to-transparent" />
          <span className="text-xs uppercase tracking-widest text-primary font-semibold px-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            {t('On This Day', 'इतिहास में आज')}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-primary/30 to-transparent" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {historicalFacts.map((fact, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <Card className="glass-card hover-lift border-l-4 border-l-primary/40 h-full">
                <CardContent className="py-3.5 px-4 flex gap-3">
                  <div className="shrink-0">
                    <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                      <span className="text-sm font-bold text-primary">{fact.year}</span>
                    </span>
                  </div>
                  <p className={`text-xs leading-relaxed ${isHi ? 'font-devanagari' : ''} text-foreground/75`}>
                    {isHi ? fact.event : fact.eventEn}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Your Activity Timeline ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
          <span className="text-xs uppercase tracking-widest text-emerald-500 font-semibold px-2 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            {t('Your Journey', 'आपकी यात्रा')}
          </span>
          <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/30 to-transparent" />
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary/30 via-border to-transparent" />

          <div className="space-y-3">
            {historyItems.map((item, i) => {
              const cfg = typeConfig[item.type] || typeConfig.Event;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex gap-3 relative"
                >
                  {/* Timeline dot */}
                  <div className={`w-10 h-10 rounded-full ${cfg.bg} border-2 ${cfg.border} flex items-center justify-center z-10 shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>

                  <Card className="glass-card flex-1 hover-lift">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`text-sm font-medium ${isHi ? 'font-devanagari' : ''}`}>
                            {isHi ? item.titleHi : item.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.date}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.unit}</span>
                          </div>
                        </div>
                        <Badge className={`${cfg.bg} ${cfg.color} text-[9px] border-0 shrink-0`}>{item.type}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
