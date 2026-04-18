"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Megaphone, CheckCircle2, AlertCircle, MessageCircle,
  Globe, Camera, Navigation, Layout, Palette, ChevronLeft, ChevronRight,
  FileText, Clock3, Send, Sparkles,
} from 'lucide-react';
import { useAppContext, type PracharPlatform, type Role } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface Platform {
  key: PracharPlatform;
  label: string;
  labelHi: string;
  icon: LucideIcon;
  color: string;
}

interface PracharContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi: string;
  detailEn: string;
  detailHi: string;
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

function PracharMasthead({
  t,
  contexts,
  canAct,
}: {
  t: (en: string, hi: string) => string;
  contexts: PracharContextItem[];
  canAct: boolean;
}) {
  return (
    <div className="prachar-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t('Prachar Command Center', 'प्रचार संचालन कक्ष')}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {t('Distribute and Confirm Reach', 'वितरण करें और पहुँच सुनिश्चित करें')}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              {t(
                'Move approved work into public reach. Track completion, close gaps, and finish each campaign.',
                'स्वीकृत कार्य को सार्वजनिक पहुंच तक ले जाएं। पूर्णता देखें, कमी भरें और हर अभियान पूरा करें।',
              )}
            </p>
          </div>
        </div>

        <div className="prachar-authority-card">
          <p className="shell-copy">{t('Action rights', 'कार्य अधिकार')}</p>
          <p className="prachar-authority-title">
            {canAct
              ? t('Campaign closure and follow-through', 'अभियान पूर्णता और अनुवर्तन')
              : t('Campaign visibility and status awareness', 'अभियान दृश्यता और स्थिति समझ')}
          </p>
          <p className="prachar-authority-detail">
            {canAct
              ? t('Mark completed channels or note why one was skipped.', 'पूर्ण चैनल दर्ज करें या स्किप का कारण लिखें।')
              : t('You can review campaign status here. Final closure stays with the responsible desk.', 'यहां अभियान की स्थिति देखें। अंतिम समापन जिम्मेदार कक्ष करेगा।')}
          </p>
        </div>
      </div>

      <div className="prachar-context-grid">
        {contexts.map((context) => (
          <div key={context.labelEn} className="prachar-context-card">
            <p className="shell-copy">{t(context.labelEn, context.labelHi)}</p>
            <p className="prachar-context-value">{t(context.valueEn, context.valueHi)}</p>
            <p className="prachar-context-detail">{t(context.detailEn, context.detailHi)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function roleCopy(role: Role, canAct: boolean, pendingCount: number): PracharContextItem[] {
  if (role === 'vibhag_pramukh') {
    return [
      {
        labelEn: 'Current lane',
        labelHi: 'वर्तमान धारा',
        valueEn: 'Final dissemination oversight',
        valueHi: 'अंतिम प्रसार अनुश्रवण',
        detailEn: 'Track completion across units and keep every published campaign moving.',
        detailHi: 'इकाइयों में पूर्णता देखें और प्रत्येक प्रकाशित अभियान को आगे बढ़ाते रहें।',
      },
      {
        labelEn: 'Institutional priority',
        labelHi: 'संस्थागत प्राथमिकता',
        valueEn: pendingCount === 0 ? 'All campaigns closed' : `${pendingCount} campaigns pending closure`,
        valueHi: pendingCount === 0 ? 'सभी अभियान पूर्ण' : `${pendingCount} अभियान पूर्णता की प्रतीक्षा में`,
        detailEn: 'Resolve incomplete platform coverage before the next public cycle.',
        detailHi: 'अगले सार्वजनिक चक्र से पहले अधूरे मंच-वितरण पूरे करें।',
      },
      {
        labelEn: 'Coordination mode',
        labelHi: 'समन्वय स्वरूप',
        valueEn: canAct ? 'Direct platform accountability' : 'Read-only oversight',
        valueHi: canAct ? 'प्रत्यक्ष मंच उत्तरदायित्व' : 'केवल अनुश्रवण',
        detailEn: 'Close gaps quickly and keep proof of dissemination visible.',
        detailHi: 'कमियों को शीघ्र पूरा करें और प्रसार का प्रमाण स्पष्ट रखें।',
      },
    ];
  }

  if (role === 'aayam_pramukh') {
    return [
      {
        labelEn: 'Current lane',
        labelHi: 'वर्तमान धारा',
        valueEn: 'Campaign ownership desk',
        valueHi: 'अभियान स्वामित्व कक्ष',
        detailEn: 'Carry approved work into organised circulation and follow through platform by platform.',
        detailHi: 'अनुमोदित कार्य को संगठित प्रसार में ले जाएँ और प्रत्येक मंच पर अनुवर्तन रखें।',
      },
      {
        labelEn: 'Institutional priority',
        labelHi: 'संस्थागत प्राथमिकता',
        valueEn: pendingCount === 0 ? 'Campaigns ready for closure' : `${pendingCount} campaigns need channel action`,
        valueHi: pendingCount === 0 ? 'अभियान पूर्णता हेतु तैयार' : `${pendingCount} अभियानों को चैनल कार्रवाई चाहिए`,
        detailEn: 'Keep each event visible across the required outreach surfaces.',
        detailHi: 'प्रत्येक कार्यक्रम को आवश्यक प्रचार माध्यमों पर दृश्य बनाए रखें।',
      },
      {
        labelEn: 'Coordination mode',
        labelHi: 'समन्वय स्वरूप',
        valueEn: canAct ? 'Platform execution and documentation' : 'Campaign visibility',
        valueHi: canAct ? 'मंच क्रियान्वयन और दस्तावेज़ीकरण' : 'अभियान दृश्यता',
        detailEn: 'Use skip reasons only when a channel is intentionally not used.',
        detailHi: 'जब किसी मंच का उपयोग जानबूझकर न होने पर ही कारण दर्ज करें।',
      },
    ];
  }

  if (role === 'unit_head') {
    return [
      {
        labelEn: 'Current lane',
        labelHi: 'वर्तमान धारा',
        valueEn: 'Unit dissemination visibility',
        valueHi: 'इकाई प्रसार दृश्यता',
        detailEn: 'Review how approved work is progressing into outreach after publication.',
        detailHi: 'प्रकाशन के बाद अनुमोदित कार्य का प्रचार में प्रगति देखें।',
      },
      {
        labelEn: 'Institutional priority',
        labelHi: 'संस्थागत प्राथमिकता',
        valueEn: pendingCount === 0 ? 'No open follow-through' : `${pendingCount} campaigns still open`,
        valueHi: pendingCount === 0 ? 'कोई खुला अनुवर्तन नहीं' : `${pendingCount} अभियान अभी खुले हैं`,
        detailEn: 'Use this page to understand campaign movement and support pending closures.',
        detailHi: 'इस पृष्ठ से अभियान की गति समझें और लंबित पूर्णताओं को सहारा दें।',
      },
      {
        labelEn: 'Coordination mode',
        labelHi: 'समन्वय स्वरूप',
        valueEn: canAct ? 'Operational support' : 'Observation and support',
        valueHi: canAct ? 'प्रचालन सहयोग' : 'अवलोकन और सहयोग',
        detailEn: 'The final dissemination checklist is maintained at the responsible coordination lane.',
        detailHi: 'अंतिम प्रचार चेकलिस्ट जिम्मेदार समन्वय धारा में रखी जाती है।',
      },
    ];
  }

  return [
    {
      labelEn: 'Current lane',
      labelHi: 'वर्तमान धारा',
      valueEn: 'Public reach visibility',
      valueHi: 'सार्वजनिक पहुँच दृश्यता',
      detailEn: 'See how approved work becomes organised public communication.',
      detailHi: 'देखें कि अनुमोदित कार्य कैसे संगठित सार्वजनिक संवाद बनता है।',
    },
    {
      labelEn: 'Institutional priority',
      labelHi: 'संस्थागत प्राथमिकता',
      valueEn: pendingCount === 0 ? 'Campaigns are closed' : `${pendingCount} campaigns in motion`,
      valueHi: pendingCount === 0 ? 'अभियान पूर्ण हैं' : `${pendingCount} अभियान गतिमान हैं`,
      detailEn: 'Understand the dissemination state even when you are not the final coordinator.',
      detailHi: 'अंतिम समन्वयक न होने पर भी प्रसार स्थिति को समझें।',
    },
    {
      labelEn: 'Coordination mode',
      labelHi: 'समन्वय स्वरूप',
      valueEn: canAct ? 'Campaign support' : 'View-only campaign context',
      valueHi: canAct ? 'अभियान सहयोग' : 'केवल दृश्य अभियान संदर्भ',
      detailEn: 'Use the command center to see what has moved, what is pending, and what still needs attention.',
      detailHi: 'कौन सा कार्य आगे बढ़ा, क्या लंबित है और किसे ध्यान चाहिए, यह यहाँ देखें।',
    },
  ];
}

export default function Prachar() {
  const { role, events, permissions, pracharStatuses, updatePracharPlatform } = useAppContext();
  const t = useT();
  const publishedEvents = useMemo(() => events.filter(e => e.status === 'Published'), [events]);

  // Track which platform is pending a skip-reason entry: "eventId::platform"
  const [pendingSkipKey, setPendingSkipKey] = useState<string | null>(null);
  const [pendingSkipText, setPendingSkipText] = useState('');
  const getStatus = useCallback((eventId: string) =>
  pracharStatuses.find(p => p.eventId === eventId) ?? {
    eventId,
    platforms: { whatsapp: false, facebook: false, instagram: false, telegram: false },
    skipReasons: { whatsapp: null, facebook: null, instagram: null, telegram: null },
  }, [pracharStatuses]);

  const isDone = (eventId: string) => {
    const s = getStatus(eventId);
    return platforms.every((platform) =>
      s.platforms[platform.key] || Boolean(s.skipReasons?.[platform.key]?.trim()),
    );
  };

  const incompleteCount = publishedEvents.filter(e => !isDone(e.id)).length;
  const campaignStats = useMemo(() => {
    let confirmedPlatforms = 0;
    let documentedSkips = 0;
    let openFollowThrough = 0;

    publishedEvents.forEach((event) => {
      const status = getStatus(event.id);
      platforms.forEach((platform) => {
        if (status.platforms[platform.key]) {
          confirmedPlatforms += 1;
        } else if (status.skipReasons?.[platform.key]) {
          documentedSkips += 1;
        } else {
          openFollowThrough += 1;
        }
      });
    });

    return {
      totalCampaigns: publishedEvents.length,
      incompleteCampaigns: incompleteCount,
      completedCampaigns: publishedEvents.length - incompleteCount,
      confirmedPlatforms,
      documentedSkips,
      openFollowThrough,
      completionRate: publishedEvents.length === 0 ? 0 : Math.round(((publishedEvents.length - incompleteCount) / publishedEvents.length) * 100),
    };
  }, [incompleteCount, publishedEvents, getStatus]);
  const mastheadContexts = useMemo(
    () => roleCopy(role, permissions.canUpdatePrachar, incompleteCount),
    [incompleteCount, permissions.canUpdatePrachar, role],
  );

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
      <PracharMasthead t={t} contexts={mastheadContexts} canAct={permissions.canUpdatePrachar} />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Live Distribution Command Center', 'सजीव वितरण नियंत्रण कक्ष')}</p>
            <div className="space-y-1">
              <h2 className="dashboard-section-heading">{t('Campaign Dissemination Queue', 'अभियान प्रसार कतार')}</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {t(
                  'See what is complete, what was skipped with reason, and what still needs follow-through.',
                  'यहां देखें क्या पूरा हुआ, क्या कारण सहित छोड़ा गया और कहां अभी अनुवर्तन बाकी है।',
                )}
              </p>
            </div>
          </div>
          <div className="home-sequence-strip">
            <span>{t('Publish', 'प्रकाशित करें')}</span>
            <span>•</span>
            <span>{t('Distribute', 'वितरित करें')}</span>
            <span>•</span>
            <span>{t('Confirm Reach', 'पहुंच सुनिश्चित करें')}</span>
          </div>
        </div>

        <div className="prachar-command-grid">
          <div className="prachar-command-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="shell-copy">{t('Campaigns in motion', 'गतिमान अभियान')}</p>
                <p className="prachar-command-value">{campaignStats.totalCampaigns}</p>
              </div>
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <p className="prachar-command-detail">
              {campaignStats.incompleteCampaigns === 0
                ? t('All published campaigns are closed.', 'सभी प्रकाशित अभियान पूरे हो चुके हैं।')
                : t(`${campaignStats.incompleteCampaigns} campaigns still need closure.`, `${campaignStats.incompleteCampaigns} अभियान अभी पूरे होने बाकी हैं।`)}
            </p>
          </div>

          <div className="prachar-command-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="shell-copy">{t('Channels confirmed', 'पुष्ट चैनल')}</p>
                <p className="prachar-command-value">{campaignStats.confirmedPlatforms}</p>
              </div>
              <Send className="h-5 w-5 text-primary" />
            </div>
            <p className="prachar-command-detail">
              {t(
                `${campaignStats.openFollowThrough} channels still need follow-through and ${campaignStats.documentedSkips} have skip notes.`,
                `${campaignStats.openFollowThrough} चैनलों पर अभी अनुवर्तन चाहिए और ${campaignStats.documentedSkips} पर स्किप नोट दर्ज है।`,
              )}
            </p>
          </div>

          <div className="prachar-command-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="shell-copy">{t('Closure readiness', 'पूर्णता तैयारी')}</p>
                <p className="prachar-command-value">{campaignStats.completionRate}%</p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <p className="prachar-command-detail">
              {permissions.canUpdatePrachar
                ? t('Use the queue below to finish pending channels or record skips.', 'नीचे की कतार से बाकी चैनल पूरे करें या स्किप दर्ज करें।')
                : t('Use the queue below to see which campaigns still need attention.', 'नीचे की कतार से देखें किन अभियानों को अभी ध्यान चाहिए।')}
            </p>
          </div>
        </div>

        {incompleteCount > 0 && (
          <Alert className="border-warning/40 bg-[hsl(var(--warning)/.06)]">
            <AlertCircle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              {t(
                `${incompleteCount} published campaign${incompleteCount > 1 ? 's' : ''} still need dissemination closure.`,
                `${incompleteCount} प्रकाशित अभियान अभी प्रसार पूर्णता की प्रतीक्षा में हैं।`,
              )}
            </AlertDescription>
          </Alert>
        )}
      </section>

      <div className="space-y-4">

        {publishedEvents.length === 0 ? (
          <Card className="institution-panel-muted">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              {t('No published events are ready for Prachar yet. Approve events from the dashboard to activate this desk.', 'प्रचार के लिए अभी कोई प्रकाशित कार्यक्रम तैयार नहीं है। इस कक्ष को सक्रिय करने के लिए डैशबोर्ड से कार्यक्रम अनुमोदित करें।')}
            </CardContent>
          </Card>
        ) : (
          publishedEvents.map((event, i) => {
            const status = getStatus(event.id);
            const done = isDone(event.id);
            const completedCount = Object.values(status.platforms).filter(Boolean).length;
            const documentedSkips = platforms.filter(platform => status.skipReasons?.[platform.key]).length;
            const openFollowThrough = platforms.filter(platform => !status.platforms[platform.key] && !status.skipReasons?.[platform.key]).length;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className={cn('prachar-campaign-card overflow-hidden', done ? 'border-success/40' : 'border-warning/35')}>
                  <div className={cn('h-1.5', done ? 'bg-success' : 'bg-warning')} />
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-[0.16em]">
                            {t('Campaign Dossier', 'अभियान संलेख')}
                          </Badge>
                          {done
                            ? <Badge className="bg-[hsl(var(--success)/.15)] text-success text-xs">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> {t('Distribution Closed', 'वितरण पूर्ण')}
                            </Badge>
                            : <Badge className="bg-[hsl(var(--warning)/.15)] text-warning text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" /> {t('Reach Pending', 'पहुंच लंबित')}
                            </Badge>
                          }
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.unit} · {event.date}</p>
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{event.description}</p>
                      </div>

                      <div className="prachar-progress-strip">
                        <div className="prachar-progress-chip">
                          <p className="shell-copy">{t('Channels done', 'पूर्ण चैनल')}</p>
                          <p className="prachar-progress-value">{completedCount}/4</p>
                        </div>
                        <div className="prachar-progress-chip">
                          <p className="shell-copy">{t('Open follow-through', 'खुला अनुवर्तन')}</p>
                          <p className="prachar-progress-value">{openFollowThrough}</p>
                        </div>
                        <div className="prachar-progress-chip">
                          <p className="shell-copy">{t('Documented skips', 'दर्ज स्किप')}</p>
                          <p className="prachar-progress-value">{documentedSkips}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {platforms.map(platform => {
                        const checked = status.platforms[platform.key];
                        const skipKey = `${event.id}::${platform.key}`;
                        const isPendingSkip = pendingSkipKey === skipKey;
                        const existingReason = status.skipReasons?.[platform.key] ?? null;

                        const handleToggle = (nextDone: boolean) => {
                          if (!permissions.canUpdatePrachar) return;
                          if (nextDone) {
                            // Marking done — clear skip reason
                            setPendingSkipKey(null);
                            setPendingSkipText('');
                            void updatePracharPlatform(event.id, platform.key, true, null);
                          } else {
                            // Unchecking — prompt for skip reason
                            setPendingSkipKey(skipKey);
                            setPendingSkipText(existingReason ?? '');
                          }
                        };

                        const confirmSkip = () => {
                          const reason = pendingSkipText.trim() || null;
                          void updatePracharPlatform(event.id, platform.key, false, reason);
                          setPendingSkipKey(null);
                          setPendingSkipText('');
                        };

                        return (
                          <div
                            key={platform.key}
                            className={cn(
                              'prachar-platform-card',
                              checked
                                ? 'border-success/40 bg-[hsl(var(--success)/.08)]'
                                : existingReason
                                  ? 'border-primary/30 bg-primary/5'
                                  : 'border-border/50 bg-muted/30 hover:border-border'
                            )}
                          >
                            <div
                              className="flex items-start gap-2 cursor-pointer"
                              onClick={() => handleToggle(!checked)}
                            >
                              <Checkbox
                                id={`${event.id}-${platform.key}`}
                                checked={checked}
                                disabled={!permissions.canUpdatePrachar}
                                onCheckedChange={v => handleToggle(!!v)}
                              />
                              <div className="min-w-0 flex-1">
                                <platform.icon className={cn('w-3.5 h-3.5', platform.color)} />
                                <Label
                                  htmlFor={`${event.id}-${platform.key}`}
                                  className="text-[10px] cursor-pointer block mt-0.5 leading-tight"
                                >
                                  {t(platform.label, platform.labelHi)}
                                </Label>
                                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                                  {checked
                                    ? t('Channel marked complete.', 'चैनल पूर्ण दर्ज है।')
                                    : existingReason
                                      ? t(`Skip noted: ${existingReason}`, `स्किप नोट: ${existingReason}`)
                                      : t('Waiting for dissemination confirmation.', 'प्रसार पुष्टि की प्रतीक्षा है।')}
                                </p>
                              </div>
                            </div>
                            {/* Inline skip-reason input */}
                            {isPendingSkip && (
                              <div className="space-y-2 border-t border-border/50 pt-3">
                                <Input
                                  value={pendingSkipText}
                                  onChange={e => setPendingSkipText(e.target.value)}
                                  placeholder={t('Why skip this channel?', 'यह चैनल क्यों छोड़ा गया?')}
                                  className="h-8 text-xs px-2"
                                  autoFocus
                                  onKeyDown={e => { if (e.key === 'Enter') confirmSkip(); }}
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" className="h-7 text-[11px] px-3 flex-1" onClick={confirmSkip}>
                                    {t('Save note', 'नोट सहेजें')}
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-7 text-[11px] px-3" onClick={() => { setPendingSkipKey(null); setPendingSkipText(''); }}>
                                    {t('Cancel', 'रद्द')}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-3 border-t border-border/50 pt-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="space-y-1 text-xs text-muted-foreground">
                        {status.templateReference && (
                          <p className="flex items-center gap-1">
                            <FileText className="w-3 h-3 shrink-0" />
                            {t('Template reference', 'टेम्पलेट संदर्भ')}: <span className="font-medium text-foreground/70">{status.templateReference}</span>
                          </p>
                        )}

                        <p className="flex items-center gap-1">
                          <Clock3 className="w-3 h-3 text-warning shrink-0" />
                          {done
                            ? t('Campaign closure is recorded across all required channels.', 'सभी जरूरी चैनलों पर अभियान पूर्ण दर्ज है।')
                            : t('Complete the remaining channels or note why any were skipped.', 'बाकी चैनल पूरे करें या बताएं कौन-सा चैनल क्यों छोड़ा गया।')}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!done && (
                          <Badge variant="outline" className="border-warning/40 bg-warning/5 text-warning">
                            {t('Attention required', 'ध्यान आवश्यक')}
                          </Badge>
                        )}
                        <Link href="/feed">
                          <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> {t('View Published Feed', 'प्रकाशित फीड देखें')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t('Campaign Creative Studio', 'अभियान सृजन कक्ष')}</p>
            <div className="space-y-1">
              <h2 className="dashboard-section-heading">{t('Communication kits, posters, and publicity formats', 'संचार किट, पोस्टर और प्रचार प्रारूप')}</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {t(
                  'Use these ready formats to package approved work for faster public reach. The studio keeps message discipline and campaign energy aligned.',
                  'इन तैयार प्रारूपों से स्वीकृत कार्य को जल्दी सार्वजनिक पहुंच तक ले जाएं। यह कक्ष संदेश और अभियान ऊर्जा को एक दिशा में रखता है।',
                )}
              </p>
            </div>
          </div>
          <div className="home-sequence-strip">
            <Sparkles className="h-3.5 w-3.5" />
            <span>{t('Posters', 'पोस्टर')}</span>
            <span>•</span>
            <span>{t('Quote cards', 'उद्धरण कार्ड')}</span>
            <span>•</span>
            <span>{t('Invites', 'आमंत्रण')}</span>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="prachar-command-card">
            <p className="shell-copy">{t('Studio use', 'कक्ष उपयोग')}</p>
            <p className="prachar-command-value">{t('Ready asset directions', 'तत्पर दृश्य दिशाएं')}</p>
            <p className="prachar-command-detail">
              {t('Pick the format that fits the campaign and keep the message consistent on every channel.', 'अभियान के अनुरूप प्रारूप चुनें और संदेश हर चैनल पर एक जैसा रखें।')}
            </p>
          </div>
          <div className="prachar-command-card">
            <p className="shell-copy">{t('Institutional discipline', 'संस्थागत अनुशासन')}</p>
            <p className="prachar-command-value">{t('One message, many channels', 'एक संदेश, अनेक चैनल')}</p>
            <p className="prachar-command-detail">
              {t('Creative energy should still preserve factual clarity, tone, and organisational maryada.', 'सृजनात्मक ऊर्जा के साथ तथ्य स्पष्टता, स्वर और संगठनात्मक मर्यादा भी बनी रहनी चाहिए।')}
            </p>
          </div>
          <div className="prachar-command-card">
            <p className="shell-copy">{t('Next source', 'अगला स्रोत')}</p>
            <p className="prachar-command-value">{t('Pull ideas from Vimarsh', 'विमर्श से विषय लें')}</p>
            <p className="prachar-command-detail">
              {t('When a campaign needs sharper framing, return to Vimarsh and tighten the narrative before distribution.', 'जब अभियान को और स्पष्ट कथ्य चाहिए, तो वितरण से पहले विमर्श पर लौटें और भाषा को सधा लें।')}
            </p>
          </div>
        </div>

        <div className="relative">
          <div className="flex items-center justify-end gap-1 pb-3">
            <button onClick={scrollPrev} className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent transition-colors" aria-label="Previous template">
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <button onClick={scrollNext} className="w-8 h-8 rounded-full border border-border/60 flex items-center justify-center hover:bg-accent transition-colors" aria-label="Next template">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="absolute left-0 top-11 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-11 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {templates.map((tmpl) => (
                <div key={tmpl.id} className="flex-[0_0_78%] sm:flex-[0_0_48%] lg:flex-[0_0_30%] min-w-0">
                  <Card className="prachar-studio-card h-full overflow-hidden">
                    <div className={`h-24 bg-gradient-to-br ${tmpl.gradient} flex items-center justify-center`}>
                      <tmpl.icon className="w-8 h-8 text-white/80" />
                    </div>
                    <CardContent className="pt-4 pb-5 space-y-3">
                      <div>
                        <p className="shell-copy">{t('Template lane', 'टेम्पलेट धारा')}</p>
                        <h3 className="mt-1 text-sm font-semibold font-devanagari">{t(tmpl.name, tmpl.nameHi)}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{t(tmpl.desc, tmpl.descHi)}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs h-8 w-full"
                        disabled
                        title="Template generation flow is not implemented yet"
                      >
                        {t('Preview format', 'प्रारूप पूर्वावलोकन')}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3">
            {templates.map((_, i) => (
              <button
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === selectedIndex ? 'bg-primary w-4' : 'bg-muted-foreground/30'}`}
                onClick={() => emblaApi?.scrollTo(i)}
                aria-label={`Go to template ${i + 1}`}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground text-center pt-1">
          {t('Need sharper campaign language?', 'क्या अभियान की भाषा और स्पष्ट चाहिए?')} <Link href="/vimarsh" className="text-primary underline-offset-2 hover:underline">{t('Explore Vimarsh topics', 'विमर्श विषय देखें')}</Link>
        </p>
      </section>
    </motion.div>
  );
}
