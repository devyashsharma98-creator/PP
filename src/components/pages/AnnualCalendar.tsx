"use client";

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, ChevronRight, CalendarDays, Bell,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  Users, FileText, Layers, RotateCcw, Calendar,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/useT';
import type { LucideIcon } from 'lucide-react';

// ── Aayam colour palette ─────────────────────────────────────────────────────
const AAYAM: Record<string, { dot: string; chip: string; label: string; labelHi: string }> = {
  Yuva:    { dot: 'bg-orange-500',  chip: 'bg-orange-500/15 text-orange-600 border-orange-500/20',    label: 'Yuva',    labelHi: 'युवा' },
  Mahila:  { dot: 'bg-rose-500',    chip: 'bg-rose-500/15 text-rose-600 border-rose-500/20',          label: 'Mahila',  labelHi: 'महिला' },
  Shodh:   { dot: 'bg-blue-500',    chip: 'bg-blue-500/15 text-blue-600 border-blue-500/20',          label: 'Shodh',   labelHi: 'शोध' },
  Prachar: { dot: 'bg-emerald-500', chip: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20', label: 'Prachar', labelHi: 'प्रचार' },
  Vimarsh: { dot: 'bg-violet-500',  chip: 'bg-violet-500/15 text-violet-600 border-violet-500/20',   label: 'Vimarsh', labelHi: 'विमर्श' },
  Vibhag:  { dot: 'bg-primary',     chip: 'bg-primary/15 text-primary border-primary/20',            label: 'Vibhag',  labelHi: 'विभाग' },
};

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; labelHi: string; chip: string; icon: LucideIcon }> = {
  'Draft':                  { label: 'Draft',            labelHi: 'प्रारूप',            chip: 'bg-secondary text-secondary-foreground',  icon: FileText },
  'Pending Aayam Review':   { label: 'Pending Review',   labelHi: 'समीक्षा प्रतीक्षित', chip: 'bg-warning/15 text-warning',              icon: Clock },
  'Pending Final Approval': { label: 'Pending Approval', labelHi: 'अनुमोदन प्रतीक्षित', chip: 'bg-orange-500/15 text-orange-600',         icon: AlertCircle },
  'Published':              { label: 'Published',        labelHi: 'प्रकाशित',           chip: 'bg-success/15 text-success',              icon: CheckCircle2 },
};

// ── Static org-wide calendar events ──────────────────────────────────────────
interface CalEvent {
  id: string;
  title: string;
  titleHi: string;
  date: string;
  aayam: string;
  status: string;
  location?: string;
  recurring?: boolean;
  note?: string;
}

