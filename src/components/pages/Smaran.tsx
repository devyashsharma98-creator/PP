"use client";

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BellRing, CheckSquare, CalendarClock, AlertTriangle,
  Clock, AlertCircle, Sparkles, ExternalLink,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { useReminders } from '@/hooks/api/use-reminders';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';

// ── Types ────────────────────────────────────────────────────────────────

interface ReminderItem {
  type: "task" | "event";
  id: string;
  title: string;
  titleHi: string | null;
  date: string;
  status: string;
  href: string;
}


// ── Helpers ──────────────────────────────────────────────────────────────

function formatRelativeDate(dateStr: string, t: (en: string, hi: string) => string): { label: string; labelHi: string } {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diffDays = Math.round((d.getTime() - now.getTime()) / 86400000);

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    if (abs === 1) return { label: "1 day overdue", labelHi: "1 दिन विलंब" };
    return { label: `${abs} days overdue`, labelHi: `${abs} दिन विलंब` };
  }
  if (diffDays === 0) return { label: "Today", labelHi: "आज" };
  if (diffDays === 1) return { label: "Tomorrow", labelHi: "कल" };
  if (diffDays <= 7) return { label: `In ${diffDays} days`, labelHi: `${diffDays} दिन में` };
  return { label: `${diffDays} days away`, labelHi: `${diffDays} दिन शेष` };
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ── Section Component ────────────────────────────────────────────────────

