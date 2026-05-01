"use client";

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronDown, ChevronRight, Network, Crown, Shield, User,
  BookOpen, GraduationCap, FlaskConical, Tag, Building2, MapPin,
  TrendingUp, Users, Compass, Zap
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';
import { useOrgStructure } from '@/hooks/api/use-org-structure';
import { useAppContext } from '@/context/AppContext';
import { useToast } from '@/components/ToastProvider';
import { AAYAM_CONFIG, AAYAM_KIND_LABEL } from '@/lib/app/aayam-config';

// ── Data ────────────────────────────────────────────────────────────────────


const vishayas = [
  'समाजशास्त्र', 'राजनीति शास्त्र', 'अर्थशास्त्र', 'इतिहास', 'दर्शन',
  'मत पंथ अध्ययन', 'विधि', 'भूगोल', 'पर्यावरण', 'मीडिया एवं पत्रकारिता',
  'अंतर्राष्ट्रीय संबंध', 'सामाजिक सहकार', 'भारतीय भाषाएँ', 'वैश्विक भाषाएँ', 'अनुवाद',
];

// ── Sub-components ──────────────────────────────────────────────────────────

interface DayitvContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
}

function DayitvMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: DayitvContextItem[];
}) {
  return (
    <div className="dayitv-masthead space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Organizational Command', 'संगठनात्मक संचालन')}</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('Structure & Responsibility', 'संरचना एवं कार्य का स्वरूप')}
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                'A disciplined multi-tier hierarchy ensuring the flow of civilisational thought from the national level to every local unit.',
                'एक अनुशासित बहु-स्तरीय संरचना जो राष्ट्रीय स्तर से प्रत्येक स्थानीय इकाई तक सभ्यतागत चिंतन के प्रवाह को सुनिश्चित करती है।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="dayitv-context-grid">
        {contexts.map((ctx) => (
          <div key={ctx.labelEn} className="dayitv-context-card">
            <p className="shell-copy">{t(ctx.labelEn, ctx.labelHi)}</p>
            <p className="dayitv-context-value">
              {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
            </p>
            <p className="dayitv-context-detail">
              {t(ctx.detailEn, ctx.detailHi)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SutraDivider() {
  return (
    <div className="flex items-center gap-3 my-1">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <span className="text-primary/40 text-xs">✦</span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
    </div>
  );
}

interface InfoCardProps {
  icon: React.ElementType;
  titleHi: string;
  titleEn: string;
  descHi: string;
  descEn: string;
  color?: string;
  border?: string;
  bg?: string;
  pointsHi?: string[];
  pointsEn?: string[];
  isHi: boolean;
}

function InfoCard({ icon: Icon, titleHi, titleEn, descHi, descEn, color = 'text-primary', border = 'border-primary/20', bg = 'bg-primary/5', pointsHi, pointsEn, isHi }: InfoCardProps) {
  return (
    <div className={cn("institution-panel hover-lift border-t-2 transition-all duration-300", border.replace('border-', 'border-t-'))}>
      <CardContent className="pt-6 pb-6 space-y-4 px-6">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm", bg, border)}>
            <Icon className={cn("w-6 h-6", color)} />
          </div>
          <div>
            <h3 className={cn("font-bold font-devanagari text-lg leading-none", color)}>{titleHi}</h3>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">{titleEn}</p>
          </div>
        </div>
        <p className={cn("text-sm text-foreground/80 leading-relaxed", isHi ? 'font-devanagari' : '')}>
          {isHi ? descHi : descEn}
        </p>
        {(pointsHi || pointsEn) && (
          <div className="space-y-2 border-t border-border/40 pt-4 mt-2">
            {(isHi ? pointsHi : pointsEn)?.map((pt, i) => (
              <div key={i} className="flex items-start gap-3">
                <ChevronRight className={cn("w-4 h-4 mt-0.5 shrink-0", color)} />
                <span className={cn("text-[11px] md:text-xs text-foreground/70 leading-relaxed font-medium", isHi ? 'font-devanagari' : '')}>{pt}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </div>
  );
}

function DayitvSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="institution-panel border-border/60 bg-background/30">
            <CardContent className="py-5 px-6">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2 min-w-0">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Dayitv() {
  const t = useT();
  const isHi = t('en', 'hi') === 'hi';
  const { data: orgData, isLoading, error } = useOrgStructure();
  const { viewer } = useAppContext();
  const { addToast } = useToast();

  const viewerUnitId = viewer?.assignments?.find((a) => a.isPrimary)?.unitId ?? null;

  useEffect(() => {
    if (error) {
      addToast(
        isHi ? 'संरचना लोड करने में विफल' : 'Failed to load org structure',
        'error',
        isHi ? 'कृपया पुनः प्रयास करें' : 'Please try again'
      );
    }
  }, [error, addToast, isHi]);

  const vibhags = useMemo(() => {
    if (!orgData) return [];

    const orgName = orgData.org.name ?? 'Current Vibhag';
    const orgNameHi = orgData.org.nameHi ?? orgName;

    // Current vibhag with aayams
    const currentVibhag = {
      name: orgName,
      nameHi: orgNameHi,
      sanyojak: 'Shri [Name]',
      isCurrent: true,
      aayams: orgData.departments
        .filter((d) => ['yuva', 'mahila', 'shodh', 'prachar', 'vimarsh'].includes(d.departmentKind))
        .map((d) => ({
          name: AAYAM_KIND_LABEL[d.departmentKind] ?? d.name,
          pramukh: orgData.heads[d.id] ?? '[Name]',
          contact: '[Contact]',
        })),
    };

    // Other vibhags from units
    const otherVibhags = orgData.units.map((u) => ({
      name: u.name,
      nameHi: u.nameHi ?? u.name,
      sanyojak: 'Shri [Name]',
      isCurrent: u.id === viewerUnitId,
      aayams: [] as { name: string; pramukh: string; contact: string }[],
    }));

    return [currentVibhag, ...otherVibhags];
  }, [orgData, viewerUnitId]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set([orgData?.org.name ?? '']));

  // Keep expanded in sync when org data loads
  useEffect(() => {
    if (orgData?.org.name) {
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(orgData.org.name!);
        return next;
      });
    }
  }, [orgData?.org.name]);

  const toggle = (name: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const contexts: DayitvContextItem[] = [
    {
      labelEn: "Core Units",
      labelHi: "मुख्य इकाइयाँ",
      valueEn: `${vibhags.length} Vibhags`,
      valueHi: `${vibhags.length} विभाग`,
      detailEn: "Organized across regional operational centers.",
      detailHi: "क्षेत्रीय परिचालन केंद्रों में संगठित।",
    },
    {
      labelEn: "Current Goal",
      labelHi: "वर्तमान लक्ष्य",
      valueEn: "Town & College Reach",
      valueHi: "नगर एवं परिसर विस्तार",
      detailEn: "Ensuring work presence in every educational hub.",
      detailHi: "प्रत्येक शिक्षा केंद्र में कार्य उपस्थिति सुनिश्चित करना।",
    },
    {
      labelEn: "Institutional Depth",
      labelHi: "संस्थागत गहराई",
      valueEn: "Multi-level Hierarchy",
      valueHi: "बहु-स्तरीय संरचना",
      detailEn: "Flow of authority from Kshetra to local units.",
      detailHi: "क्षेत्र से स्थानीय इकाइयों तक अधिकार का प्रवाह।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <DayitvMasthead t={t} contexts={contexts} />

      {/* ── SECTION: कार्य का स्वरूप ─────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Nature of Work', 'कार्य का स्वरूप')}</p>
            <div className="space-y-1">
              <h2 className="dashboard-section-heading">
                <Network className="w-5 h-5 text-primary" />
                {t('Operational Methodology', 'परिचालन पद्धति')}
              </h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.05 }}>
            <InfoCard
              icon={Building2}
              titleHi="प्रांत और इकाई"
              titleEn="Prant & Ikai"
              color="text-amber-600 dark:text-amber-400"
              border="border-amber-500/30"
              bg="bg-amber-500/5"
              descHi="प्रत्येक प्रांत में कम से कम विभाग केंद्रों तक अवश्य कार्य हो। कार्ययुक्त नगर एवं विश्वविद्यालय/महाविद्यालय 'इकाई' कहे जाएंगे।"
              descEn="Work must reach at least up to Vibhag centres in every Prant. Active towns and universities/colleges are called 'Ikai' (Unit)."
              pointsHi={[
                'प्रत्येक प्रांत में विभाग स्तर तक कार्य अनिवार्य',
                'नगर एवं विश्वविद्यालय/महाविद्यालय = इकाई',
                'इकाई पर न्यूनतम एक अध्ययन केंद्र',
              ]}
              pointsEn={[
                'Work mandatory up to Vibhag level in every Prant',
                'Town and University/College = Ikai (unit)',
                'Minimum one Study Centre per Ikai',
              ]}
              isHi={isHi}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <InfoCard
              icon={BookOpen}
              titleHi="अध्ययन केंद्र"
              titleEn="Adhyayan Kendra"
              color="text-blue-600 dark:text-blue-400"
              border="border-blue-500/30"
              bg="bg-blue-500/5"
              descHi="इकाई पर न्यूनतम आवश्यक गतिविधि। माह में कम से कम एक बार बैठक। विषय प्रस्तुति, पुस्तक पर चर्चा आदि। एक इकाई पर एक से अधिक अध्ययन केंद्र हो सकते हैं।"
              descEn="Minimum required activity at the Ikai level. Meet at least once a month. Subject presentations, book discussions etc. Multiple study centres can exist per Ikai."
              pointsHi={[
                'मासिक बैठक — न्यूनतम एक बार',
                'विषय प्रस्तुति एवं पुस्तक चर्चा',
                'एक इकाई पर एक से अधिक केंद्र संभव',
              ]}
              pointsEn={[
                'Monthly meeting — minimum once',
                'Subject presentations & book discussions',
                'Multiple centres possible per Ikai',
              ]}
              isHi={isHi}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 }}>
            <InfoCard
              icon={GraduationCap}
              titleHi="शिक्षण केंद्र"
              titleEn="Shikshan Kendra"
              color="text-emerald-600 dark:text-emerald-400"
              border="border-emerald-500/30"
              bg="bg-emerald-500/5"
              descHi="प्रांत या नगर आदि स्तर पर शिक्षण केंद्र चलाया जाए, जहाँ किन्हीं वरिष्ठ विद्वान द्वारा विषय विशेष का शिक्षण लिया जाए।"
              descEn="A Shikshan Kendra runs at Prant or city level, where a senior scholar provides specialised instruction on specific subjects."
              pointsHi={[
                'प्रांत या नगर स्तर पर संचालन',
                'वरिष्ठ विद्वान द्वारा विषय विशेष शिक्षण',
                'अध्ययन केंद्र से उच्च स्तरीय कार्य',
              ]}
              pointsEn={[
                'Operating at Prant or city level',
                'Senior scholar provides specialised instruction',
                'Higher-level work than Adhyayan Kendra',
              ]}
              isHi={isHi}
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <InfoCard
              icon={FlaskConical}
              titleHi="विषय प्रमुख / विषय अध्ययन टोली"
              titleEn="Vishay Pramukh / Vishay Adhyayan Toli"
              color="text-violet-600 dark:text-violet-400"
              border="border-violet-500/30"
              bg="bg-violet-500/5"
              descHi="प्रांत स्तर पर प्रत्येक विषय हेतु विषय प्रमुख तय हों। विषय प्रमुख अपने विषय से सम्बंधित अध्येताओं की अध्ययन टोली विकसित करे।"
              descEn="A Vishay Pramukh (Subject Head) should be identified for each subject at Prant level. They develop a Vishay Adhyayan Toli (Subject Study Team) of researchers."
              pointsHi={[
                'प्रांत स्तर पर प्रत्येक विषय हेतु विषय प्रमुख',
                'इकाई स्तर पर भी यथासंभव विषय प्रमुख',
                'विषय अध्ययन टोली का विकास करना',
              ]}
              pointsEn={[
                'Vishay Pramukh for each subject at Prant level',
                'Also at Ikai level where possible',
                'Develop a Vishay Adhyayan Toli (subject study team)',
              ]}
              isHi={isHi}
            />
          </motion.div>
        </div>

        <Card className="institution-panel-muted p-6">
          <div className="flex items-center gap-3 mb-5">
            <Tag className="w-5 h-5 text-primary" />
            <h3 className="shell-copy font-bold">
              {t('Specialized Subject Areas (Vishay)', 'विशेषज्ञ विषय सूची')}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {vishayas.map((v, i) => (
              <Badge key={i} variant="outline" className="font-devanagari text-xs px-4 py-1.5 bg-background/60 border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all cursor-default">
                {v}
              </Badge>
            ))}
          </div>
        </Card>
      </section>

      <div className="sutra-divider" />

      {/* ── SECTION: Org Hierarchy ───────────────────────────────────── */}
      <section className="space-y-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Hierarchy', 'संगठन संरचना')}</p>
            <h2 className="dashboard-section-heading">
              <Crown className="w-5 h-5 text-amber-500" />
              {t('Institutional Authority Flow', 'संस्थागत दायित्व प्रवाह')}
            </h2>
          </div>
        </div>

        <div className="space-y-6 relative max-w-4xl mx-auto">
          {/* Kshetra */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Card className="institution-panel border-t-4 border-t-amber-500 shadow-lg bg-background/40">
              <CardContent className="pt-8 pb-8 flex items-center gap-6 px-8">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center shrink-0 shadow-sm">
                  <Crown className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1.5">
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 mb-1.5 text-[10px] tracking-[0.2em] uppercase border-0 font-bold px-2 py-0.5">
                    {t('Kshetra Level', 'क्षेत्र स्तर')}
                  </Badge>
                  <h3 className="font-bold text-xl tracking-tight">{t('Kshetriya Pramukh', 'क्षेत्रीय प्रमुख')}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{t('Shri [Name] · Madhya Kshetra', 'श्री [नाम] · मध्य क्षेत्र')}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center gap-2">
              <div className="w-0.5 h-10 bg-gradient-to-b from-amber-500/50 via-border to-blue-500/50" />
              <ChevronDown className="w-5 h-5 text-muted-foreground/60 animate-bounce" />
            </div>
          </div>

          {/* Prant */}
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <Card className="institution-panel border-t-4 border-t-blue-500 shadow-lg bg-background/40">
              <CardContent className="pt-8 pb-8 flex items-center gap-6 px-8">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center shrink-0 shadow-sm">
                  <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="space-y-1.5">
                  <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 mb-1.5 text-[10px] tracking-[0.2em] uppercase border-0 font-bold px-2 py-0.5">
                    {t('Prant Level', 'प्रांत स्तर')}
                  </Badge>
                  <h3 className="font-bold text-xl tracking-tight">{t('Prant Sanyojak', 'प्रांत संयोजक')}</h3>
                  <p className="text-sm text-muted-foreground font-medium">{t('Shri Digvijay Chaturvedi · Madhya Bharat Prant', 'श्री दिग्विजय चतुर्वेदी · मध्यभारत प्रांत')}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="flex justify-center py-2">
            <div className="flex flex-col items-center gap-2">
              <div className="w-0.5 h-10 bg-gradient-to-b from-blue-500/50 via-border to-primary/50" />
              <ChevronDown className="w-5 h-5 text-muted-foreground/60" />
            </div>
          </div>

          {/* Vibhags */}
          <div className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-bold text-lg font-devanagari tracking-tight">
                {t(`Vibhag Level — ${vibhags.length} Operational Vibhags`, `विभाग स्तर — ${vibhags.length} सक्रिय विभाग`)}
              </h2>
            </div>

            {isLoading ? (
              <DayitvSkeleton />
            ) : error ? (
              <div className="text-center py-20 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
                <Users className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
                  {t('Unable to load structure.', 'संरचना लोड करने में असमर्थ।')}
                </p>
                <Button variant="link" onClick={() => window.location.reload()} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                  {t('Retry', 'पुनः प्रयास करें')}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {vibhags.map((vibhag, i) => {
                  const isOpen = expanded.has(vibhag.name);
                  return (
                    <motion.div
                      key={vibhag.name}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <Card className={cn(
                        "institution-panel overflow-hidden transition-all duration-300",
                        vibhag.isCurrent ? "border-primary/40 shadow-lg ring-1 ring-primary/10" : "hover:border-primary/30",
                        isOpen && "ring-1 ring-primary/20 bg-background/40"
                      )}>
                        <button
                          className="w-full text-left"
                          onClick={() => vibhag.aayams.length > 0 && toggle(vibhag.name)}
                        >
                          <CardHeader className="py-5 px-6">
                            <div className="flex items-center justify-between gap-4">
                              <div className="space-y-2 min-w-0">
                                <div className="flex items-center gap-3">
                                  <h3 className="font-bold text-base font-devanagari text-foreground/90 tracking-tight truncate">
                                    {isHi ? vibhag.nameHi : vibhag.name}
                                  </h3>
                                  {vibhag.isCurrent && (
                                    <Badge className="text-[10px] bg-primary/10 text-primary px-2 py-0 border-0 font-bold uppercase tracking-widest">
                                      {t('Current', 'वर्तमान')}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-[11px] md:text-xs text-muted-foreground flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 opacity-60" />
                                  {t('Vibhag Sanyojak', 'विभाग संयोजक')}: <span className="text-foreground/80 font-semibold">{vibhag.sanyojak}</span>
                                </p>
                              </div>
                              {vibhag.aayams.length > 0 && (
                                <div className={cn(
                                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm shrink-0",
                                  isOpen ? "bg-primary/10 text-primary" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                )}>
                                  {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </div>
                              )}
                            </div>
                          </CardHeader>
                        </button>

                        <AnimatePresence>
                          {isOpen && vibhag.aayams.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-border/50 px-6 pb-6 pt-4 space-y-4 bg-muted/10">
                                <p className="shell-copy font-bold text-[10px]">{t('Aayam Responsibilities', 'आयाम दायित्व टोली')}</p>
                                <div className="grid gap-2.5">
                                  {vibhag.aayams.map(aayam => (
                                    <div
                                      key={aayam.name}
                                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 px-4 rounded-2xl bg-background/70 border border-border/50 hover:border-primary/30 transition-all shadow-sm group"
                                    >
                                      <div className="flex items-center gap-4">
                                        <Badge className={cn("text-[10px] border-0 shrink-0 font-bold min-w-[70px] justify-center py-1 tracking-widest uppercase", AAYAM_CONFIG[aayam.name]?.dayitvChip)}>
                                          {aayam.name}
                                        </Badge>
                                        <span className="text-sm font-bold text-foreground/90 group-hover:text-primary transition-colors">{aayam.pramukh}</span>
                                      </div>
                                      <div className="flex items-center gap-2 pl-2 sm:pl-0 bg-muted/40 sm:bg-transparent rounded-lg p-1.5 sm:p-0">
                                        <Zap className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary/60" />
                                        <span className="text-xs text-muted-foreground font-mono font-medium">{aayam.contact}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom context alignment */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }} className="pt-4">
        <Card className="institution-panel border-blue-500/15 bg-blue-500/5 shadow-sm overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <CardContent className="py-8 flex flex-col md:flex-row items-center gap-8 px-8 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
              <Compass className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1 text-center md:text-left space-y-2">
              <p className="font-bold text-lg font-devanagari text-foreground/90">
                {t('Systematic Flow of Responsibility', 'दायित्व का व्यवस्थित प्रवाह')}
              </p>
              <p className="text-sm text-muted-foreground font-devanagari leading-relaxed max-w-2xl">
                {t('The structural integrity of Pragya Pravah ensures that every discourse and decision is implemented with precision across all active units.', 'प्रज्ञा प्रवाह की संरचनात्मक अखंडता सुनिश्चित करती है कि प्रत्येक विमर्श और निर्णय को सभी सक्रिय इकाइयों में सटीकता के साथ लागू किया जाए।')}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3 bg-background/50 px-4 py-2 rounded-full border border-blue-500/20 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-blue-600">{t('Operational Sync', 'परिचालन समन्वय')}</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
