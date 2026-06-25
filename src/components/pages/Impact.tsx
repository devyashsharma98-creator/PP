"use client";

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy, FileText, Star, Users, Calendar, Megaphone,
  TrendingUp, Medal, Award, BarChart3, ChevronRight,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';
import { SCORE_WEIGHTS, getLevel, computeScore } from '@/lib/contributions';

// ── Types ──────────────────────────────────────────────────────────────────

interface ContributionMetrics {
  authored: number;
  published: number;
  reviews: number;
  events: number;
  circulars: number;
}

interface MyImpactData {
  userId: string;
  metrics: ContributionMetrics;
  score: number;
  level: string;
  levelHi: string;
  rank: number;
  totalContributors: number;
}

interface LeaderboardEntry {
  userId: string;
  name: string | null;
  nameHi: string | null;
  metrics: ContributionMetrics;
  score: number;
  level: string;
  levelHi: string;
}

type Tab = "my-impact" | "leaderboard";

// ── Sub-components ─────────────────────────────────────────────────────────

function MetricCard({
  icon,
  labelEn,
  labelHi,
  value,
  color,
}: {
  icon: React.ReactNode;
  labelEn: string;
  labelHi: string;
  value: number;
  color: string;
}) {
  const t = useT();
  return (
    <Card className="institution-panel-muted border-border/50 bg-background/40 overflow-hidden group hover:border-primary/30 transition-all">
      <CardContent className="py-5 px-5">
        <div className="flex items-center gap-4">
          <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110", color)}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="shell-copy text-[9px]">{t(labelEn, labelHi)}</p>
            <p className="text-2xl font-bold tracking-tight text-foreground/90">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LevelBadge({ level, levelHi, score }: { level: string; levelHi: string; score?: number }) {
  const colors: Record<string, string> = {
    "Pravah Ratna": "bg-amber-500/15 text-amber-600 border-amber-400/30",
    "Vichaarak": "bg-primary/10 text-primary border-primary/20",
    "Sakriya": "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    "Naya Yogi": "bg-sky-500/10 text-sky-600 border-sky-500/30",
  };
  return (
    <div className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-[0.15em]",
      colors[level] ?? "bg-muted text-muted-foreground border-border/60"
    )}>
      <Award className="w-4 h-4" />
      {level}
      {score !== undefined && (
        <span className="text-muted-foreground/60 font-normal normal-case ml-1">({score} pts)</span>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  rank,
  isCurrentUser,
  isHi,
  t,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isCurrentUser: boolean;
  isHi: boolean;
  t: (en: string, hi: string) => string;
}) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const initials = (entry.name ?? "??")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all",
        isCurrentUser
          ? "bg-primary/5 border-primary/30 ring-1 ring-primary/20"
          : "bg-background/40 border-border/50 hover:border-primary/20"
      )}
    >
      {/* Rank */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold",
        rank <= 3 ? "bg-amber-500/10 text-amber-600 text-lg" : "bg-muted/60 text-muted-foreground"
      )}>
        {medal ?? `#${rank}`}
      </div>

      {/* Avatar initials */}
      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
        {initials}
      </div>

      {/* Name + Level */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate font-devanagari text-foreground/90">
          {isHi && entry.nameHi ? entry.nameHi : entry.name ?? "Unknown"}
        </p>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
          {isHi ? entry.levelHi : entry.level}
        </p>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className="text-lg font-bold text-foreground/90">{entry.score}</p>
        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{t('pts', 'अंक')}</p>
      </div>

      {isCurrentUser && (
        <Badge className="text-[8px] bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-2 py-0 shrink-0">
          {t('You', 'आप')}
        </Badge>
      )}
    </div>
  );
}

// ── Loading Skeleton ───────────────────────────────────────────────────────

function ImpactSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-muted/40 border border-border/50" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-muted/30 border border-border/50" />
    </div>
  );
}

// ── Score Explanation ──────────────────────────────────────────────────────

