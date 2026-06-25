"use client";

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PragyaLogo } from '@/components/PragyaLogo';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, ChevronDown, ChevronRight, ExternalLink, Play, BookOpen,
  Swords, Shield, Target, MessagesSquare, AlertTriangle, Globe,
  TrendingUp, Library, Sparkles, Compass, Copy, PenLine
} from 'lucide-react';
import { useT } from '@/lib/useT';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useVimarshTopics } from '@/hooks/api/use-vimarsh-topics';
import { useToast } from '@/components/ToastProvider';

// Resource type → display config
const RESOURCE_TYPE_CONFIG: Record<string, { label: string; labelHi: string; icon: typeof ExternalLink; color: string }> = {
  article: { label: 'Articles', labelHi: 'लेख', icon: ExternalLink, color: 'text-primary' },
  video: { label: 'Videos', labelHi: 'वीडियो', icon: Play, color: 'text-destructive' },
  book: { label: 'E-Library', labelHi: 'ई-पुस्तकालय', icon: BookOpen, color: 'text-success' },
};

// Group config for theming API groups
const GROUP_CONFIG: Record<string, { labelHi: string; labelEn: string; icon: typeof Target; color: string; border: string; bg: string }> = {
  atma_bodh: { labelHi: 'आत्म बोध', labelEn: 'Self-Awareness', icon: Target, color: 'text-orange-500', border: 'border-orange-500/25', bg: 'bg-orange-500/8' },
  forces_of_division: { labelHi: 'विभाजन की शक्तियाँ', labelEn: 'Forces of Division', icon: AlertTriangle, color: 'text-red-500', border: 'border-red-500/25', bg: 'bg-red-500/8' },
  targeted_groups: { labelHi: 'सामाजिक अलगाव के लक्षित समूह', labelEn: 'Targeted Groups', icon: Shield, color: 'text-blue-500', border: 'border-blue-500/25', bg: 'bg-blue-500/8' },
  targeted_regions: { labelHi: 'भौगोलिक अलगाव के लक्षित क्षेत्र', labelEn: 'Targeted Regions', icon: Globe, color: 'text-emerald-500', border: 'border-emerald-500/25', bg: 'bg-emerald-500/8' },
  other: { labelHi: 'अन्य', labelEn: 'Other', icon: Library, color: 'text-violet-500', border: 'border-violet-500/25', bg: 'bg-violet-500/8' },
};

interface VimarshContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
}

function VimarshMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: VimarshContextItem[];
}) {
  const [flip, setFlip] = useState<'en' | 'hi'>('en');
  useEffect(() => {
    const id = setInterval(() => setFlip((v) => (v === 'en' ? 'hi' : 'en')), 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="vimarsh-masthead relative space-y-6 overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-background to-background p-6 md:p-8">
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="relative inline-flex items-center justify-center h-10 w-10 shrink-0">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full bg-primary/25 blur-md"
                animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-gradient-to-br from-[#ffdcc6] via-[#f57c00] to-[#964900] shadow-[0_10px_24px_-12px_rgba(150,73,0,0.55)] ring-1 ring-primary/15">
                <PragyaLogo className="h-7 w-7 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
              </span>
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-muted-foreground">
                {t('Vimarsh Command Center', 'विमर्श संचालन कक्ष')}
              </p>
              <p className="text-[10px] uppercase tracking-[0.32em] text-primary/80 font-bold mt-0.5">
                Bharat · भारत
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative block h-10 md:h-12 overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                {flip === 'en' ? (
                  <motion.h1
                    key="en"
                    className="absolute inset-0 font-sans text-3xl md:text-4xl font-bold tracking-tight text-foreground"
                    initial={{ y: 18, opacity: 0, filter: 'blur(4px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -18, opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    Discourse, Assertion &amp; Counter
                  </motion.h1>
                ) : (
                  <motion.h1
                    key="hi"
                    className="absolute inset-0 text-3xl md:text-4xl font-bold tracking-tight text-foreground font-devanagari"
                    initial={{ y: 18, opacity: 0, filter: 'blur(4px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    exit={{ y: -18, opacity: 0, filter: 'blur(4px)' }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    lang="hi"
                  >
                    विमर्श, मंडन एवं खंडन
                  </motion.h1>
                )}
              </AnimatePresence>
            </div>
            <div className="relative h-[2px] w-40 overflow-hidden rounded-full bg-primary/15">
              <motion.span
                className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ x: ['-100%', '300%'] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
              />
            </div>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                'Shape the narrative, affirm the civilisational truth, and counter misinformation through disciplined intellectual action.',
                'कथ्य को आकार दें, सभ्यतागत सत्य का मंडन करें और अनुशासित बौद्धिक कार्य के माध्यम से कुप्रचार का खंडन करें।',
              )}
            </p>
          </div>
        </div>

        <div className="home-sequence-strip shrink-0 self-start">
          <span>{t('Observe', 'अवलोकन')}</span>
          <span>•</span>
          <span>{t('Analyze', 'विश्लेषण')}</span>
          <span>•</span>
          <span>{t('Respond', 'प्रतिसाद')}</span>
        </div>
      </div>

      <div className="vimarsh-context-grid relative">
        {contexts.map((ctx, i) => (
          <motion.div
            key={ctx.labelEn}
            className="vimarsh-context-card relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="absolute left-0 top-0 h-full w-[3px] bg-gradient-to-b from-primary via-primary/60 to-transparent" aria-hidden />
            <p className="shell-copy">{t(ctx.labelEn, ctx.labelHi)}</p>
            <p className="vimarsh-context-value">
              {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
            </p>
            <p className="vimarsh-context-detail">{t(ctx.detailEn, ctx.detailHi)}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function VimarshBinduSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="institution-panel border-border/60 bg-background/30">
          <CardContent className="pt-6 pb-6 space-y-5">
            <div className="flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-start gap-3">
                  <Skeleton className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function Vimarsh() {
  const tr = useT();
  const { data: topicGroups, isLoading, error } = useVimarshTopics();
  
  // Flatten topicGroups for the explorer
  const vimarshTopics = useMemo(() => {
    if (topicGroups && topicGroups.length > 0) {
      return topicGroups.flatMap(g => g.topics).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        sortOrder: t.sortOrder,
        resources: t.resources,
      }));
    }
    return [];
  }, [topicGroups]);
  const { addToast } = useToast();
  const isHi = tr('en', 'hi') === 'hi';
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const copyTopicBrief = async (topic: { title: string; description?: string | null; resources: { title: string; url: string }[] }) => {
    const brief = [
      `Topic: ${topic.title}`,
      topic.description,
      topic.resources.length > 0 ? 'Resources:' : null,
      ...topic.resources.slice(0, 5).map((resource) => `- ${resource.title}: ${resource.url}`),
    ].filter(Boolean).join('\n');

    await navigator.clipboard?.writeText(brief);
    addToast(tr('Topic brief copied', 'Topic brief copied'), 'success');
  };

  useEffect(() => {
    if (error) {
      addToast(
        tr('Failed to load discourse topics', 'विमर्श विषय लोड करने में विफल'),
        'error',
      );
    }
  }, [error, addToast, tr]);

  const filtered = useMemo(() => vimarshTopics.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    (t.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
  ), [vimarshTopics, search]);

  const contexts: VimarshContextItem[] = [
    {
      labelEn: "Core Framework",
      labelHi: "मूल ढाँचा",
      valueEn: "Mandan-Khandan",
      valueHi: "मंडन-खंडन",
      detailEn: "Restoring truth while countering divisive narratives.",
      detailHi: "सत्य की पुनर्स्थापना और नकारात्मक विमर्शों का उत्तर।",
    },
    {
      labelEn: "Active Topics",
      labelHi: "सक्रिय विषय",
      valueEn: `${vimarshTopics.length} Operational Topics`,
      valueHi: `${vimarshTopics.length} परिचालन विषय`,
      detailEn: "Curated discourse points for institutional focus.",
      detailHi: "संस्थागत विमर्श हेतु निर्धारित मुख्य बिंदु।",
    },
    {
      labelEn: "Institutional Role",
      labelHi: "संस्थागत भूमिका",
      valueEn: "Narrative Engagement",
      valueHi: "कथ्य एवं विमर्श संचालन",
      detailEn: "Translating civilisational values into public thought.",
      detailHi: "सभ्यतागत मूल्यों को सार्वजनिक चिंतन में परिवर्तित करना।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <VimarshMasthead t={tr} contexts={contexts} />

      {/* ── SECTION: Mandan-Khandan Framework ─────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{tr('Strategic Framework', 'रणनीतिक ढाँचा')}</p>
            <div className="space-y-1">
              <h2 className="dashboard-section-heading">
                <Shield className="w-5 h-5 text-primary" />
                {tr('Mandan-Khandan: The Narrative Strategy', 'मंडन-खंडन: विमर्श की रणनीति')}
              </h2>
            </div>
          </div>
          <div className="home-sequence-strip">
            <span>{tr('Observe', 'अवलोकन')}</span>
            <span>•</span>
            <span>{tr('Analyze', 'विश्लेषण')}</span>
            <span>•</span>
            <span>{tr('Respond', 'प्रतिसाद')}</span>
          </div>
        </div>

        <Card className="institution-panel overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-violet-500 to-red-500" />
          <CardContent className="pt-8 pb-8 space-y-8 px-6 md:px-8">
            <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground md:text-base">
              {tr(
                'The intellectual methodology of Pragya Pravah involves two simultaneous actions: affirming our civilisational identity and countering ideological distortions.',
                'प्रज्ञा प्रवाह की बौद्धिक कार्यपद्धति में दो समानांतर क्रियाएं शामिल हैं: अपनी सभ्यतागत पहचान का मंडन और वैचारिक विकृतियों का खंडन।'
              )}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-4 group hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-devanagari font-bold text-xl text-emerald-700 dark:text-emerald-300 leading-none">मंडन</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">Assertion · Affirmation</p>
                  </div>
                </div>
                <p className={`text-sm md:text-base text-foreground/75 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                  {isHi
                    ? 'सत्य का, भारत की परंपरा का, और भारतीय दृष्टि का सार्थक मंडन करना। तथ्यों की पुनर्स्थापना और स्व-बोध का जागरण।'
                    : 'Affirming truth, India\'s tradition and the Bharatiya worldview. Restoration of civilisational facts and awakening of self-consciousness.'}
                </p>
              </div>

              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4 group hover:border-red-500/40 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Swords className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-devanagari font-bold text-xl text-red-700 dark:text-red-300 leading-none">खंडन</h3>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">Counter · Deconstruction</p>
                  </div>
                </div>
                <p className={`text-sm md:text-base text-foreground/75 leading-relaxed ${isHi ? 'font-devanagari' : ''}`}>
                  {isHi
                    ? 'भारत एवं विश्व में चल रहे कुप्रचार का तथ्यात्मक खंडन करना। औपनिवेशिक एवं विभाजनकारी विमर्शों का तार्किक प्रत्युत्तर।'
                    : 'Factual counter of anti-India propaganda. Logical response to colonial and divisive narratives through rigorous research and data.'}
                </p>
              </div>
            </div>
            
            <div className="sutra-divider" />
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground bg-muted/30 p-5 rounded-2xl border border-border/50">
              <Compass className="w-6 h-6 text-violet-500 shrink-0" />
              <p className={cn("leading-relaxed", isHi ? 'font-devanagari' : '')}>
                {isHi
                  ? 'विमर्श का यह मूल ढाँचा कार्यकर्ताओं को वैचारिक स्पष्टता प्रदान करता है, जिससे वे अपने दायित्व का निर्वहन प्रभावी ढंग से कर सकें।'
                  : 'This core framework provides workers with ideological clarity, enabling them to fulfill their responsibilities effectively.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── SECTION: Vimarsh Bindu (API-driven) ─────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{tr('Discourse Points', 'विमर्श बिंदु')}</p>
            <h2 className="dashboard-section-heading">
              <Target className="w-5 h-5 text-primary" />
              {tr('Thematic Focus Areas', 'विमर्श के मुख्य क्षेत्र')}
            </h2>
          </div>
        </div>

        {isLoading && <VimarshBinduSkeleton />}

        {!isLoading && topicGroups && topicGroups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {topicGroups.map((group, gi) => {
              const config = GROUP_CONFIG[group.group] ?? GROUP_CONFIG.other;
              const Icon = config.icon;
              return (
                <motion.div
                  key={group.group}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: gi * 0.05 }}
                >
                  <Card className={cn("institution-panel h-full hover-lift transition-all duration-300", config.border, config.bg)}>
                    <CardContent className="pt-6 pb-6 space-y-5">
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-2xl border flex items-center justify-center shadow-sm", config.bg, config.border)}>
                          <Icon className={cn("w-6 h-6", config.color)} />
                        </div>
                        <div>
                          <h4 className={cn("font-bold text-lg font-devanagari leading-none", config.color)}>
                            {isHi ? config.labelHi : config.labelEn}
                          </h4>
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1.5">
                            {isHi ? config.labelEn : config.labelHi}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {group.topics.map((topic) => (
                          <div key={topic.id} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-background/60 transition-colors border border-transparent hover:border-border/40">
                            <ChevronRight className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
                            <div className="space-y-1 min-w-0">
                              <span className="font-devanagari text-sm font-semibold text-foreground/90">
                                {isHi ? (topic.titleHi || topic.title) : topic.title}
                              </span>
                              {((isHi ? topic.descriptionHi : topic.description) || topic.description) && (
                                <p className="text-[11px] text-muted-foreground leading-relaxed">
                                  {isHi
                                    ? (topic.descriptionHi || topic.description || '')
                                    : (topic.description || topic.descriptionHi || '')
                                  }
                                </p>
                              )}
                              {topic.resources.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {topic.resources.slice(0, 3).map((r) => (
                                    <a
                                      key={r.id}
                                      href={r.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[10px] px-2 py-0.5 rounded-full bg-primary/5 text-primary border border-primary/10 hover:bg-primary/10 transition-colors"
                                    >
                                      {r.title}
                                    </a>
                                  ))}
                                  {topic.resources.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground px-1">
                                      +{topic.resources.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {!isLoading && (!topicGroups || topicGroups.length === 0) && (
          <div className="text-center py-24 bg-muted/30 rounded-[2rem] border border-dashed border-border/80">
            <Target className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
            <p className="text-base font-devanagari text-muted-foreground font-medium">
              {tr('No discourse topics available yet.', 'अभी कोई विमर्श विषय उपलब्ध नहीं।')}
            </p>
          </div>
        )}
      </section>

      {/* ── SECTION: Topic Explorer ───────────────────────────────────── */}
      <section className="space-y-6 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-t border-border/50 pt-10">
          <div className="space-y-2">
            <p className="section-seal">{tr('Operational Layer', 'परिचालन स्तर')}</p>
            <h2 className="dashboard-section-heading">
              <BookOpen className="w-5 h-5 text-primary" />
              {tr(`Operational Topics (${vimarshTopics.length})`, `परिचालन विषय (${vimarshTopics.length})`)}
            </h2>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tr('Search topics...', 'विषय खोजें...')}
              className="pl-11 h-11 rounded-2xl bg-background/50 border-border/70 focus:border-primary/40 focus:ring-primary/10 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filtered.map((topic, i) => {
            const grouped = topic.resources.reduce<Record<string, typeof topic.resources>>((acc, r) => {
              (acc[r.resourceType] ??= []).push(r);
              return acc;
            }, {});
            const types = Object.keys(grouped);

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(
                  "institution-panel overflow-hidden transition-all duration-300",
                  expanded === topic.id ? "ring-1 ring-primary/30 shadow-lg" : "hover:border-primary/40"
                )}>
                  <button
                    className="w-full text-left"
                    onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                  >
                    <CardContent className="py-5 px-6 flex items-center gap-5">
                      <span className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0 shadow-inner">
                        {topic.sortOrder}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base font-devanagari text-foreground/90 tracking-tight">{topic.title}</h3>
                        {topic.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{topic.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-[11px] bg-muted/40 border-border/60 px-2.5 py-0.5 font-medium">
                          {topic.resources.length} {tr('resources', 'संसाधन')}
                        </Badge>
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                          expanded === topic.id ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground"
                        )}>
                          {expanded === topic.id
                            ? <ChevronDown className="w-5 h-5 shrink-0" />
                            : <ChevronRight className="w-5 h-5 shrink-0" />
                          }
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  <AnimatePresence>
                    {expanded === topic.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/50 px-8 py-8 bg-muted/10 space-y-6">
                          {topic.description && (
                            <div className="space-y-3">
                              <p className="shell-copy font-bold">{tr('Context & Objective', 'संदर्भ एवं उद्देश्य')}</p>
                              <div className="text-sm md:text-base text-foreground/80 leading-relaxed bg-background/60 p-6 rounded-2xl border border-border/50 shadow-sm">
                                {topic.description}
                              </div>
                            </div>
                          )}
                          
                          <div className="space-y-4">
                            <p className="shell-copy font-bold">{tr('Institutional Resources', 'संस्थागत संसाधन')}</p>
                            {types.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic font-devanagari py-4">{tr('No resources yet.', 'अभी कोई संसाधन नहीं।')}</p>
                            ) : (
                              <div className={`grid grid-cols-1 gap-8 ${types.length >= 3 ? 'lg:grid-cols-3' : types.length === 2 ? 'md:grid-cols-2' : ''}`}>
                                {types.map(type => {
                                  const config = RESOURCE_TYPE_CONFIG[type] ?? { label: type, labelHi: type, icon: ExternalLink, color: 'text-muted-foreground' };
                                  const Icon = config.icon;
                                  return (
                                    <div key={type} className="space-y-4">
                                      <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2.5 text-foreground/70">
                                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center bg-background border border-border/40", config.color.replace('text-', 'bg-') + '/10')}>
                                          <Icon className={cn("w-3.5 h-3.5", config.color)} />
                                        </div>
                                        {tr(config.label, config.labelHi)}
                                      </h4>
                                      <div className="space-y-2.5">
                                        {grouped[type].map(r => (
                                          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                                            className="group flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20">
                                            <ExternalLink className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-all mt-0.5 shrink-0" />
                                            <span className="text-sm text-primary hover:underline leading-relaxed font-medium">
                                              {r.title}
                                            </span>
                                          </a>
                                        ))}
                                      </div>
                                      {type === 'book' && (
                                        <Link href="/library" className="block pt-2">
                                          <Button variant="ghost" size="sm" className="text-xs h-9 w-full rounded-xl bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500/10 border border-emerald-500/20 font-semibold">
                                            {tr('Open E-Library →', 'ई-पुस्तकालय खोलें →')}
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 border-t border-border/50 pt-5 sm:flex-row sm:flex-wrap">
                            <Link href={`/charcha?topic=${encodeURIComponent(topic.title)}`} className="w-full sm:w-auto">
                              <Button className="w-full sm:w-auto gap-2" size="sm">
                                <MessagesSquare className="h-4 w-4" />
                                {tr('Start Charcha', 'Start Charcha')}
                              </Button>
                            </Link>
                            <Link href={`/aalekh?topic=${encodeURIComponent(topic.title)}`} className="w-full sm:w-auto">
                              <Button variant="outline" className="w-full sm:w-auto gap-2" size="sm">
                                <PenLine className="h-4 w-4" />
                                {tr('Draft Aalekh', 'Draft Aalekh')}
                              </Button>
                            </Link>
                            <Button variant="outline" className="w-full sm:w-auto gap-2" size="sm" onClick={() => void copyTopicBrief(topic)}>
                              <Copy className="h-4 w-4" />
                              {tr('Copy brief', 'Copy brief')}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-24 bg-muted/30 rounded-[2rem] border border-dashed border-border/80">
              <Search className="w-16 h-16 mx-auto text-muted-foreground/20 mb-6" />
              <p className="text-base font-devanagari text-muted-foreground font-medium">
                {search
                  ? tr(`No topics matching "${search}"`, `"${search}" से मेल खाता कोई विषय नहीं`)
                  : tr('No topics available yet.', 'अभी कोई विषय उपलब्ध नहीं।')}
              </p>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
