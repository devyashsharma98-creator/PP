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
  Clock, Eye,
} from 'lucide-react';
import { useT } from '@/lib/useT';

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl mx-auto pb-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-bold font-devanagari">{t("Aalekh & Shodh", "आलेख एवं शोध")}</h1>
          </div>
          <p className="text-muted-foreground text-sm font-devanagari">
            {t("Published events and research articles", "प्रकाशित कार्यक्रम एवं शोध आलेख")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1">
            <TrendingUp className="w-3 h-3" /> {allItems.length} {t('Published', 'प्रकाशित')}
          </Badge>
        </div>
      </div>

      {/* Featured / Latest */}
      {allItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card overflow-hidden border-primary/15">
            <div className="h-1.5 bg-gradient-to-r from-orange-500 via-primary to-violet-500" />
            <CardContent className="pt-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-500/15 text-orange-600 dark:text-orange-400 border-0 text-[10px] gap-1">
                    <Flame className="w-3 h-3" /> {t('Latest', 'नवीनतम')}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {allItems[0].type === 'event' ? t('Gatividhi', 'गतिविधि') : ((allItems[0] as unknown as Record<string, string>).category || t('Aalekh', 'आलेख'))}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => handleShare(allItems[0].title)}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="font-bold text-lg leading-snug">{allItems[0].title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {allItems[0].type === 'event' ? (allItems[0] as unknown as Record<string, string>).description : (allItems[0] as unknown as Record<string, string>).summary}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap border-t border-border/50 pt-3">
                <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{allItems[0].date}</span>
                {allItems[0].type === 'event' && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(allItems[0] as unknown as Record<string, string>).unit}</span>}
                {allItems[0].type === 'article' && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{(allItems[0] as unknown as Record<string, string>).author}</span>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Rest of items */}
      <div className="space-y-3">
        {allItems.slice(1).map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
            <Card className="glass-card hover-lift overflow-hidden group">
              <CardContent className="py-4 px-4 flex gap-4">
                {/* Left accent */}
                <div className={`w-1 shrink-0 rounded-full ${item.type === 'event' ? 'bg-orange-500' : 'bg-blue-500'}`} />

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[9px]">
                        {item.type === 'event' ? t('Gatividhi', 'गतिविधि') : ((item as unknown as Record<string, string>).category || t('Aalekh', 'आलेख'))}
                      </Badge>
                      <h3 className="font-semibold text-sm leading-snug">{item.title}</h3>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-success hover:text-success shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleShare(item.title)}>
                      <Share2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {item.type === 'event' ? (item as unknown as Record<string, string>).description : (item as unknown as Record<string, string>).summary}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.date}</span>
                    {item.type === 'event' && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(item as unknown as Record<string, string>).unit}</span>}
                    {item.type === 'article' && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{(item as unknown as Record<string, string>).author}</span>}
                    {item.type === 'article' && (item as unknown as Record<string, string>).socialUrl && (
                      <a href={(item as unknown as Record<string, string>).socialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <ExternalLink className="w-3 h-3" /> {t('Source', 'स्रोत')}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {allItems.length === 0 && (
        <Card className="glass-card">
          <CardContent className="py-16 text-center space-y-3">
            <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground font-devanagari">
              {t('No published content yet.', 'अभी कोई प्रकाशित सामग्री नहीं।')}
            </p>
            <p className="text-xs text-muted-foreground/60">
              {t('Create events or articles from Dashboard → they will appear here once published.', 'डैशबोर्ड से कार्यक्रम या आलेख बनाएं → प्रकाशित होने पर यहाँ दिखेंगे।')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Vimarsh cross-link */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="glass-card border-violet-500/15 bg-violet-500/5">
          <CardContent className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                <MessagesSquare className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <p className="font-semibold text-sm font-devanagari">{t('Vimarsh — Explore 15 Discourse Topics', 'विमर्श — 15 विमर्श विषयों का अन्वेषण')}</p>
                <p className="text-xs text-muted-foreground font-devanagari">{t('Mandan aur Khandan — assertion and counter', 'मंडन और खंडन — सत्य का मंडन, कुप्रचार का खंडन')}</p>
              </div>
            </div>
            <Link href="/vimarsh">
              <Button size="sm" className="shrink-0 w-full sm:w-auto gap-1">
                {t('Explore', 'खोजें')} <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