function ScoreExplanation({ t, isHi }: { t: (en: string, hi: string) => string; isHi: boolean }) {
  return (
    <div className="text-center py-6 px-4">
      <p className="shell-copy text-[10px] mb-3">{t('How score is calculated', 'स्कोर की गणना कैसे होती है')}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[10px] font-bold text-muted-foreground">
        <span>{t('Authored', 'लेखन')} ×{SCORE_WEIGHTS.authored}</span>
        <span>{t('Published', 'प्रकाशित')} ×{SCORE_WEIGHTS.published}</span>
        <span>{t('Reviews', 'समीक्षा')} ×{SCORE_WEIGHTS.reviews}</span>
        <span>{t('Events', 'आयोजन')} ×{SCORE_WEIGHTS.events}</span>
        <span>{t('Circulars', 'परिपत्र')} ×{SCORE_WEIGHTS.circulars}</span>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function Impact() {
  const { lang } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';

  const [tab, setTab] = useState<Tab>("my-impact");
  const [myData, setMyData] = useState<MyImpactData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const currentUserId = null as string | null; // populated from leaderboard data

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    Promise.all([
      fetch("/api/v1/contributions/me").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/v1/contributions/leaderboard").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([meJson, lbJson]) => {
        if (!active) return;
        if (meJson?.success && meJson.data) setMyData(meJson.data as MyImpactData);
        if (lbJson?.success && Array.isArray(lbJson.data)) setLeaderboard(lbJson.data as LeaderboardEntry[]);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const levelColors: Record<string, string> = {
    "Pravah Ratna": "bg-amber-500/10 border-amber-400/30 text-amber-600",
    "Vichaarak": "bg-primary/10 border-primary/20 text-primary",
    "Sakriya": "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
    "Naya Yogi": "bg-sky-500/10 border-sky-500/30 text-sky-600",
  };

  const contexts = myData
    ? [
        {
          icon: <Trophy className="w-5 h-5" />,
          labelEn: "Total Score",
          labelHi: "कुल अंक",
          valueEn: `${myData.score} Points`,
          valueHi: `${myData.score} अंक`,
          detailEn: myData.level,
          detailHi: myData.levelHi,
        },
        {
          icon: <Medal className="w-5 h-5" />,
          labelEn: "Global Rank",
          labelHi: "वैश्विक रैंक",
          valueEn: myData.rank > 0
            ? `#${myData.rank} of ${myData.totalContributors}`
            : "Unranked",
          valueHi: myData.rank > 0
            ? `#${myData.rank} / ${myData.totalContributors}`
            : "अवर्गीकृत",
          detailEn: "Among contributors in your organisation.",
          detailHi: "आपके संगठन के योगदानकर्ताओं में।",
        },
        {
          icon: <BarChart3 className="w-5 h-5" />,
          labelEn: "Activities",
          labelHi: "गतिविधियाँ",
          valueEn: `${myData.metrics.authored + myData.metrics.published + myData.metrics.reviews + myData.metrics.events + myData.metrics.circulars} Total Actions`,
          valueHi: `${myData.metrics.authored + myData.metrics.published + myData.metrics.reviews + myData.metrics.events + myData.metrics.circulars} कुल कार्य`,
          detailEn: "Across articles, reviews, events and circulars.",
          detailHi: "आलेख, समीक्षा, आयोजन और परिपत्र में।",
        },
      ]
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <Masthead
        title="My Impact"
        titleHi="मेरा योगदान"
        seal="Contribution & Recognition"
        sealHi="योगदान एवं सम्मान"
        subtitle="Track your contributions across articles, reviews, events, and circulars. See your rank and level on the organisational leaderboard."
        subtitleHi="आलेख, समीक्षा, आयोजन और परिपत्र में अपने योगदान को ट्रैक करें। संगठनात्मक लीडरबोर्ड पर अपनी रैंक और स्तर देखें।"
        icon={<TrendingUp className="w-7 h-7 text-primary" />}
        contexts={!loading && !error && !!myData ? contexts : undefined}
      />

      {/* Tab Toggle */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted/40 border border-border/60 w-fit mx-auto sm:mx-0">
        {[
          { key: "my-impact" as Tab, en: "My Impact", hi: "मेरा योगदान" },
          { key: "leaderboard" as Tab, en: "Leaderboard", hi: "लीडरबोर्ड" },
        ].map((tItem) => (
          <button
            key={tItem.key}
            onClick={() => setTab(tItem.key)}
            className={cn(
              "px-6 py-2.5 min-h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-[0.16em] transition-all whitespace-nowrap",
              tab === tItem.key
                ? "bg-background text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t(tItem.en, tItem.hi)}
          </button>
        ))}
      </div>

      {loading ? (
        <ImpactSkeleton />
      ) : error ? (
        <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
            <TrendingUp className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
            {t('Unable to load contribution data.', 'योगदान डेटा लोड करने में असमर्थ।')}
          </p>
          <Button variant="link" onClick={() => window.location.reload()} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px]">
            {t('Retry', 'पुनः प्रयास करें')}
          </Button>
        </div>
      ) : tab === "my-impact" && myData ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="my-impact"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Hero Score */}
            <Card className="institution-panel border-primary/20 bg-gradient-to-br from-background/80 via-background/60 to-primary/[0.03] overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
              <CardContent className="py-10 px-8 md:px-12 text-center">
                <div className="space-y-4">
                  <p className="section-seal inline-flex mx-auto">{t('Your Contribution Score', 'आपका योगदान स्कोर')}</p>
                  <div className="text-7xl md:text-8xl font-black tracking-tighter text-foreground/80">
                    {myData.score}
                  </div>
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <LevelBadge level={myData.level} levelHi={myData.levelHi} />
                    {myData.rank > 0 && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-bold uppercase tracking-widest px-4 py-2 rounded-xl">
                        #{myData.rank} {t('of', 'का')} {myData.totalContributors}
                      </Badge>
                    )}
                  </div>
                  <ScoreExplanation t={t} isHi={isHi} />
                </div>
              </CardContent>
            </Card>


            <Card className="institution-panel-muted border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="shell-copy">{t('Start next contribution', 'Start next contribution')}</p>
                  <p className="text-sm text-muted-foreground">{t('Add work that directly moves this score: write, organise, or distribute.', 'Add work that directly moves this score: write, organise, or distribute.')}</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/aalekh" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto gap-2" size="sm">
                      <FileText className="h-4 w-4" />
                      {t('Write Aalekh', 'Write Aalekh')}
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto gap-2" size="sm">
                      <Calendar className="h-4 w-4" />
                      {t('Create Event', 'Create Event')}
                    </Button>
                  </Link>
                  <Link href="/prachar" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto gap-2" size="sm">
                      <Megaphone className="h-4 w-4" />
                      {t('Close Prachar', 'Close Prachar')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                icon={<FileText className="w-5 h-5 text-blue-500" />}
                labelEn="Authored"
                labelHi="लेखन"
                value={myData.metrics.authored}
                color="bg-blue-500/10 border-blue-500/20 text-blue-500"
              />
              <MetricCard
                icon={<Star className="w-5 h-5 text-amber-500" />}
                labelEn="Published"
                labelHi="प्रकाशित"
                value={myData.metrics.published}
                color="bg-amber-500/10 border-amber-500/20 text-amber-500"
              />
              <MetricCard
                icon={<Users className="w-5 h-5 text-emerald-500" />}
                labelEn="Reviews Done"
                labelHi="समीक्षाएँ"
                value={myData.metrics.reviews}
                color="bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              />
              <MetricCard
                icon={<Calendar className="w-5 h-5 text-violet-500" />}
                labelEn="Events Organised"
                labelHi="आयोजन"
                value={myData.metrics.events}
                color="bg-violet-500/10 border-violet-500/20 text-violet-500"
              />
              <MetricCard
                icon={<Megaphone className="w-5 h-5 text-rose-500" />}
                labelEn="Circulars Issued"
                labelHi="परिपत्र"
                value={myData.metrics.circulars}
                color="bg-rose-500/10 border-rose-500/20 text-rose-500"
              />
            </div>

            {/* Levels Info */}
            <Card className="institution-panel-muted border-border/50 bg-background/30">
              <CardContent className="py-6 px-6">
                <p className="shell-copy text-[10px] mb-4">{t('Contribution Levels', 'योगदान स्तर')}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { min: 0, max: 9, level: "Naya Yogi", hi: "नया योगी", color: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
                    { min: 10, max: 29, level: "Sakriya", hi: "सक्रिय", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
                    { min: 30, max: 69, level: "Vichaarak", hi: "विचारक", color: "bg-primary/10 text-primary border-primary/20" },
                    { min: 70, max: null, level: "Pravah Ratna", hi: "प्रवाह रत्न", color: "bg-amber-500/10 text-amber-600 border-amber-400/30" },
                  ].map((l) => (
                    <div key={l.level} className={cn("rounded-xl border px-4 py-3 text-center", l.color)}>
                      <p className="text-[10px] font-bold uppercase tracking-widest">{l.level}</p>
                      <p className="font-devanagari text-[9px] opacity-80">{l.hi}</p>
                      <p className="text-[8px] font-bold mt-1 opacity-60">
                        {l.min}–{l.max ?? "∞"} pts
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : tab === "leaderboard" ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <span className="section-seal">{t('Organisation Leaderboard', 'संगठन लीडरबोर्ड')}</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {t(`Top ${leaderboard.length} Contributors`, `शीर्ष ${leaderboard.length} योगदानकर्ता`)}
              </p>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
                  <Trophy className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
                  {t('No contributions yet.', 'अभी कोई योगदान नहीं।')}
                </p>
                <p className="text-sm text-muted-foreground/40 mt-2">
                  {t('Start writing articles or organising events to appear here.', 'यहाँ दिखने के लिए आलेख लिखना या आयोजन करना शुरू करें।')}
                </p>
                <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                  <Link href="/aalekh" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto gap-2" size="sm">
                      <FileText className="h-4 w-4" />
                      {t('Create first contribution', 'Create first contribution')}
                    </Button>
                  </Link>
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto gap-2" size="sm">
                      <Calendar className="h-4 w-4" />
                      {t('Plan event', 'Plan event')}
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, idx) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    rank={idx + 1}
                    isCurrentUser={entry.userId === (myData?.userId ?? currentUserId)}
                    isHi={isHi}
                    t={t}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : null}
    </motion.div>
  );
}
