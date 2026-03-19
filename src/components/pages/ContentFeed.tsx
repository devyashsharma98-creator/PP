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
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';

// ── ContentFeed Context Types ─────────────────────────────────────────────

type ContentFeedContextItem = {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
};

function ContentFeedMasthead({
  t,
  contexts,
}: {
  t: (en: string, hi: string) => string;
  contexts: ContentFeedContextItem[];
}) {
  return (
    <div className="dashboard-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Public Intellectual Record', 'सार्वजनिक बौद्धिक अभिलेख')}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('Aalekh & Shodh Feed', 'आलेख एवं शोध फ़ीड')}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(
                'A combined chronicle of institutional activities and scholarly research, providing a window into the intellectual momentum of Pragya Pravah.',
                'संस्थागत गतिविधियों और विद्वत्तापूर्ण शोध का एक संयुक्त विवरण, जो प्रज्ञा प्रवाह की बौद्धिक गतिशीलता का प्रतिबिंब है।'
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

export default function ContentFeed() {
  const { events, articles, lang } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';
  const publishedEvents = events.filter(e => e.status === 'Published');
  const publishedArticles = articles.filter(a => a.status === 'Published');

  const handleShare = (title: string) => {
    const text = encodeURIComponent(`Check out: ${title} - Pragya Pravah, Bhopal Vibhag`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const allItems = [
    ...publishedEvents.map(e => ({ type: 'event' as const, ...e })),
    ...publishedArticles.map(a => ({ type: 'article' as const, ...a })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const contexts: ContentFeedContextItem[] = [
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
      detailHi: "संगठनात्मक चिंतन और कार्य का एक सार्वजनिक झरोखा।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <ContentFeedMasthead t={t} contexts={contexts} />

      {/* Featured / Latest */}
      {allItems.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="section-seal">{t('Latest Insight', 'नवीनतम विमर्श')}</span>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="institution-panel overflow-hidden border-primary/20 shadow-lg">
              <div className="h-1.5 bg-gradient-to-r from-orange-500 via-primary to-violet-500" />
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-300 border-0 text-[10px] gap-1 font-bold uppercase tracking-widest">
                      <Flame className="w-3.5 h-3.5" /> {t('Featured', 'प्रमुख')}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-background/50">
                      {allItems[0].type === 'event' ? t('Gatividhi', 'गतिविधि') : ((allItems[0] as unknown as Record<string, string>).category || t('Aalekh', 'आलेख'))}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-success hover:bg-success/10 transition-colors" onClick={() => handleShare(allItems[0].title)}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h2 className="font-bold text-2xl leading-snug tracking-tight">{allItems[0].title}</h2>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {allItems[0].type === 'event' ? (allItems[0] as unknown as Record<string, string>).description : (allItems[0] as unknown as Record<string, string>).summary}
                  </p>
                </div>

                <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap border-t border-border/50 pt-4 mt-2">
                  <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full border border-border/40">
                    <CalendarDays className="w-3.5 h-3.5 text-primary/60" />
                    {allItems[0].date}
                  </span>
                  {allItems[0].type === 'event' && (
                    <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full border border-border/40">
                      <MapPin className="w-3.5 h-3.5 text-primary/60" />
                      {(allItems[0] as unknown as Record<string, string>).unit}
                    </span>
                  )}
                  {allItems[0].type === 'article' && (
                    <span className="flex items-center gap-1.5 bg-muted/30 px-2.5 py-1 rounded-full border border-border/40">
                      <BookOpen className="w-3.5 h-3.5 text-primary/60" />
                      {(allItems[0] as unknown as Record<string, string>).author}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </section>
      )}

      {/* Rest of items */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="section-seal">{t('Chronicle', 'क्रमवार विवरण')}</span>
        </div>

        <div className="grid gap-4">
          {allItems.slice(1).map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="institution-panel hover-lift overflow-hidden group border-border/60 hover:border-primary/30 transition-all duration-300">
                <CardContent className="py-5 px-5 flex gap-5">
                  {/* Left accent */}
                  <div className={cn(
                    "w-1.5 shrink-0 rounded-full",
                    item.type === 'event' ? 'bg-orange-500/60' : 'bg-blue-500/60'
                  )} />

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-muted/20 border-border/40">
                          {item.type === 'event' ? t('Gatividhi', 'गतिविधि') : ((item as unknown as Record<string, string>).category || t('Aalekh', 'आलेख'))}
                        </Badge>
                        <h3 className="font-bold text-base leading-tight group-hover:text-primary transition-colors">{item.title}</h3>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10 shrink-0 opacity-0 group-hover:opacity-100 transition-all" onClick={() => handleShare(item.title)}>
                        <Share2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.type === 'event' ? (item as unknown as Record<string, string>).description : (item as unknown as Record<string, string>).summary}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap pt-1">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 opacity-60" />{item.date}</span>
                      {item.type === 'event' && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 opacity-60" />{(item as unknown as Record<string, string>).unit}</span>}
                      {item.type === 'article' && <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 opacity-60" />{(item as unknown as Record<string, string>).author}</span>}
                      {item.type === 'article' && (item as unknown as Record<string, string>).socialUrl && (
                        <a href={(item as unknown as Record<string, string>).socialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline font-medium">
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
          <CardContent className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-border/40">
              <Newspaper className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-lg font-devanagari text-muted-foreground/80">
                {t('No published content yet.', 'अभी कोई प्रकाशित सामग्री नहीं।')}
              </p>
              <p className="text-sm text-muted-foreground/60 max-w-xs mx-auto">
                {t('Create events or articles from the dashboard to populate this institutional feed.', 'इस संस्थागत फ़ीड को भरने के लिए डैशबोर्ड से कार्यक्रम या आलेख बनाएं।')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="sutra-divider" />

      {/* Vimarsh cross-link */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
        <Card className="institution-panel border-violet-500/20 bg-violet-500/5 hover:border-violet-500/40 transition-colors shadow-sm">
          <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <MessagesSquare className="w-6 h-6 text-violet-500" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-base font-devanagari leading-none">{t('Vimarsh: The Narrative Hub', 'विमर्श: विमर्श का केंद्र')}</p>
                <p className="text-xs text-muted-foreground font-devanagari">{t('Assertion and counter across 15 discourse topics.', '15 विमर्श विषयों पर सत्य का मंडन और कुप्रचार का खंडन।')}</p>
              </div>
            </div>
            <Link href="/vimarsh" className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto gap-2 h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all border-0">
                {t('Explore Vimarsh', 'विमर्श देखें')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
