"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3, MessageCircle, Send, Globe, Camera,
  CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';

// ── Types ────────────────────────────────────────────────────────────────

interface PlatformStat {
  platform: string;
  total: number;
  done: number;
  skipped: number;
  pending: number;
  completionRate: number;
}

interface EntityTypeStat {
  total: number;
  done: number;
  completionRate: number;
}

interface AnalyticsData {
  overall: {
    total: number;
    done: number;
    skipped: number;
    pending: number;
    completionRate: number;
  };
  byPlatform: PlatformStat[];
  byEntityType: {
    event: EntityTypeStat;
    article: EntityTypeStat;
  };
  pendingEntities: number;
}

// ── Platform config ───────────────────────────────────────────────────────

const PLATFORM_CONFIG: Record<string, { icon: React.ReactNode; labelEn: string; labelHi: string; color: string }> = {
  whatsapp: {
    icon: <MessageCircle className="w-5 h-5" />,
    labelEn: "WhatsApp",
    labelHi: "व्हाट्सएप",
    color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  },
  facebook: {
    icon: <Globe className="w-5 h-5" />,
    labelEn: "Facebook",
    labelHi: "फेसबुक",
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  instagram: {
    icon: <Camera className="w-5 h-5" />,
    labelEn: "Instagram",
    labelHi: "इंस्टाग्राम",
    color: "bg-pink-500/10 text-pink-600 border-pink-500/30",
  },
  telegram: {
    icon: <Send className="w-5 h-5" />,
    labelEn: "Telegram",
    labelHi: "टेलीग्राम",
    color: "bg-sky-500/10 text-sky-600 border-sky-500/30",
  },
};

// ── Loading Skeleton ──────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/30 border border-border/50" />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-muted/30 border border-border/50" />
      <div className="h-32 rounded-2xl bg-muted/20 border border-border/50" />
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────

function ProgressBar({ value, accent }: { value: number; accent: string }) {
  return (
    <div className="w-full h-2.5 rounded-full bg-muted/40 overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", accent)}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

// ── Platform Row ──────────────────────────────────────────────────────────

function PlatformRow({ data, t, isHi }: { data: PlatformStat; t: (en: string, hi: string) => string; isHi: boolean }) {
  const cfg = PLATFORM_CONFIG[data.platform];
  const rateColor = data.completionRate >= 80 ? "bg-emerald-500"
    : data.completionRate >= 40 ? "bg-amber-500"
    : "bg-red-500";

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-background/40 border border-border/50 hover:border-primary/20 transition-all">
      {/* Icon */}
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border", cfg?.color ?? "bg-muted/60 text-muted-foreground border-border/60")}>
        {cfg?.icon ?? <BarChart3 className="w-5 h-5" />}
      </div>

      {/* Platform name */}
      <div className="w-28 shrink-0">
        <p className="font-bold text-sm text-foreground/90">{cfg?.labelEn ?? data.platform}</p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground font-devanagari">{cfg?.labelHi ?? data.platform}</p>
      </div>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <ProgressBar value={data.completionRate} accent={rateColor} />
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 shrink-0 text-[10px] font-bold">
        <span className="text-emerald-500">{data.done}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-red-400">{data.skipped}</span>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground/60">{data.pending}</span>
        <span className="text-muted-foreground ml-1">{t('total', 'कुल')} {data.total}</span>
      </div>

      {/* Rate badge */}
      <Badge className={cn("text-[10px] font-bold whitespace-nowrap", rateColor === "bg-emerald-500" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : rateColor === "bg-amber-500" ? "bg-amber-500/10 text-amber-600 border-amber-500/30" : "bg-red-500/10 text-red-600 border-red-500/30")}>
        {data.completionRate}%
      </Badge>
    </div>
  );
}

// ── Entity Type Card ──────────────────────────────────────────────────────