function ReminderSection({
  title, titleHi, icon, items, accent, emptyMsg, emptyMsgHi, t, isHi,
}: {
  title: string; titleHi: string; icon: React.ReactNode; items: ReminderItem[];
  accent: string; emptyMsg: string; emptyMsgHi: string;
  t: (en: string, hi: string) => string; isHi: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", accent)}>
          {icon}
        </div>
        <span className="section-seal">{t(title, titleHi)}</span>
        <Badge className={cn("text-[9px] font-bold", accent)}>{items.length}</Badge>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 bg-muted/15 rounded-[2rem] border border-dashed border-border/50">
          <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground/20" />
          <p className="text-sm font-bold text-muted-foreground/50 font-devanagari">{t(emptyMsg, emptyMsgHi)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const rel = formatRelativeDate(item.date, t);
            const isOverdue = rel.label.includes("overdue");
            return (
              <a
                key={`${item.type}-${item.id}`}
                href={item.href}
                className="block group"
              >
                <div className={cn(
                  "flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all",
                  isOverdue
                    ? "bg-red-500/[0.03] border-red-500/20 hover:border-red-500/40"
                    : "bg-background/40 border-border/50 hover:border-primary/20"
                )}>
                  {/* Type icon */}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    item.type === "task"
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                      : "bg-violet-500/10 border-violet-500/20 text-violet-500"
                  )}>
                    {item.type === "task" ? <CheckSquare className="w-5 h-5" /> : <CalendarClock className="w-5 h-5" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground/90 truncate font-devanagari group-hover:text-primary transition-colors">
                      {isHi && item.titleHi ? item.titleHi : item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground flex-wrap">
                      <span className={cn(
                        "font-bold uppercase tracking-widest",
                        isOverdue ? "text-red-500" : ""
                      )}>
                        {formatDateShort(item.date)}
                      </span>
                      <span className="text-border/60">·</span>
                      <span className="capitalize">{item.type}</span>
                    </div>
                  </div>

                  {/* Relative date badge */}
                  <div className="shrink-0">
                    <Badge className={cn(
                      "text-[8px] font-bold uppercase tracking-widest whitespace-nowrap",
                      isOverdue
                        ? "bg-red-500/10 text-red-600 border-red-500/30"
                        : "bg-muted/60 text-muted-foreground border-border/50"
                    )}>
                      {isHi ? rel.labelHi : rel.label}
                    </Badge>
                  </div>

                  <ExternalLink className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors shrink-0 mt-1" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────

function SmaranSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i}>
          <div className="h-6 w-48 rounded-lg bg-muted/40 mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} className="h-20 rounded-2xl bg-muted/30 border border-border/50" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function Smaran() {
  const { lang } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';

  const { data, isLoading: loading, isError: error, refetch } = useReminders();

  const contexts = data ? [
    {
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      labelEn: "Overdue",
      labelHi: "विलंब",
      valueEn: `${data.counts.overdue}`,
      valueHi: `${data.counts.overdue}`,
      detailEn: "Items past deadline",
      detailHi: "समय-सीमा पार आइटम",
    },
    {
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      labelEn: "Due This Week",
      labelHi: "इस सप्ताह",
      valueEn: `${data.counts.dueThisWeek}`,
      valueHi: `${data.counts.dueThisWeek}`,
      detailEn: "Deadlines in 7 days",
      detailHi: "7 दिनों में समय-सीमा",
    },
    {
      icon: <BellRing className="w-5 h-5 text-primary" />,
      labelEn: "Upcoming",
      labelHi: "आगामी",
      valueEn: `${data.counts.upcoming}`,
      valueHi: `${data.counts.upcoming}`,
      detailEn: "Within 30 days",
      detailHi: "30 दिनों के भीतर",
    },
  ] : undefined;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <Masthead
        title="Smaran"
        titleHi="स्मरण"
        seal="Deadlines & Reminders"
        sealHi="समय-सीमा एवं स्मरण"
        subtitle="Track your upcoming deadlines, due tasks, and event dates across all modules. Never miss an important date again."
        subtitleHi="सभी मॉड्यूल में अपनी आगामी समय-सीमाएँ, देय कार्य और कार्यक्रम तिथियाँ ट्रैक करें। कभी भी कोई महत्वपूर्ण तिथि न चूकें।"
        icon={<BellRing className="w-7 h-7 text-primary" />}
        contexts={contexts}
      />

      {error && !loading ? (
        <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
            <AlertTriangle className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
            {t('Unable to load reminders.', 'स्मरण लोड करने में असमर्थ।')}
          </p>
          <button onClick={() => refetch()} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px] min-h-[44px]">
            {t('Retry', 'पुनः प्रयास करें')}
          </button>
        </div>
      ) : loading ? (
        <SmaranSkeleton />
      ) : data ? (
        <div className="space-y-10">
          {data.overdue.length === 0 && data.dueThisWeek.length === 0 && data.upcoming.length === 0 ? (
            <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-xl font-bold text-muted-foreground/60 font-devanagari">
                {t('Nothing on your plate! 🎉', 'कोई कार्य नहीं! 🎉')}
              </p>
              <p className="text-sm text-muted-foreground/40 mt-2">
                {t('All caught up. Enjoy the peace.', 'सब व्यवस्थित है। शांति का आनंद लें।')}
              </p>
            </div>
          ) : (
            <>
              {data.overdue.length > 0 && (
                <ReminderSection
                  title="Overdue"
                  titleHi="विलंब"
                  icon={<AlertCircle className="w-5 h-5 text-red-500" />}
                  items={data.overdue}
                  accent="bg-red-500/10 text-red-600"
                  emptyMsg="Nothing overdue 🎉"
                  emptyMsgHi="कोई विलंब नहीं 🎉"
                  t={t}
                  isHi={isHi}
                />
              )}

              {data.dueThisWeek.length > 0 && (
                <ReminderSection
                  title="Due This Week"
                  titleHi="इस सप्ताह"
                  icon={<Clock className="w-5 h-5 text-amber-500" />}
                  items={data.dueThisWeek}
                  accent="bg-amber-500/10 text-amber-600"
                  emptyMsg="Nothing due this week 🎉"
                  emptyMsgHi="इस सप्ताह कुछ नहीं 🎉"
                  t={t}
                  isHi={isHi}
                />
              )}

              {data.upcoming.length > 0 && (
                <ReminderSection
                  title="Upcoming"
                  titleHi="आगामी"
                  icon={<BellRing className="w-5 h-5 text-primary" />}
                  items={data.upcoming}
                  accent="bg-primary/10 text-primary"
                  emptyMsg="Nothing upcoming"
                  emptyMsgHi="कुछ आगामी नहीं"
                  t={t}
                  isHi={isHi}
                />
              )}
            </>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