const STATIC_EVENTS: CalEvent[] = [
  { id: 's1',  title: 'Youth & Dharma Sangam',      titleHi: 'युवा धर्म संगम',           date: '2026-02-28', aayam: 'Yuva',    status: 'Published',              recurring: true, note: 'Annual' },
  { id: 's2',  title: 'IKS Book Discussion',         titleHi: 'IKS पुस्तक चर्चा',         date: '2026-02-25', aayam: 'Shodh',   status: 'Published' },
  { id: 's3',  title: 'Mahila Shakti Sangam',        titleHi: 'महिला शक्ति संगम',         date: '2026-03-08', aayam: 'Mahila',  status: 'Published',              note: "Women's Day" },
  { id: 's4',  title: 'Counter Narrative Workshop',  titleHi: 'प्रति-विचार कार्यशाला',    date: '2026-03-15', aayam: 'Vimarsh', status: 'Pending Aayam Review' },
  { id: 's5',  title: 'Prachar Review Meet',         titleHi: 'प्रचार समीक्षा बैठक',      date: '2026-03-01', aayam: 'Prachar', status: 'Published' },
  { id: 's6',  title: 'Prant Adhiveshan',            titleHi: 'प्रांत अधिवेशन',           date: '2026-03-22', aayam: 'Vibhag',  status: 'Pending Final Approval', recurring: true },
  { id: 's7',  title: 'Vedic Math Workshop',         titleHi: 'वैदिक गणित कार्यशाला',     date: '2026-02-27', aayam: 'Shodh',   status: 'Published' },
  { id: 's8',  title: 'Social Media Drive',          titleHi: 'सोशल मीडिया अभियान',       date: '2026-03-10', aayam: 'Prachar', status: 'Pending Aayam Review' },
  { id: 's9',  title: 'Vichardhara Sangosthi',       titleHi: 'विचारधारा संगोष्ठी',       date: '2026-03-18', aayam: 'Vimarsh', status: 'Published',              recurring: true },
  { id: 's10', title: 'IKS Lecture Series',          titleHi: 'IKS व्याख्यान श्रृंखला',   date: '2026-02-23', aayam: 'Shodh',   status: 'Published' },
  { id: 's11', title: 'Yuva Niti Vimarsh',           titleHi: 'युवा नीति विमर्श',         date: '2026-03-05', aayam: 'Yuva',    status: 'Pending Aayam Review' },
  { id: 's12', title: 'Prant Sammelan',              titleHi: 'प्रांत सम्मेलन',           date: '2026-03-28', aayam: 'Vibhag',  status: 'Published',              recurring: true },
  { id: 's13', title: 'Mahila Leadership Camp',      titleHi: 'महिला नेतृत्व शिविर',      date: '2026-04-05', aayam: 'Mahila',  status: 'Published' },
  { id: 's14', title: 'Digital Prachar Workshop',    titleHi: 'डिजिटल प्रचार कार्यशाला',  date: '2026-04-12', aayam: 'Prachar', status: 'Pending Aayam Review' },
  { id: 's15', title: 'Dharma Debate — Vimarsh',     titleHi: 'धर्म वाद-विवाद — विमर्श',  date: '2026-04-20', aayam: 'Vimarsh', status: 'Published' },
];

