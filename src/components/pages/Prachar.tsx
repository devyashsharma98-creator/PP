"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Megaphone, CheckCircle2, AlertCircle, MessageCircle,
  Globe, Camera, Navigation, Layout, Palette, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAppContext, type PracharPlatform } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';

interface Platform {
  key: PracharPlatform;
  label: string;
  labelHi: string;
  icon: LucideIcon;
  color: string;
}

const platforms: Platform[] = [
  { key: 'whatsapp', label: 'WhatsApp Groups', labelHi: 'WhatsApp ग्रुप', icon: MessageCircle, color: 'text-success' },
  { key: 'facebook', label: 'Facebook Page', labelHi: 'Facebook पेज', icon: Globe, color: 'text-info' },
  { key: 'instagram', label: 'Instagram', labelHi: 'Instagram', icon: Camera, color: 'text-destructive' },
  { key: 'telegram', label: 'Telegram Channel', labelHi: 'Telegram चैनल', icon: Navigation, color: 'text-primary' },
];

const templates = [
  { id: 't1', name: 'Event Poster', nameHi: 'कार्यक्रम पोस्टर', desc: 'Standard event announcement', descHi: 'कार्यक्रम की मानक घोषणा', icon: Layout, gradient: 'from-orange-500 to-amber-500' },
  { id: 't2', name: 'Vimarsh Quote Card', nameHi: 'विमर्श उद्धरण कार्ड', desc: 'Quote card for discourse topics', descHi: 'विमर्श विषयों के लिए उद्धरण कार्ड', icon: Palette, gradient: 'from-violet-500 to-purple-500' },
  { id: 't3', name: 'Book Discussion', nameHi: 'पुस्तक चर्चा', desc: 'Book review announcement', descHi: 'पुस्तक समीक्षा घोषणा', icon: Layout, gradient: 'from-blue-500 to-cyan-500' },
  { id: 't4', name: 'Youth Program', nameHi: 'युवा कार्यक्रम', desc: 'Yuva aayam event template', descHi: 'युवा आयाम कार्यक्रम टेम्पलेट', icon: Palette, gradient: 'from-emerald-500 to-green-500' },
  { id: 't5', name: 'Sammelan Invite', nameHi: 'सम्मेलन आमंत्रण', desc: 'Conference invitation template', descHi: 'सम्मेलन आमंत्रण पत्र', icon: Layout, gradient: 'from-rose-500 to-pink-500' },
];

