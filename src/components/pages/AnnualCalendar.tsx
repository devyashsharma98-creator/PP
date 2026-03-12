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

const ROLE_COPY: Record<string, {
  roleEn: string;
  roleHi: string;
  eyebrowEn: string;
  eyebrowHi: string;
  lensEn: string;
  lensHi: string;
  lensDetailEn: string;
  lensDetailHi: string;
  cadenceEn: string;
  cadenceHi: string;
  cadenceDetailEn: string;
  cadenceDetailHi: string;
  reminderEn: string;
  reminderHi: string;
  reminderDetailEn: string;
  reminderDetailHi: string;
}> = {
  vibhag_pramukh: {
    roleEn: 'Vibhag Pramukh',
    roleHi: '\u0935\u093f\u092d\u093e\u0917 \u092a\u094d\u0930\u092e\u0941\u0916',
    eyebrowEn: 'Organisation-wide sequencing',
    eyebrowHi: '\u0938\u0902\u0917\u0920\u0928-\u0935\u094d\u092f\u093e\u092a\u0940 \u0915\u094d\u0930\u092e',
    lensEn: 'Vibhag oversight',
    lensHi: '\u0935\u093f\u092d\u093e\u0917 \u0926\u0943\u0937\u094d\u091f\u093f',
    lensDetailEn: "Track approvals, recurring programmes, and the month's institutional sequence.",
    lensDetailHi: '\u0905\u0928\u0941\u092e\u094b\u0926\u0928, \u0928\u093f\u092f\u092e\u093f\u0924 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0914\u0930 \u092e\u093e\u0938\u093f\u0915 \u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u0915\u094d\u0930\u092e \u092a\u0930 \u0926\u0943\u0937\u094d\u091f\u093f \u0930\u0916\u0947\u0902\u0964',
    cadenceEn: 'Institutional cadence',
    cadenceHi: '\u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u0917\u0924\u093f',
    cadenceDetailEn: 'The planning surface keeps aayam activity and final approvals in one shared rhythm.',
    cadenceDetailHi: '\u092f\u0939 \u0926\u0943\u0936\u094d\u092f \u0906\u092f\u093e\u092e \u0917\u0924\u093f \u0914\u0930 \u0905\u0902\u0924\u093f\u092e \u0905\u0928\u0941\u092e\u094b\u0926\u0928 \u0915\u094b \u090f\u0915 \u0939\u0940 \u0915\u094d\u0930\u092e \u092e\u0947\u0902 \u0932\u093e\u0924\u093e \u0939\u0948\u0964',
    reminderEn: 'Final movement matters most',
    reminderHi: '\u0905\u0902\u0924\u093f\u092e \u0917\u0924\u093f \u0938\u092c\u0938\u0947 \u092e\u0939\u0924\u094d\u0935\u092a\u0942\u0930\u094d\u0923',
    reminderDetailEn: 'Use the right ledger to keep pending approvals and major gatherings moving.',
    reminderDetailHi: '\u0909\u091a\u093f\u0924 \u0932\u0947\u0916\u093e \u0926\u0947\u0916\u0915\u0930 \u0932\u0902\u092c\u093f\u0924 \u0905\u0928\u0941\u092e\u094b\u0926\u0928 \u0914\u0930 \u092e\u0941\u0916\u094d\u092f \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0906\u0917\u0947 \u092c\u0922\u093c\u093e\u090f\u0902\u0964',
  },
  aayam_pramukh: {
    roleEn: 'Aayam Pramukh',
    roleHi: '\u0906\u092f\u093e\u092e \u092a\u094d\u0930\u092e\u0941\u0916',
    eyebrowEn: 'Aayam review and programme cadence',
    eyebrowHi: '\u0906\u092f\u093e\u092e \u0938\u092e\u0940\u0915\u094d\u0937\u093e \u0914\u0930 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0917\u0924\u093f',
    lensEn: 'Thematic review lane',
    lensHi: '\u0935\u093f\u0937\u092f\u0915 \u0938\u092e\u0940\u0915\u094d\u0937\u093e \u0926\u093f\u0936\u093e',
    lensDetailEn: 'Balance final review work with upcoming aayam-linked events in one monthly view.',
    lensDetailHi: '\u0905\u0902\u0924\u093f\u092e \u0938\u092e\u0940\u0915\u094d\u0937\u093e \u0914\u0930 \u0906\u092f\u093e\u092e \u0938\u0902\u092c\u0902\u0927\u093f\u0924 \u0906\u0917\u093e\u092e\u0940 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0915\u094b \u090f\u0915 \u0926\u0943\u0936\u094d\u092f \u092e\u0947\u0902 \u0926\u0947\u0916\u0947\u0902\u0964',
    cadenceEn: 'Review-to-programme flow',
    cadenceHi: '\u0938\u092e\u0940\u0915\u094d\u0937\u093e \u0938\u0947 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0924\u0915',
    cadenceDetailEn: 'Keep approvals, published work, and upcoming public activity aligned.',
    cadenceDetailHi: '\u0905\u0928\u0941\u092e\u094b\u0926\u0928, \u092a\u094d\u0930\u0915\u093e\u0936\u093f\u0924 \u0938\u093e\u092e\u0917\u094d\u0930\u0940 \u0914\u0930 \u0906\u0917\u093e\u092e\u0940 \u091c\u0928\u0938\u093e\u0930\u094d\u0935\u091c\u0928\u093f\u0915 \u0917\u0924\u093f\u0935\u093f\u0927\u093f \u0915\u094b \u0938\u0902\u0930\u0947\u0916\u093f\u0924 \u0930\u0916\u0947\u0902\u0964',
    reminderEn: 'Review before reach',
    reminderHi: '\u092a\u0939\u0932\u0947 \u0938\u092e\u0940\u0915\u094d\u0937\u093e, \u092b\u093f\u0930 \u092a\u0939\u0941\u0902\u091a',
    reminderDetailEn: 'The day ledger helps keep thematic review from slipping behind programme dates.',
    reminderDetailHi: '\u0926\u093f\u0935\u0938 \u0932\u0947\u0916\u093e \u0906\u092f\u093e\u092e \u0938\u092e\u0940\u0915\u094d\u0937\u093e \u0915\u094b \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0924\u093f\u0925\u093f \u0938\u0947 \u092a\u0940\u091b\u0947 \u091c\u093e\u0928\u0947 \u0938\u0947 \u0930\u094b\u0915\u0924\u093e \u0939\u0948\u0964',
  },
  unit_head: {
    roleEn: 'Unit Head',
    roleHi: '\u0907\u0915\u093e\u0908 \u092a\u094d\u0930\u092e\u0941\u0916',
    eyebrowEn: 'Local readiness and event management',
    eyebrowHi: '\u0938\u094d\u0925\u093e\u0928\u0940\u092f \u0924\u0948\u092f\u093e\u0930\u0940 \u0914\u0930 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u092a\u094d\u0930\u092c\u0902\u0927\u0928',
    lensEn: 'Unit execution lens',
    lensHi: '\u0907\u0915\u093e\u0908 \u0915\u093e\u0930\u094d\u092f\u093e\u0928\u094d\u0935\u092f\u0928 \u0926\u0943\u0937\u094d\u091f\u093f',
    lensDetailEn: 'Watch drafts, approvals, and local event readiness from one planning desk.',
    lensDetailHi: '\u092a\u094d\u0930\u093e\u0930\u0942\u092a, \u0905\u0928\u0941\u092e\u094b\u0926\u0928 \u0914\u0930 \u0938\u094d\u0925\u093e\u0928\u0940\u092f \u0924\u0948\u092f\u093e\u0930\u0940 \u0915\u094b \u090f\u0915 \u092f\u094b\u091c\u0928\u093e \u0921\u0947\u0938\u094d\u0915 \u0938\u0947 \u0926\u0947\u0916\u0947\u0902\u0964',
    cadenceEn: 'Readiness every week',
    cadenceHi: '\u0938\u093e\u092a\u094d\u0924\u093e\u0939\u093f\u0915 \u0924\u0948\u092f\u093e\u0930\u0940',
    cadenceDetailEn: 'The month view keeps local submissions and programme execution in sync.',
    cadenceDetailHi: '\u092e\u093e\u0938\u093f\u0915 \u0926\u0943\u0936\u094d\u092f \u0938\u094d\u0925\u093e\u0928\u0940\u092f \u092a\u094d\u0930\u0938\u094d\u0924\u0941\u0924\u093f\u092f\u094b\u0902 \u0914\u0930 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0915\u093e\u0930\u094d\u092f\u093e\u0928\u094d\u0935\u092f\u0928 \u0915\u094b \u090f\u0915\u0938\u093e\u0925 \u0930\u0916\u0924\u093e \u0939\u0948\u0964',
    reminderEn: 'Drafts need movement',
    reminderHi: '\u092a\u094d\u0930\u093e\u0930\u0942\u092a \u0915\u094b \u0917\u0924\u093f \u091a\u093e\u0939\u093f\u090f',
    reminderDetailEn: 'Use the reminders rail to keep unfinished unit work from stalling the month.',
    reminderDetailHi: '\u0938\u094d\u092e\u0930\u0923 \u0926\u093f\u0936\u093e \u0938\u0947 \u0905\u0927\u0942\u0930\u093e \u0907\u0915\u093e\u0908 \u0915\u093e\u0930\u094d\u092f \u092e\u0939\u0940\u0928\u0947 \u0915\u094b \u0930\u0941\u0915\u0928\u0947 \u0938\u0947 \u0930\u094b\u0915\u0947\u0902\u0964',
  },
  karyakarta: {
    roleEn: 'Karyakarta',
    roleHi: '\u0915\u093e\u0930\u094d\u092f\u0915\u0930\u094d\u0924\u093e',
    eyebrowEn: 'Participation and institutional awareness',
    eyebrowHi: '\u0938\u0939\u092d\u093e\u0917\u093f\u0924\u093e \u0914\u0930 \u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u0926\u0943\u0937\u094d\u091f\u093f',
    lensEn: 'Participation lens',
    lensHi: '\u0938\u0939\u092d\u093e\u0917\u093f\u0924\u093e \u0926\u0943\u0937\u094d\u091f\u093f',
    lensDetailEn: 'See what is published, what is next, and where the organisation is moving this month.',
    lensDetailHi: '\u0926\u0947\u0916\u0947\u0902 \u0915\u094c\u0928 \u0938\u093e \u0915\u093e\u0930\u094d\u092f \u092a\u094d\u0930\u0915\u093e\u0936\u093f\u0924 \u0939\u0948, \u0906\u0917\u0947 \u0915\u094d\u092f\u093e \u0939\u0948, \u0914\u0930 \u0938\u0902\u0917\u0920\u0928 \u0915\u093f\u0938 \u0926\u093f\u0936\u093e \u092e\u0947\u0902 \u091c\u093e \u0930\u0939\u093e \u0939\u0948\u0964',
    cadenceEn: 'Shared organisational rhythm',
    cadenceHi: '\u0938\u093e\u091d\u093e \u0938\u0902\u0917\u0920\u0928 \u0917\u0924\u093f',
    cadenceDetailEn: 'The calendar keeps recurring programmes and upcoming events easy to follow.',
    cadenceDetailHi: '\u092f\u0939 \u092a\u0902\u091a\u093e\u0902\u0917 \u0928\u093f\u092f\u092e\u093f\u0924 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0914\u0930 \u0906\u0917\u093e\u092e\u0940 \u0917\u0924\u093f\u0935\u093f\u0927\u093f\u092f\u094b\u0902 \u0915\u094b \u0938\u0930\u0932 \u0930\u0916\u0924\u093e \u0939\u0948\u0964',
    reminderEn: 'Stay aligned with the month',
    reminderHi: '\u092e\u0939\u0940\u0928\u0947 \u0915\u0947 \u0938\u093e\u0925 \u0938\u0902\u0930\u0947\u0916\u093f\u0924 \u0930\u0939\u0947\u0902',
    reminderDetailEn: 'The right rail keeps the next institutional commitments visible without clutter.',
    reminderDetailHi: '\u0926\u093e\u0908\u0902 \u092a\u091f\u094d\u091f\u0940 \u0905\u0917\u0932\u0947 \u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u0926\u093e\u092f\u093f\u0924\u094d\u0935\u094b\u0902 \u0915\u094b \u0938\u094d\u092a\u0937\u094d\u091f \u0930\u0916\u0924\u0940 \u0939\u0948\u0964',
  },
};

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, detail, iconWrapClass, valueClass }: {
  icon: LucideIcon; label: string; value: number | string; detail?: string; iconWrapClass: string; valueClass: string;
}) {
  return (
    <Card className="calendar-summary-card">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl', iconWrapClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={cn('text-2xl font-bold tabular-nums', valueClass)}>{value}</span>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        {detail && <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>}
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
  const selectedDateLabel = lang === 'hi' ? `${selDay} ${MONTHS_HI[month]} ${year}` : `${MONTHS_EN[month]} ${selDay}, ${year}`;
  const roleCopy = ROLE_COPY[role] ?? ROLE_COPY.karyakarta;
  const immediateReminderValue = pendingAction.length > 0
    ? t(`${pendingAction.length} coordination item${pendingAction.length === 1 ? '' : 's'}`, `${pendingAction.length} \u0938\u092e\u0928\u094d\u0935\u092f \u092e\u0926`)
    : upcoming[0]
      ? t(upcoming[0].title, upcoming[0].titleHi)
      : t('No pending coordination', '\u0915\u094b\u0908 \u0932\u0902\u092c\u093f\u0924 \u0938\u092e\u0928\u094d\u0935\u092f \u0928\u0939\u0940\u0902');
  const immediateReminderDetail = pendingAction.length > 0
    ? t('Use the coordination ledger to keep work moving on time.', '\u0938\u092e\u0928\u094d\u0935\u092f \u0932\u0947\u0916\u093e \u0926\u0947\u0916\u0915\u0930 \u0915\u093e\u0930\u094d\u092f \u0915\u094b \u0938\u092e\u092f \u092a\u0930 \u0906\u0917\u0947 \u092c\u0922\u093c\u093e\u090f\u0902\u0964')
    : t(roleCopy.reminderDetailEn, roleCopy.reminderDetailHi);
  const contextCards = [
    {
      label: t('Current Planning Lens', '\u0935\u0930\u094d\u0924\u092e\u093e\u0928 \u092f\u094b\u091c\u0928\u093e \u0926\u0943\u0937\u094d\u091f\u093f'),
      value: t(roleCopy.lensEn, roleCopy.lensHi),
      detail: t(roleCopy.lensDetailEn, roleCopy.lensDetailHi),
    },
    {
      label: t('Planning Cadence', '\u092f\u094b\u091c\u0928\u093e \u0917\u0924\u093f'),
      value: t(roleCopy.cadenceEn, roleCopy.cadenceHi),
      detail: t(roleCopy.cadenceDetailEn, roleCopy.cadenceDetailHi),
    },
    {
      label: t('Immediate Reminder', '\u0924\u0924\u094d\u0915\u093e\u0932 \u0938\u094d\u092e\u0930\u0923'),
      value: immediateReminderValue,
      detail: immediateReminderDetail,
    },
  ];


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
      <section className="calendar-masthead">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <span className="shell-ribbon">
              {t('Institutional Calendar Desk', '\u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u092a\u0902\u091a\u093e\u0902\u0917 \u0915\u0915\u094d\u0937')}
            </span>
            <div className="space-y-3">
              <p className={cn('shell-copy', lang === 'hi' && 'font-devanagari')}>
                {t(roleCopy.eyebrowEn, roleCopy.eyebrowHi)}
              </p>
              <div className="space-y-2">
                <h1 className={cn('text-3xl font-semibold tracking-tight text-foreground md:text-4xl', lang === 'hi' && 'font-devanagari')}>
                  {t('Plan the Month and Track Organisational Rhythm', '\u092e\u093e\u0938\u093f\u0915 \u092f\u094b\u091c\u0928\u093e \u0914\u0930 \u0938\u0902\u0917\u0920\u0928 \u0915\u0940 \u0917\u0924\u093f \u092a\u0930 \u0926\u0943\u0937\u094d\u091f\u093f \u0930\u0916\u0947\u0902')}
                </h1>
                <p className={cn('max-w-2xl text-sm leading-7 text-muted-foreground md:text-base', lang === 'hi' && 'font-devanagari')}>
                  {t(
                    'This calendar aligns institutional rhythm, upcoming work, and pending coordination for every internal role.',
                    '\u092f\u0939 \u092a\u0902\u091a\u093e\u0902\u0917 \u092a\u094d\u0930\u0924\u094d\u092f\u0947\u0915 \u0906\u0902\u0924\u0930\u093f\u0915 \u092d\u0942\u092e\u093f\u0915\u093e \u0915\u0947 \u0932\u093f\u090f \u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u0917\u0924\u093f, \u0906\u0917\u093e\u092e\u0940 \u0915\u093e\u0930\u094d\u092f \u0914\u0930 \u0932\u0902\u092c\u093f\u0924 \u0938\u092e\u0928\u094d\u0935\u092f \u0915\u094b \u090f\u0915 \u0938\u093e\u0925 \u0932\u093e\u0924\u093e \u0939\u0948\u0964',
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="calendar-authority-card">
            <p className={cn('shell-panel-copy', lang === 'hi' && 'font-devanagari')}>
              {t('Current Dayitva', '\u0935\u0930\u094d\u0924\u092e\u093e\u0928 \u0926\u093e\u092f\u093f\u0924\u094d\u0935')}
            </p>
            <h2 className={cn('shell-panel-title mt-2', lang === 'hi' && 'font-devanagari')}>
              {t(roleCopy.roleEn, roleCopy.roleHi)}
            </h2>
            <p className={cn('shell-panel-subcopy mt-2', lang === 'hi' && 'font-devanagari')}>
              {t(roleCopy.reminderEn, roleCopy.reminderHi)}
            </p>
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{monthLabel}</p>
              <p className={cn('mt-2 text-sm leading-6 text-muted-foreground', lang === 'hi' && 'font-devanagari')}>
                {t(roleCopy.reminderDetailEn, roleCopy.reminderDetailHi)}
              </p>
            </div>
          </div>
        </div>

        <div className="calendar-context-grid">
          {contextCards.map((card) => (
            <div key={card.label} className="calendar-context-card">
              <p className={cn('shell-panel-copy', lang === 'hi' && 'font-devanagari')}>{card.label}</p>
              <p className={cn('calendar-context-value', lang === 'hi' && 'font-devanagari')}>{card.value}</p>
              <p className={cn('calendar-context-detail', lang === 'hi' && 'font-devanagari')}>{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

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
              <span className={cn('text-[11px] font-semibold uppercase tracking-[0.18em] text-warning', lang === 'hi' && 'font-devanagari')}>{t('Pending Coordination', '\u0932\u0902\u092c\u093f\u0924 \u0938\u092e\u0928\u094d\u0935\u092f')}</span>
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
      <div className="space-y-2">
        <span className="section-seal">{t('Hybrid Planning View', '\u0938\u0902\u092f\u0941\u0915\u094d\u0924 \u092f\u094b\u091c\u0928\u093e \u0926\u0943\u0936\u094d\u092f')}</span>
        <p className={cn('text-sm leading-6 text-muted-foreground', lang === 'hi' && 'font-devanagari')}>
          {t('Month Grid on the left. Agenda, reminders, and selected-day details on the right.', '\u092c\u093e\u0908\u0902 \u0913\u0930 \u092e\u093e\u0939 \u0926\u0943\u0936\u094d\u092f\u0964 \u0926\u093e\u0908\u0902 \u0913\u0930 \u0915\u093e\u0930\u094d\u092f\u0938\u0942\u091a\u0940, \u0938\u094d\u092e\u0930\u0923 \u0914\u0930 \u091a\u092f\u0928\u093f\u0924 \u0926\u093f\u0935\u0938 \u0935\u093f\u0935\u0930\u0923\u0964')}
        </p>
      </div>

      {/* Calendar + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Calendar grid (2/3) ──────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card className="calendar-grid-card">
            <CardContent className="pt-4 px-3 sm:px-5">

              {/* Month navigation */}
              <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-1">
                  <p className={cn('shell-panel-copy', lang === 'hi' && 'font-devanagari')}>{t('Month Grid', '\u092e\u093e\u0939 \u0926\u0943\u0936\u094d\u092f')}</p>
                <h2 className={cn('text-base font-semibold', lang === 'hi' && 'font-devanagari')}>{monthLabel}</h2>
                </div>
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
          <p className={cn('shell-panel-copy', lang === 'hi' && 'font-devanagari')}>{t('Agenda and Reminders', '\u0915\u093e\u0930\u094d\u092f\u0938\u0942\u091a\u0940 \u0914\u0930 \u0938\u094d\u092e\u0930\u0923')}</p>

          {/* Selected day / today's schedule */}
          <Card className="calendar-side-card">
            <CardContent className="pt-4">
              <div className="space-y-2 mb-3">
                <p className={cn('shell-panel-copy', lang === 'hi' && 'font-devanagari')}>{t('Selected Day Ledger', '\u091a\u092f\u0928\u093f\u0924 \u0926\u093f\u0935\u0938 \u0932\u0947\u0916\u093e')}</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary shrink-0" />
                  <p className={cn('text-sm font-semibold', lang === 'hi' && 'font-devanagari')}>{selectedDateLabel}</p>
                  {selEvents.length > 0 && (
                    <Badge className="ml-auto text-[10px] bg-primary/10 text-primary">{selEvents.length}</Badge>
                  )}
                </div>
              </div>

              {selEvents.length === 0 ? (
                <p className={cn('text-xs text-muted-foreground text-center py-5', lang === 'hi' && 'font-devanagari')}>
                  {t('No events on this day', '\u0907\u0938 \u0926\u093f\u0928 \u0915\u094b\u0908 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0928\u0939\u0940\u0902')}
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
          <Card className="calendar-side-card">
            <CardContent className="pt-4">
              <div className="space-y-2 mb-3">
                <p className={cn('shell-panel-copy', lang === 'hi' && 'font-devanagari')}>{t('Upcoming Institutional Rhythm', '\u0906\u0917\u093e\u092e\u0940 \u0938\u0902\u0938\u094d\u0925\u093e\u0917\u0924 \u0915\u094d\u0930\u092e')}</p>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                  <h3 className={cn('text-sm font-semibold', lang === 'hi' && 'font-devanagari')}>
                    {t('Agenda-linked programme flow', '\u0915\u093e\u0930\u094d\u092f\u0938\u0942\u091a\u0940 \u0938\u0902\u092c\u0902\u0927\u093f\u0924 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0917\u0924\u093f')}
                  </h3>
                </div>
              </div>

              {upcoming.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t('No upcoming events', '\u0915\u094b\u0908 \u0906\u0917\u093e\u092e\u0940 \u0915\u093e\u0930\u094d\u092f\u0915\u094d\u0930\u092e \u0928\u0939\u0940\u0902')}
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
                        <div className="text-center min-w-[30px] shrink-0">
                          <p className="text-xs font-bold text-primary leading-none">{d.getDate()}</p>
                          <p className={cn('text-[9px] text-muted-foreground', lang === 'hi' && 'font-devanagari')}>
                            {lang === 'hi' ? MONTHS_HI[d.getMonth()].slice(0, 3) : MONTHS_EN[d.getMonth()].slice(0, 3)}
                          </p>
                        </div>
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