const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTHS_HI = ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्टूबर','नवंबर','दिसंबर'];
const DAYS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
const DAYS_HI = ['र','सो','म','बु','गु','शु','श'];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, iconWrapClass, valueClass }: {
  icon: LucideIcon; label: string; value: number | string; iconWrapClass: string; valueClass: string;
}) {
  return (
    <Card className="glass-card">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconWrapClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={cn('text-2xl font-bold tabular-nums', valueClass)}>{value}</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}

// ── Event chip (in calendar cell) ─────────────────────────────────────────────
function EventChip({ event, lang }: { event: CalEvent; lang: string }) {
  const aayam = AAYAM[event.aayam] ?? AAYAM.Vibhag;
  const isPending = event.status === 'Pending Aayam Review' || event.status === 'Pending Final Approval';
  return (
    <div className={cn(
      'text-[7px] sm:text-[8px] px-1 py-0.5 rounded truncate leading-tight font-medium border',
      aayam.chip,
      isPending && 'ring-1 ring-warning/50',
    )}>
      {lang === 'hi' ? event.titleHi : event.title}
    </div>
  );
}

// ── Event detail card (in side panel) ────────────────────────────────────────
function EventCard({ event, lang, actionLabel, onAction }: {
  event: CalEvent; lang: string; actionLabel?: string; onAction?: () => void;
}) {
  const aayam = AAYAM[event.aayam] ?? AAYAM.Vibhag;
  const status = STATUS[event.status] ?? STATUS['Draft'];
  const StatusIcon = status.icon;
  const title = lang === 'hi' ? event.titleHi : event.title;

  return (
    <div className="p-3 rounded-lg border border-border/50 bg-card/60 space-y-2 hover:border-primary/30 transition-colors">
      <div className="flex items-start gap-2">
        <p className="text-xs font-semibold leading-snug flex-1">{title}</p>
        {event.recurring && <RotateCcw className="w-3 h-3 text-warning shrink-0 mt-0.5" />}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge className={cn('text-[9px] px-1.5 py-0 border', aayam.chip)}>
          {lang === 'hi' ? aayam.labelHi : aayam.label}
        </Badge>
        <Badge className={cn('text-[9px] px-1.5 py-0 gap-0.5', status.chip)}>
          <StatusIcon className="w-2.5 h-2.5" />
          {lang === 'hi' ? status.labelHi : status.label}
        </Badge>
        {event.note && (
          <span className="text-[9px] text-muted-foreground italic">{event.note}</span>
        )}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 w-full" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnnualCalendar() {
  const today = new Date();
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [selDay, setSelDay]   = useState<number>(today.getDate());

  const { events, role, lang } = useAppContext();
  const t = useT();

  // Convert AppContext GatividhiEvents → CalEvent
  const dynamicEvents: CalEvent[] = useMemo(() =>
    events.map(e => ({
      id:      `ev-${e.id}`,
      title:   e.title,
      titleHi: e.title,
      date:    e.date,
      aayam:   'Vibhag',
      status:  e.status,
      location: e.unit,
    })), [events]);

  // Role-filtered event pool
  const allEvents: CalEvent[] = useMemo(() => {
    const pool = [...STATIC_EVENTS, ...dynamicEvents];
    switch (role) {
      case 'karyakarta':
        return pool.filter(e => e.status === 'Published');
      case 'unit_head':
        return pool;
      case 'aayam_pramukh':
        return pool.filter(e => e.status !== 'Draft');
      default: // vibhag_pramukh
        return pool;
    }
  }, [dynamicEvents, role]);

  // Month-scoped events
  const monthEvents = useMemo(() =>
    allEvents.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === month && d.getFullYear() === year;
    }), [allEvents, month, year]);

  // Selected-day events
  const selStr   = `${year}-${String(month + 1).padStart(2, '0')}-${String(selDay).padStart(2, '0')}`;
  const selEvents = allEvents.filter(e => e.date === selStr);

  // Upcoming (from today)
  const upcoming = useMemo(() =>
    allEvents
      .filter(e => new Date(e.date) >= new Date(today.toDateString()))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 8),
    [allEvents]);

  // Events needing action (per role)
  const pendingAction = useMemo(() => {
    switch (role) {
      case 'vibhag_pramukh': return allEvents.filter(e => e.status === 'Pending Final Approval');
      case 'aayam_pramukh':  return allEvents.filter(e => e.status === 'Pending Aayam Review');
      case 'unit_head':      return allEvents.filter(e => e.status === 'Draft');
      default:               return [];
    }
  }, [allEvents, role]);

  // Role-specific KPIs
  const kpis = useMemo(() => {
    const published = allEvents.filter(e => e.status === 'Published').length;
    const pending   = allEvents.filter(e => e.status === 'Pending Aayam Review' || e.status === 'Pending Final Approval').length;

    switch (role) {
      case 'vibhag_pramukh': return [
        { icon: Layers,       label: t('Total Events', 'कुल कार्यक्रम'),              value: allEvents.length,                                             iconWrapClass: 'bg-primary/10 text-primary',       valueClass: 'text-primary' },
        { icon: AlertCircle,  label: t('Pending Final Approval', 'अंतिम अनुमोदन'),   value: allEvents.filter(e => e.status === 'Pending Final Approval').length, iconWrapClass: 'bg-orange-500/10 text-orange-500', valueClass: 'text-orange-500' },
        { icon: CheckCircle2, label: t('Published', 'प्रकाशित'),                      value: published,                                                    iconWrapClass: 'bg-success/10 text-success',       valueClass: 'text-success' },
        { icon: Users,        label: t('Active Aayams', 'सक्रिय आयाम'),              value: 5,                                                            iconWrapClass: 'bg-info/10 text-info',             valueClass: 'text-info' },
      ];
      case 'aayam_pramukh': return [
        { icon: CalendarDays, label: t('This Month', 'इस माह के कार्यक्रम'),         value: monthEvents.length,                                           iconWrapClass: 'bg-primary/10 text-primary',       valueClass: 'text-primary' },
        { icon: Clock,        label: t('Pending My Review', 'मेरी समीक्षा प्रतीक्षित'), value: allEvents.filter(e => e.status === 'Pending Aayam Review').length, iconWrapClass: 'bg-warning/10 text-warning',    valueClass: 'text-warning' },
        { icon: CheckCircle2, label: t('Published', 'प्रकाशित'),                      value: published,                                                    iconWrapClass: 'bg-success/10 text-success',       valueClass: 'text-success' },
        { icon: TrendingUp,   label: t('Upcoming', 'आगामी कार्यक्रम'),               value: upcoming.length,                                              iconWrapClass: 'bg-violet-500/10 text-violet-500', valueClass: 'text-violet-500' },
      ];
      case 'unit_head': return [
        { icon: FileText,     label: t('All Events', 'सभी कार्यक्रम'),               value: allEvents.length,                                             iconWrapClass: 'bg-primary/10 text-primary',       valueClass: 'text-primary' },
        { icon: AlertCircle,  label: t('Drafts', 'प्रारूप'),                         value: allEvents.filter(e => e.status === 'Draft').length,            iconWrapClass: 'bg-muted/50 text-muted-foreground', valueClass: 'text-muted-foreground' },
        { icon: Clock,        label: t('Pending Approval', 'अनुमोदन प्रतीक्षित'),   value: pending,                                                      iconWrapClass: 'bg-warning/10 text-warning',       valueClass: 'text-warning' },
        { icon: CheckCircle2, label: t('Published', 'प्रकाशित'),                      value: published,                                                    iconWrapClass: 'bg-success/10 text-success',       valueClass: 'text-success' },
      ];
      default: return [ // karyakarta
        { icon: CalendarDays, label: t('Org Events', 'संगठन कार्यक्रम'),             value: allEvents.length,                                             iconWrapClass: 'bg-primary/10 text-primary',       valueClass: 'text-primary' },
        { icon: CheckCircle2, label: t('Published', 'प्रकाशित'),                      value: published,                                                    iconWrapClass: 'bg-success/10 text-success',       valueClass: 'text-success' },
        { icon: TrendingUp,   label: t('Upcoming', 'आगामी'),                         value: upcoming.length,                                              iconWrapClass: 'bg-blue-500/10 text-blue-600',     valueClass: 'text-blue-600' },
        { icon: RotateCcw,    label: t('Recurring Events', 'नियमित कार्यक्रम'),      value: allEvents.filter(e => e.recurring).length,                    iconWrapClass: 'bg-warning/10 text-warning',       valueClass: 'text-warning' },
      ];
    }
  }, [allEvents, monthEvents, upcoming, role, t]);

  // Navigation
  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelDay(today.getDate()); };

  const days = daysInMonth(year, month);
  const offset = firstDay(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const monthLabel = lang === 'hi' ? `${MONTHS_HI[month]} ${year}` : `${MONTHS_EN[month]} ${year}`;
  const dayHeaders = lang === 'hi' ? DAYS_HI : DAYS_EN;

  // Role headings
  const headings: Record<string, { en: string; hi: string }> = {
    vibhag_pramukh: { en: 'Organisation Calendar — Full View',     hi: 'संगठन पंचांग — पूर्ण दृश्य' },
    aayam_pramukh:  { en: 'Aayam Calendar — Review Dashboard',     hi: 'आयाम पंचांग — समीक्षा डैशबोर्ड' },
    unit_head:      { en: 'Unit Calendar — Event Management',       hi: 'इकाई पंचांग — कार्यक्रम प्रबंधन' },
    karyakarta:     { en: 'Annual Calendar — Organisation Schedule', hi: 'वार्षिक पंचांग — संगठन कार्यक्रम' },
  };
  const heading = headings[role] ?? headings.karyakarta;

  // Action label for event card
  const getActionLabel = (e: CalEvent): string | undefined => {
    if (role === 'vibhag_pramukh' && e.status === 'Pending Final Approval') return t('Approve', 'अनुमोदित करें');
    if (role === 'aayam_pramukh'  && e.status === 'Pending Aayam Review')   return t('Review', 'समीक्षा करें');
    if (role === 'unit_head'      && e.status === 'Draft')                   return t('Edit Draft', 'संपादित करें');
    return undefined;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">

      {/* Header */}
      <div>
        <h1 className={cn('text-2xl font-bold', lang === 'hi' && 'font-devanagari')}>
          {t(heading.en, heading.hi)}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t('Role-based scheduling across all aayams', 'सभी आयामों का भूमिका-आधारित पंचांग')}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Pending action banner */}
      {pendingAction.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="glass-card border-warning/30 bg-warning/5">
            <CardContent className="pt-3 pb-3 flex items-center gap-3 flex-wrap">
              <Bell className="w-4 h-4 text-warning shrink-0" />
              <p className={cn('text-sm font-medium text-warning', lang === 'hi' && 'font-devanagari')}>
                {t(
                  `${pendingAction.length} event${pendingAction.length > 1 ? 's' : ''} need${pendingAction.length === 1 ? 's' : ''} your action`,
                  `${pendingAction.length} कार्यक्रम आपकी कार्यवाही प्रतीक्षित`
                )}
              </p>
              <div className="flex flex-wrap gap-1.5 ml-auto">
                {pendingAction.slice(0, 3).map(e => (
                  <Badge key={e.id} className="text-[9px] bg-warning/15 text-warning">
                    {lang === 'hi' ? e.titleHi : e.title}
                  </Badge>
                ))}
                {pendingAction.length > 3 && (
                  <Badge className="text-[9px] bg-warning/15 text-warning">+{pendingAction.length - 3}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Calendar + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Calendar grid (2/3) ──────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card className="glass-card">
            <CardContent className="pt-4 px-3 sm:px-5">

              {/* Month navigation */}
              <div className="flex items-center justify-between mb-4">
                <h2 className={cn('text-base font-semibold', lang === 'hi' && 'font-devanagari')}>{monthLabel}</h2>
                <div className="flex items-center gap-1">
                  {!isCurrentMonth && (
                    <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={goToday}>
                      {t('Today', 'आज')}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={prev}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={next}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Day header row */}
              <div className="grid grid-cols-7 mb-1">
                {dayHeaders.map(d => (
                  <div key={d} className={cn('text-center text-[9px] sm:text-[10px] font-semibold text-muted-foreground py-1', lang === 'hi' && 'font-devanagari')}>{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: offset }).map((_, i) => (
                  <div key={`pad-${i}`} className="min-h-[52px] sm:min-h-[68px]" />
                ))}
                {Array.from({ length: days }).map((_, i) => {
                  const d = i + 1;
                  const dayEvts = monthEvents.filter(e => {
                    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    return e.date === ds;
                  });
                  const isToday    = isCurrentMonth && today.getDate() === d;
                  const isSelected = selDay === d;
                  const hasPending = dayEvts.some(e => e.status === 'Pending Aayam Review' || e.status === 'Pending Final Approval');

                  return (
                    <div
                      key={d}
                      onClick={() => setSelDay(d)}
                      className={cn(
                        'min-h-[52px] sm:min-h-[68px] p-0.5 sm:p-1 rounded-md border cursor-pointer transition-all select-none',
                        isSelected
                          ? 'border-primary bg-primary/8 ring-1 ring-primary/30'
                          : 'border-transparent hover:border-border/60 hover:bg-muted/30',
                        isToday && !isSelected && 'bg-primary/5 border-primary/20',
                      )}
                    >
                      <div className="flex items-center justify-between px-0.5 mb-0.5">
                        <p className={cn(
                          'text-[10px] sm:text-xs font-medium',
                          isToday   && 'text-primary font-bold',
                          isSelected && 'text-primary',
                        )}>{d}</p>
                        {hasPending && (
                          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvts.slice(0, 2).map(e => <EventChip key={e.id} event={e} lang={lang} />)}
                        {dayEvts.length > 2 && (
                          <p className="text-[7px] text-muted-foreground text-center leading-none">+{dayEvts.length - 2}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-2 sm:gap-3 mt-4 pt-3 border-t border-border/40">
                {Object.entries(AAYAM).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className={cn('w-2 h-2 rounded-sm shrink-0', cfg.dot)} />
                    <span className={cn('text-[9px] sm:text-[10px] text-muted-foreground', lang === 'hi' && 'font-devanagari')}>
                      {lang === 'hi' ? cfg.labelHi : cfg.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-warning shrink-0" />
                  <span className={cn('text-[9px] sm:text-[10px] text-muted-foreground', lang === 'hi' && 'font-devanagari')}>
                    {t('Pending Action', 'कार्यवाही प्रतीक्षित')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Side panel (1/3) ─────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Selected day / today's schedule */}
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
                <h3 className={cn('text-sm font-semibold', lang === 'hi' && 'font-devanagari')}>
                  {selDay === today.getDate() && isCurrentMonth
                    ? t("Today's Schedule", 'आज का कार्यक्रम')
                    : lang === 'hi'
                      ? `${selDay} ${MONTHS_HI[month]}`
                      : `${MONTHS_EN[month]} ${selDay}`}
                </h3>
                {selEvents.length > 0 && (
                  <Badge className="ml-auto text-[10px] bg-primary/10 text-primary">{selEvents.length}</Badge>
                )}
              </div>

              {selEvents.length === 0 ? (
                <p className={cn('text-xs text-muted-foreground text-center py-5', lang === 'hi' && 'font-devanagari')}>
                  {t('No events on this day', 'इस दिन कोई कार्यक्रम नहीं')}
                </p>
              ) : (
                <div className="space-y-2">
                  {selEvents.map(e => (
                    <EventCard
                      key={e.id}
                      event={e}
                      lang={lang}
                      actionLabel={getActionLabel(e)}
                      onAction={() => {}}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                <h3 className={cn('text-sm font-semibold', lang === 'hi' && 'font-devanagari')}>
                  {t('Upcoming Events', 'आगामी कार्यक्रम')}
                </h3>
              </div>

              {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t('No upcoming events', 'कोई आगामी कार्यक्रम नहीं')}
                </p>
              ) : (
                <div>
                  {upcoming.map(e => {
                    const d    = new Date(e.date);
                    const aayam = AAYAM[e.aayam] ?? AAYAM.Vibhag;
                    return (
                      <div
                        key={e.id}
                        className="flex items-center gap-2.5 py-2.5 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/30 -mx-1 px-1 rounded transition-colors"
                        onClick={() => {
                          setYear(d.getFullYear());
                          setMonth(d.getMonth());
                          setSelDay(d.getDate());
                        }}
                      >
                        {/* Date badge */}
                        <div className="text-center min-w-[30px] shrink-0">
                          <p className="text-xs font-bold text-primary leading-none">{d.getDate()}</p>
                          <p className={cn('text-[9px] text-muted-foreground', lang === 'hi' && 'font-devanagari')}>
                            {lang === 'hi' ? MONTHS_HI[d.getMonth()].slice(0, 3) : MONTHS_EN[d.getMonth()].slice(0, 3)}
                          </p>
                        </div>
                        {/* Event info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs font-medium truncate', lang === 'hi' && 'font-devanagari')}>
                            {lang === 'hi' ? e.titleHi : e.title}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <div className={cn('w-1.5 h-1.5 rounded-full shrink-0', aayam.dot)} />
                            <span className={cn('text-[9px] text-muted-foreground', lang === 'hi' && 'font-devanagari')}>
                              {lang === 'hi' ? aayam.labelHi : aayam.label}
                            </span>
                            {e.recurring && <RotateCcw className="w-2.5 h-2.5 text-warning ml-1" />}
                          </div>
                        </div>
                        {/* Status dot */}
                        {(e.status === 'Pending Aayam Review' || e.status === 'Pending Final Approval') && (
                          <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