export default function Prachar() {
  const { events, pracharStatuses, updatePracharPlatform } = useAppContext();
  const t = useT();
  const publishedEvents = events.filter(e => e.status === 'Published');

  const getStatus = (eventId: string) =>
    pracharStatuses.find(p => p.eventId === eventId) ??
    { eventId, platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false } };

  const isDone = (eventId: string) => {
    const s = getStatus(eventId);
    return Object.values(s.platforms).every(Boolean);
  };

  const incompleteCount = publishedEvents.filter(e => !isDone(e.id)).length;

  // Embla carousel for templates
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', slidesToScroll: 1 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();

    // Auto-play
    const interval = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => { clearInterval(interval); emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold">
          {t("Prachar Aayam", "प्रचार आयाम")}
        </h1>
        <p className="text-muted-foreground text-sm">{t("Multi-platform publication workflow", "बहु-मंच प्रकाशन कार्यप्रवाह")}</p>
      </div>

      {/* Incomplete alert */}
      {incompleteCount > 0 && (
        <Alert className="border-warning/40 bg-[hsl(var(--warning)/.06)]">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm font-devanagari">
            {t(
              `${incompleteCount} published event${incompleteCount > 1 ? 's' : ''} pending complete platform distribution. All 4 platforms must be marked before this alert clears.`,
              `${incompleteCount} प्रकाशित कार्यक्रम${incompleteCount > 1 ? '' : ''} सभी मंचों पर वितरण प्रतीक्षित है। अलर्ट हटाने के लिए सभी 4 मंच चिह्नित करें।`
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Publication Queue */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-primary" /> {t("Publication Queue", "प्रकाशन कतार")}
        </h2>

        {publishedEvents.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              {t('No published events yet. Approve events from the Dashboard to see them here.', 'अभी कोई प्रकाशित कार्यक्रम नहीं। डैशबोर्ड से कार्यक्रम अनुमोदित करें।')}
            </CardContent>
          </Card>
        ) : (
          publishedEvents.map((event, i) => {
            const status = getStatus(event.id);
            const done = isDone(event.id);
            const completedCount = Object.values(status.platforms).filter(Boolean).length;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={cn('glass-card overflow-hidden', done ? 'border-success/30' : 'border-warning/30')}>
                  <div className={cn('h-1', done ? 'bg-success' : 'bg-warning')} />
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-sm">{event.title}</h3>
                        <p className="text-xs text-muted-foreground">{event.unit} · {event.date}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground">{completedCount}/4</span>
                        {done
                          ? <Badge className="bg-[hsl(var(--success)/.15)] text-success text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> {t('All Done', 'पूर्ण')}
                          </Badge>
                          : <Badge className="bg-[hsl(var(--warning)/.15)] text-warning text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" /> {t('Pending', 'प्रतीक्षित')}
                          </Badge>
                        }
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {platforms.map(platform => {
                        const checked = status.platforms[platform.key];
                        return (
                          <div
                            key={platform.key}
                            className={cn(
                              'flex items-center gap-2 p-2.5 rounded-lg border transition-all cursor-pointer',
                              checked ? 'border-success/40 bg-[hsl(var(--success)/.06)]' : 'border-border/50 bg-muted/30 hover:border-border'
                            )}
                            onClick={() => updatePracharPlatform(event.id, platform.key, !checked)}
                          >
                            <Checkbox
                              id={`${event.id}-${platform.key}`}
                              checked={checked}
                              onCheckedChange={v => updatePracharPlatform(event.id, platform.key, !!v)}
                            />
                            <div className="min-w-0">
                              <platform.icon className={cn('w-3.5 h-3.5', platform.color)} />
                              <Label
                                htmlFor={`${event.id}-${platform.key}`}
                                className="text-[10px] cursor-pointer block mt-0.5 leading-tight"
                              >
                                {t(platform.label, platform.labelHi)}
                              </Label>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!done && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-devanagari">
                        <AlertCircle className="w-3 h-3 text-warning shrink-0" />
                        {t('Mark all platforms above to clear the pending alert for this event.', 'इस कार्यक्रम का अलर्ट हटाने के लिए सभी मंच चिह्नित करें।')}
                      </p>
                    )}

                    {done && (
                      <Link href="/feed">
                        <Button variant="outline" size="sm" className="text-xs text-success border-success/40 hover:bg-success/5 w-full sm:w-auto">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {t('View Published in Feed →', 'फ़ीड में देखें →')}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ── Templates Carousel ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">{t("Design Templates", "डिज़ाइन टेम्पलेट")}</h2>
          <div className="flex items-center gap-1">
            <button onClick={scrollPrev} className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={scrollNext} className="w-7 h-7 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent transition-colors">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="relative">
          {/* Edge fades */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="flex-[0_0_70%] sm:flex-[0_0_45%] lg:flex-[0_0_28%] min-w-0">
                  <Card className="glass-card hover-lift cursor-pointer h-full overflow-hidden">
                    <div className={`h-20 bg-gradient-to-br ${tmpl.gradient} flex items-center justify-center`}>
                      <tmpl.icon className="w-8 h-8 text-white/80" />
                    </div>
                    <CardContent className="pt-3 pb-4 space-y-2">
                      <h3 className="text-sm font-medium font-devanagari">{t(tmpl.name, tmpl.nameHi)}</h3>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{t(tmpl.desc, tmpl.descHi)}</p>
                      <Button variant="outline" size="sm" className="text-xs h-7 w-full">{t('Use Template', 'टेम्पलेट उपयोग करें')}</Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-1.5 mt-3">
            {templates.map((_, i) => (
              <button
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === selectedIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'
                  }`}
                onClick={() => emblaApi?.scrollTo(i)}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-1 font-devanagari">
          {t('Need content ideas?', 'विषय चाहिए?')} <Link href="/vimarsh" className="text-primary underline-offset-2 hover:underline">{t('Explore Vimarsh topics →', 'विमर्श विषय देखें →')}</Link>
        </p>
      </div>
    </motion.div>
  );
}
