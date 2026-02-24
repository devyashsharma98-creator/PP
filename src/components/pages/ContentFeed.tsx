"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, CalendarDays, MapPin, BookOpen, ArrowRight, MessagesSquare, ExternalLink } from 'lucide-react';
import { useT } from '@/lib/useT';

export default function ContentFeed() {
  const { events, articles } = useAppContext();
  const t = useT();
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("Aalekh & Shodh", "आलेख एवं शोध")}</h1>
        <p className="text-muted-foreground text-sm">{t("Published events and research articles", "प्रकाशित कार्यक्रम एवं शोध आलेख")}</p>
      </div>

      <div className="space-y-4">
        {allItems.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="glass-card hover-lift overflow-hidden">
              <div className="h-1 saffron-gradient" />
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {item.type === 'event' ? t('Gatividhi', 'गतिविधि') : ((item as any).category || t('Aalekh', 'आलेख'))}
                  </Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:text-success" onClick={() => handleShare(item.title)}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <h3 className="font-semibold text-base leading-snug">{item.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {item.type === 'event' ? (item as any).description : (item as any).summary}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{item.date}</span>
                  {item.type === 'event' && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{(item as any).unit}</span>}
                  {item.type === 'article' && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{(item as any).author}</span>}
                  {item.type === 'article' && (item as any).socialUrl && (
                    <a href={(item as any).socialUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> {t('Source', 'स्रोत')}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {allItems.length === 0 && (
          <Card className="glass-card">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              {t('No published content yet.', 'अभी कोई प्रकाशित सामग्री नहीं।')}
            </CardContent>
          </Card>
        )}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <Card className="glass-card border-primary/20 bg-primary/5">
          <CardContent className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MessagesSquare className="w-8 h-8 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-sm font-devanagari">{t('Vimarsh — Explore 15 Discourse Topics', 'विमर्श — 15 विमर्श विषयों का अन्वेषण')}</p>
                <p className="text-xs text-muted-foreground font-devanagari">{t('Identify narratives, study counter-arguments — Mandan aur Khandan', 'विचारों की पहचान करें, प्रति-तर्क अध्ययन करें — मंडन और खंडन')}</p>
              </div>
            </div>
            <Link href="/vimarsh">
              <Button size="sm" className="shrink-0 w-full sm:w-auto">
                {t('Explore Vimarsh', 'विमर्श खोजें')} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
