"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Share2, CalendarDays, MapPin, BookOpen, ArrowRight,
  MessagesSquare, ExternalLink, TrendingUp, Newspaper, Flame,
  Clock, Eye, Sparkles, Compass, Library
} from 'lucide-react';
import { useMemo } from 'react';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';
import { useDashboardEvents } from '@/hooks/api/use-dashboard';
import { useDashboardArticles } from '@/hooks/api/use-dashboard-articles';

interface FeedContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
}

function ContentFeedMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: FeedContextItem[];
}) {
  return (
    <div className="feed-masthead space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Public Intellectual Record', 'सार्वजनिक बौद्धिक अभिलेख')}</p>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              {t('Aalekh & Shodh Feed', 'आलेख एवं शोध फ़ीड')}
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                'A combined chronicle of institutional activities and scholarly research, providing a window into the intellectual momentum of Pragya Pravah.',
                'संस्थागत गतिविधियों और विद्वत्तापूर्ण शोध का एक संयुक्त विवरण, जो प्रज्ञा प्रवाह की बौद्धिक गतिशीलता का प्रतिबिंब है।'
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="feed-context-grid">
        {contexts.map((ctx) => (
          <div key={ctx.labelEn} className="feed-context-card">
            <p className="shell-copy">{t(ctx.labelEn, ctx.labelHi)}</p>
            <p className="feed-context-value">
              {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
            </p>
            <p className="feed-context-detail">
              {t(ctx.detailEn, ctx.detailHi)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ContentFeed() {
  const { lang } = useAppContext();
  const { data: events = [] } = useDashboardEvents();
  const { data: articles = [] } = useDashboardArticles();
  
  const t = useT();
  const isHi = lang === 'hi';
  const publishedEvents = useMemo(() => events.filter(e => e.status === 'Published'), [events]);
  const publishedArticles = useMemo(() => articles.filter(a => a.status === 'Published'), [articles]);

  const handleShare = (title: string) => {
    const text = encodeURIComponent(`Check out: ${title} - Pragya Pravah, Bhopal Vibhag`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const allItems = useMemo(() => [
    ...publishedEvents.map(e => ({ type: 'event' as const, ...e })),
    ...publishedArticles.map(a => ({ type: 'article' as const, ...a })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [publishedEvents, publishedArticles]);

  const contexts: FeedContextItem[] = [
    {
      labelEn: "Archive Status",
      labelHi: "अभिलेख स्थिति",
      valueEn: `${allItems.length} Published Items`,
      valueHi: `${allItems.length} प्रकाशित प्रविष्टियाँ`,
      detailEn: "Gatividhi events and scholarly aalekh archived together.",
      detailHi: "गतिविधि कार्यक्रम और विद्वत्तापूर्ण आलेख एक साथ संग्रहित।",
    },
    {
      labelEn: "Current Momentum",
      labelHi: "वर्तमान गति",
      valueEn: allItems.length > 0 ? allItems[0].date : "No activity",
      valueHi: allItems.length > 0 ? allItems[0].date : "कोई गतिविधि नहीं",
      detailEn: "Reflecting the latest intellectual output from the vibhag.",
      detailHi: "विभाग के नवीनतम बौद्धिक कार्य का प्रतिबिंब।",
    },
    {
      labelEn: "Institutional Record",
      labelHi: "संस्थागत अभिलेख",
      valueEn: "Combined Chronicle",
      valueHi: "संयुक्त इतिहास",
      detailEn: "A public window into organizational thought and action.",
      detailHi: "संगतात्मक चिंतन और कार्य का एक सार्वजनिक झरोखा।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <ContentFeedMasthead t={t} contexts={contexts} />

      {/* Featured / Latest */}
      {allItems.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="section-seal">{t('Latest Insight', 'नवीनतम विमर्श')}</span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="institution-panel overflow-hidden border-primary/20 shadow-xl bg-background/40">
              <div className="h-2 bg-gradient-to-r from-orange-500 via-primary to-violet-500" />
              <CardContent className="pt-8 pb-8 px-6 md:px-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-0 text-[10px] gap-1.5 font-bold uppercase tracking-[0.2em] px-3 py-1">
                      <Flame className="w-3.5 h-3.5" /> {t('Featured', 'प्रमुख')}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-[0.16em] bg-background/80 border-border/60 px-3 py-1">
                      {allItems[0].type === 'event' ? t('Gatividhi', 'गतिविधि') : ((allItems[0] as unknown as Record<string, string>).category || t('Aalekh', 'आलेख'))}
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="h-9 gap-2 rounded-xl bg-background/50 border-border/60 hover:bg-success/5 hover:text-success hover:border-success/30 transition-all text-xs" onClick={() => handleShare(allItems[0].title)}>
                    <Share2 className="w-3.5 h-3.5" /> {t('Share Entry', 'साझा करें')}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <h2 className="font-bold text-2xl md:text-3xl leading-snug tracking-tight font-devanagari">{allItems[0].title}</h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-4xl font-devanagari">
                    {allItems[0].type === 'event' ? (allItems[0] as unknown as Record<string, string>).description : (allItems[0] as unknown as Record<string, string>).summary}
                  </p>
                </div>

                <div className="flex items-center gap-x-6 gap-y-3 text-xs text-muted-foreground flex-wrap border-t border-border/40 pt-6 mt-4">
                  <span className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50 font-medium">
                    <CalendarDays className="w-4 h-4 text-primary/60" />
                    {allItems[0].date}
                  </span>
                  {allItems[0].type === 'event' && (
                    <span className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50 font-medium">
                      <MapPin className="w-4 h-4 text-primary/60" />
                      {(allItems[0] as unknown as Record<string, string>).unit}
                    </span>
                  )}
                  {allItems[0].type === 'article' && (
                    <span className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-xl border border-border/50 font-medium">
                      <BookOpen className="w-4 h-4 text-primary/60" />
                      {(allItems[0] as unknown as Record<string, string>).author}
                    </span>
                  )}
                  <div className="ml-auto hidden sm:flex items-center gap-2 text-primary font-bold uppercase tracking-widest text-[10px]">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    {t('Active Record', 'सक्रिय अभिलेख')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}

      {/* Rest of items */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <span className="section-seal">{t('Chronicle', 'क्रमवार विवरण')}</span>
        </div>

        <div className="grid gap-5">
          {allItems.slice(1).map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
              <Card className="institution-panel hover-lift overflow-hidden group border-border/60 hover:border-primary/30 transition-all duration-300 bg-background/30">
                <CardContent className="py-6 px-6 flex flex-col sm:flex-row gap-5 sm:gap-6">
                  {/* Left accent strip */}
                  <div className={cn(
                    "w-full sm:w-1.5 h-1 sm:h-auto shrink-0 rounded-full",
                    item.type === 'event' ? 'bg-orange-500/40' : 'bg-blue-500/40'
                  )} />

                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-[0.2em] bg-muted/30 border-border/50 px-2.5 py-0.5">
                          {item.type === 'event' ? t('Gatividhi', 'गतिविधि') : ((item as unknown as Record<string, string>).category || t('Aalekh', 'आलेख'))}
                        </Badge>
                        <h3 className="font-bold text-lg leading-tight font-devanagari group-hover:text-primary transition-colors tracking-tight">{item.title}</h3>
                      </div>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-success hover:bg-success/10 shrink-0 sm:opacity-0 group-hover:opacity-100 transition-all rounded-xl" onClick={() => handleShare(item.title)}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-devanagari">
                      {item.type === 'event' ? (item as unknown as Record<string, string>).description : (item as unknown as Record<string, string>).summary}
                    </p>

                    <div className="flex items-center gap-5 text-[11px] text-muted-foreground flex-wrap pt-1 font-medium">
                      <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md"><Clock className="w-3.5 h-3.5 opacity-60" />{item.date}</span>
                      {item.type === 'event' && <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md"><MapPin className="w-3.5 h-3.5 opacity-60" />{(item as unknown as Record<string, string>).unit}</span>}
                      {item.type === 'article' && <span className="flex items-center gap-1.5 bg-muted/30 px-2 py-0.5 rounded-md"><BookOpen className="w-3.5 h-3.5 opacity-60" />{(item as unknown as Record<string, string>).author}</span>}
                      {item.type === 'article' && (item as unknown as Record<string, string>).socialUrl && (
                        <a href={(item as unknown as Record<string, string>).socialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline font-bold uppercase tracking-widest text-[10px] ml-auto">
                          <ExternalLink className="w-3.5 h-3.5" /> {t('Read Source', 'स्रोत पढ़ें')}
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {allItems.length === 0 && (
        <Card className="institution-panel-muted">
          <CardContent className="py-24 text-center space-y-5">
            <div className="w-20 h-20 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-border/40 shadow-inner">
              <Newspaper className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <div className="space-y-2">
              <p className="font-bold text-xl font-devanagari text-muted-foreground/80">
                {t('No published content yet.', 'अभी कोई प्रकाशित सामग्री नहीं।')}
              </p>
              <p className="text-sm text-muted-foreground/60 max-w-sm mx-auto leading-relaxed">
                {t('Create events or articles from the dashboard to populate this institutional feed.', 'इस संस्थागत फ़ीड को भरने के लिए डैशबोर्ड से कार्यक्रम या आलेख बनाएं।')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="sutra-divider" />

      {/* Vimarsh cross-link */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        <Card className="institution-panel border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 transition-all shadow-md group">
          <CardContent className="py-8 flex flex-col sm:flex-row items-center justify-between gap-6 px-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                <MessagesSquare className="w-7 h-7 text-violet-500" />
              </div>
              <div className="space-y-1.5 text-center sm:text-left">
                <p className="font-bold text-lg font-devanagari leading-none text-foreground/90">{t('Vimarsh: The Narrative Hub', 'विमर्श: विमर्श का केंद्र')}</p>
                <p className="text-sm text-muted-foreground font-devanagari">{t('Assertion and counter across 15 discourse topics.', '15 विमर्श विषयों पर सत्य का मंडन और कुप्रचार का खंडन।')}</p>
              </div>
            </div>
            <Link href="/vimarsh" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-3 h-12 px-8 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/25 transition-all border-0 font-bold uppercase tracking-widest text-[11px]">
                {t('Explore Vimarsh', 'विमर्श देखें')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