function EntityTypeCard({
  label, labelHi, icon, data, accent, t, isHi,
}: {
  label: string; labelHi: string; icon: React.ReactNode; data: EntityTypeStat; accent: string; t: (en: string, hi: string) => string; isHi: boolean;
}) {
  return (
    <Card className="institution-panel-muted border-border/50 bg-background/40">
      <CardContent className="py-5 px-5">
        <div className="flex items-center gap-4">
          <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border", accent)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="shell-copy text-[9px]">{t(label, labelHi)}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground/90">
              {data.completionRate}%
            </p>
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>{data.done} {t('done', 'पूर्ण')}</span>
              <span className="text-border/60">·</span>
              <span>{data.total} {t('total', 'कुल')}</span>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={data.completionRate} accent={accent} />
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function PracharVishleshan() {
  const { lang } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch("/api/v1/prachar/analytics");
      const json = await r.json();
      if (json.success) setData(json.data as AnalyticsData);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const contexts = data ? [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      labelEn: "Completion",
      labelHi: "पूर्णता",
      valueEn: `${data.overall.completionRate}%`,
      valueHi: `${data.overall.completionRate}%`,
      detailEn: "Overall dissemination coverage",
      detailHi: "कुल प्रसार आच्छादन",
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      labelEn: "Done",
      labelHi: "पूर्ण",
      valueEn: `${data.overall.done}`,
      valueHi: `${data.overall.done}`,
      detailEn: "Successfully disseminated",
      detailHi: "सफलतापूर्वक प्रसारित",
    },
    {
      icon: <XCircle className="w-5 h-5 text-red-400" />,
      labelEn: "Skipped",
      labelHi: "छोड़े गए",
      valueEn: `${data.overall.skipped}`,
      valueHi: `${data.overall.skipped}`,
      detailEn: "Marked as not applicable",
      detailHi: "अप्रासंगिक चिह्नित",
    },
    {
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      labelEn: "Pending",
      labelHi: "लंबित",
      valueEn: `${data.overall.pending}`,
      valueHi: `${data.overall.pending}`,
      detailEn: `${data.pendingEntities} entities incomplete`,
      detailHi: `${data.pendingEntities} इकाइयाँ अधूरी`,
    },
  ] : undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <Masthead
        title="Prachar Vishleshan"
        titleHi="प्रचार विश्लेषण"
        seal="Dissemination Coverage"
        sealHi="प्रसार आच्छादन"
        subtitle="Track how published events and articles have been disseminated across social media platforms. Coverage is measured by completion status per platform."
        subtitleHi="प्रकाशित कार्यक्रमों और आलेखों का सोशल मीडिया प्लेटफ़ॉर्म पर प्रसार ट्रैक करें। आच्छादन प्रति प्लेटफ़ॉर्म पूर्णता स्थिति द्वारा मापा जाता है।"
        icon={<BarChart3 className="w-7 h-7 text-primary" />}
        contexts={contexts}
      />

      {error && !loading ? (
        <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
            {t('Unable to load analytics.', 'विश्लेषण लोड करने में असमर्थ।')}
          </p>
          <button onClick={fetchAnalytics} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px] min-h-[44px]">
            {t('Retry', 'पुनः प्रयास करें')}
          </button>
        </div>
      ) : loading ? (
        <AnalyticsSkeleton />
      ) : data && data.overall.total === 0 ? (
        <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
            <BarChart3 className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
            {t('No dissemination data yet.', 'अभी कोई प्रसार डेटा नहीं।')}
          </p>
          <p className="text-sm text-muted-foreground/40 mt-2">
            {t('Data will appear once prachar tasks are created for events and articles.', 'कार्यक्रमों और आलेखों के लिए प्रचार कार्य बनाए जाने पर डेटा दिखाई देगा।')}
          </p>
        </div>
      ) : data ? (
        <div className="space-y-8">
          {/* Per-platform breakdown */}
          <div className="space-y-4">
            <span className="section-seal">{t('Per Platform Coverage', 'प्लेटफ़ॉर्म आच्छादन')}</span>
            <div className="space-y-3">
              {data.byPlatform.map((p) => (
                <PlatformRow key={p.platform} data={p} t={t} isHi={isHi} />
              ))}
            </div>
          </div>

          {/* Entity type split */}
          <div className="space-y-4">
            <span className="section-seal">{t('By Content Type', 'सामग्री प्रकार के अनुसार')}</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EntityTypeCard
                label="Events"
                labelHi="कार्यक्रम"
                icon={<MessageCircle className="w-5 h-5 text-violet-500" />}
                data={data.byEntityType.event}
                accent="bg-violet-500"
                t={t}
                isHi={isHi}
              />
              <EntityTypeCard
                label="Articles"
                labelHi="आलेख"
                icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
                data={data.byEntityType.article}
                accent="bg-blue-500"
                t={t}
                isHi={isHi}
              />
            </div>
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
