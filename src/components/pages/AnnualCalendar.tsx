"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  ChevronLeft, ChevronRight, CalendarDays, Bell,
  CheckCircle2, Clock, AlertCircle, TrendingUp,
  Users, FileText, Layers, RotateCcw, Calendar,
  Search, X, Plus, LayoutGrid, ListFilter, Eye,
  MapPin, ExternalLink, Sparkles, Filter,
} from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { AAYAM_CONFIG as AAYAM, AAYAM_KIND_LABEL } from "@/lib/app/aayam-config";
import type { LucideIcon } from "lucide-react";
import type { GatividhiEvent } from "@/lib/app/contracts";
import { useDashboardEvents } from "@/hooks/api/use-dashboard";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; labelHi: string; chip: string; icon: LucideIcon }> = {
  Draft:                  { label: "Draft",            labelHi: "प्रारूप",            chip: "bg-secondary text-secondary-foreground",  icon: FileText },
  "Submitted by Unit":    { label: "Submitted",        labelHi: "प्रस्तुत",           chip: "bg-blue-500/15 text-blue-600",             icon: CheckCircle2 },
  "Pending Aayam Review": { label: "Pending Review",   labelHi: "समीक्षा प्रतीक्षित", chip: "bg-warning/15 text-warning",              icon: Clock },
  "Pending Vibhag Review":{ label: "Pending Vibhag",   labelHi: "विभाग समीक्षा",      chip: "bg-orange-500/15 text-orange-600",         icon: AlertCircle },
  "Pending Prant Authorization": { label: "Pending Prant", labelHi: "प्रान्त अनुमोदन", chip: "bg-violet-500/15 text-violet-600",        icon: Clock },
  "Pending Prant Dual Authorization": { label: "Pending Dual", labelHi: "द्वैत अनुमोदन", chip: "bg-violet-500/15 text-violet-600",        icon: Clock },
  Published:              { label: "Published",        labelHi: "प्रकाशित",           chip: "bg-success/15 text-success",              icon: CheckCircle2 },
  "Escalated to Kshetra": { label: "Escalated",        labelHi: "क्षेत्रीय",           chip: "bg-rose-500/15 text-rose-600",            icon: AlertCircle },
  "Returned for Revision":{ label: "Returned",         labelHi: "पुनर्लेखन",           chip: "bg-muted/50 text-muted-foreground",       icon: RotateCcw },
  Rejected:               { label: "Rejected",         labelHi: "अस्वीकृत",           chip: "bg-destructive/15 text-destructive",      icon: X },
  Cancelled:              { label: "Cancelled",        labelHi: "रद्द",               chip: "bg-muted/50 text-muted-foreground",       icon: X },
};

// ── Calendar event type ──────────────────────────────────────────────────────
interface CalEvent {
  id: string;
  rawId: string;
  title: string;
  titleHi: string;
  date: string;
  dateIso?: string;
  aayam: string;
  status: string;
  location?: string;
  recurring?: boolean;
  note?: string;
  unit?: string;
  description?: string;
}

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_HI = ["जनवरी","फ़रवरी","मार्च","अप्रैल","मई","जून","जुलाई","अगस्त","सितंबर","अक्टूबर","नवंबर","दिसंबर"];
const DAYS_EN = ["Su","Mo","Tu","We","Th","Fr","Sa"];
const DAYS_HI = ["र","सो","म","बु","गु","शु","श"];
const WEEK_DAYS_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const WEEK_DAYS_HI = ["रविवार","सोमवार","मंगलवार","बुधवार","गुरुवार","शुक्रवार","शनिवार"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDay(y: number, m: number) { return new Date(y, m, 1).getDay(); }
function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function parseEventDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}
function resolveAayam(event: GatividhiEvent): string {
  if (event.departmentCode) {
    const mapped = AAYAM_KIND_LABEL[event.departmentCode];
    if (mapped) return mapped;
  }
  return "Vibhag";
}

// ── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, label, value, detail, iconWrapClass, valueClass }: {
  icon: LucideIcon; label: string; value: number | string; detail?: string; iconWrapClass: string; valueClass: string;
}) {
  return (
    <Card className="calendar-summary-card hover-lift overflow-hidden relative">
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", iconWrapClass.replace("text-", "bg-").replace("/10", "").replace("/15", ""))} />
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", iconWrapClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className={cn("text-2xl font-bold tabular-nums", valueClass)}>{value}</span>
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
        {detail && <p className="mt-2 text-xs leading-5 text-muted-foreground">{detail}</p>}
      </CardContent>
    </Card>
  );
}

// ── Event chip (in calendar cell) ─────────────────────────────────────────────
function EventChip({ event, lang, onClick }: { event: CalEvent; lang: string; onClick?: () => void }) {
  const aayam = AAYAM[event.aayam] ?? AAYAM.Vibhag;
  const isPending = event.status === "Pending Aayam Review" || event.status === "Pending Vibhag Review" || event.status === "Pending Prant Authorization" || event.status === "Pending Prant Dual Authorization";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={cn(
        "group text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded-md truncate leading-tight font-medium border cursor-pointer transition-all hover:shadow-sm",
        aayam.chip,
        isPending && "ring-1 ring-warning/40",
      )}
      title={lang === "hi" ? event.titleHi : event.title}
    >
      <span className="flex items-center gap-0.5">
        <span className={cn("w-1 h-1 rounded-full shrink-0", aayam.dot)} />
        {lang === "hi" ? event.titleHi : event.title}
      </span>
    </motion.div>
  );
}

// ── Event detail modal ────────────────────────────────────────────────────────
function EventDetailModal({ event, open, onClose, lang, role }: {
  event: CalEvent | null; open: boolean; onClose: () => void; lang: string; role: string;
}) {
  const router = useRouter();
  const t = useT();

  const action = useMemo(() => {
    if (!event) return null;
    if (role === "vibhag_pramukh" && (event.status === "Pending Prant Authorization" || event.status === "Pending Prant Dual Authorization" || event.status === "Pending Vibhag Review")) {
      return { label: t("Review & Forward", "समीक्षा और अग्रेषण"), href: `/dashboard?event=${event.rawId}&action=review` };
    }
    if (role === "aayam_pramukh" && event.status === "Pending Aayam Review") {
      return { label: t("Review Event", "कार्यक्रम समीक्षा"), href: `/dashboard?event=${event.rawId}&action=review` };
    }
    if (role === "unit_head" && event.status === "Draft") {
      return { label: t("Edit Draft", "प्रारूप संपादित करें"), href: `/dashboard?event=${event.rawId}&action=edit` };
    }
    if (event.status === "Published") {
      return { label: t("View Details", "विवरण देखें"), href: `/dashboard?event=${event.rawId}&action=view` };
    }
    return null;
  }, [role, event, t]);

  if (!event) return null;

  const aayam = AAYAM[event.aayam] ?? AAYAM.Vibhag;
  const status = STATUS[event.status] ?? STATUS.Draft;
  const StatusIcon = status.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0 gap-0">
        {/* Top accent bar */}
        <div className={cn("h-1.5 w-full", aayam.dot)} />
        <div className="p-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-[10px] px-2 py-0.5 border gap-1", aayam.chip)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", aayam.dot)} />
                {lang === "hi" ? aayam.labelHi : aayam.label}
              </Badge>
              <Badge className={cn("text-[10px] px-2 py-0.5 gap-1", status.chip)}>
                <StatusIcon className="w-3 h-3" />
                {lang === "hi" ? status.labelHi : status.label}
              </Badge>
            </div>
            <DialogTitle className={cn("text-xl leading-snug", lang === "hi" && "font-devanagari")}>
              {lang === "hi" ? event.titleHi : event.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
              <CalendarDays className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium">{event.date}</p>
                <p className="text-xs text-muted-foreground">
                  {event.dateIso ? new Date(event.dateIso).toLocaleTimeString(lang === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" }) : ""}
                </p>
              </div>
            </div>

            {event.location && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm">{event.location}</p>
              </div>
            )}

            {event.description && (
              <div className="p-3 rounded-xl bg-muted/20 border border-border/20">
                <p className={cn("text-sm text-muted-foreground leading-relaxed", lang === "hi" && "font-devanagari")}>
                  {event.description}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            {action && (
              <Button className="flex-1 rounded-xl h-11" onClick={() => { onClose(); router.push(action.href); }}>
                <ExternalLink className="w-4 h-4 mr-1.5" />
                {action.label}
              </Button>
            )}
            <Button variant="outline" className="rounded-xl h-11" onClick={onClose}>
              {t("Close", "बंद करें")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AnnualCalendar() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear]       = useState(today.getFullYear());
  const [month, setMonth]     = useState(today.getMonth());
  const [selDay, setSelDay]   = useState<number>(today.getDate());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [search, setSearch]   = useState("");
  const [aayamFilter, setAayamFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [detailEvent, setDetailEvent] = useState<CalEvent | null>(null);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const { role, lang, permissions } = useAppContext();
  const { data: events = [], isLoading } = useDashboardEvents();

  const t = useT();
  const router = useRouter();

  const aayamList = useMemo(() => Object.keys(AAYAM), []);

  // Convert AppContext GatividhiEvents → CalEvent
  const dynamicEvents: CalEvent[] = useMemo(() =>
    events.map((e) => {
      const d = parseEventDate(e.dateIso);
      return {
        id: `ev-${e.id}`,
        rawId: e.id,
        title: e.title,
        titleHi: e.title,
        date: d ? toDateStr(d.getFullYear(), d.getMonth(), d.getDate()) : e.date,
        dateIso: e.dateIso,
        aayam: resolveAayam(e),
        status: e.status,
        location: e.unit,
        unit: e.unit,
        description: e.description,
      };
    }), [events]);

  // Role-filtered event pool
  const roleFilteredEvents: CalEvent[] = useMemo(() => {
    switch (role) {
      case "karyakarta":
        return dynamicEvents.filter((e) => e.status === "Published");
      case "unit_head":
        return dynamicEvents;
      case "aayam_pramukh":
        return dynamicEvents.filter((e) => e.status !== "Draft");
      default:
        return dynamicEvents;
    }
  }, [dynamicEvents, role]);

  // Search + aayam + status filters
  const allEvents: CalEvent[] = useMemo(() => {
    let filtered = roleFilteredEvents;
    const q = search.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        (e.description?.toLowerCase().includes(q) ?? false)
      );
    }
    if (aayamFilter.length > 0) {
      filtered = filtered.filter((e) => aayamFilter.includes(e.aayam));
    }
    if (statusFilter.length > 0) {
      filtered = filtered.filter((e) => statusFilter.includes(e.status));
    }
    return filtered;
  }, [roleFilteredEvents, search, aayamFilter, statusFilter]);

  // Week range
  const weekStart = useMemo(() => {
    const d = new Date(year, month, selDay);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }, [year, month, selDay]);

  const weekEvents = useMemo(() => {
    const start = new Date(weekStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return allEvents.filter((e) => {
      const ed = parseEventDate(e.dateIso);
      if (!ed) return false;
      return ed >= start && ed <= end;
    }).sort((a, b) => {
      const da = parseEventDate(a.dateIso)?.getTime() ?? 0;
      const db = parseEventDate(b.dateIso)?.getTime() ?? 0;
      return da - db;
    });
  }, [allEvents, weekStart]);

  // Month-scoped events
  const monthEvents = useMemo(() =>
    allEvents.filter((e) => {
      const d = parseEventDate(e.dateIso);
      if (!d) return false;
      return d.getMonth() === month && d.getFullYear() === year;
    }), [allEvents, month, year]);

  // Pre-computed date-to-events map
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of monthEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    return map;
  }, [monthEvents]);

  // Selected-day events
  const selStr   = toDateStr(year, month, selDay);
  const selEvents = eventsByDate.get(selStr) ?? [];

  // Upcoming
  const upcoming = useMemo(() =>
    allEvents
      .filter((e) => {
        const d = parseEventDate(e.dateIso);
        return d && d >= new Date(today.toDateString());
      })
      .sort((a, b) => {
        const da = parseEventDate(a.dateIso)?.getTime() ?? 0;
        const db = parseEventDate(b.dateIso)?.getTime() ?? 0;
        return da - db;
      })
      .slice(0, 8),
    [allEvents, today]);

  // Pending action
  const pendingAction = useMemo(() => {
    switch (role) {
      case "vibhag_pramukh": return allEvents.filter((e) => e.status === "Pending Vibhag Review" || e.status === "Pending Prant Authorization" || e.status === "Pending Prant Dual Authorization");
      case "aayam_pramukh":  return allEvents.filter((e) => e.status === "Pending Aayam Review");
      case "unit_head":      return allEvents.filter((e) => e.status === "Draft");
      default:               return [];
    }
  }, [allEvents, role]);

  // KPIs
  const kpis = useMemo(() => {
    const published = allEvents.filter((e) => e.status === "Published").length;
    const pending   = allEvents.filter((e) => e.status === "Pending Aayam Review" || e.status === "Pending Vibhag Review" || e.status === "Pending Prant Authorization" || e.status === "Pending Prant Dual Authorization").length;

    switch (role) {
      case "vibhag_pramukh": return [
        { icon: Layers,       label: t("Total Events", "कुल कार्यक्रम"),              value: allEvents.length,                                             iconWrapClass: "bg-primary/10 text-primary",       valueClass: "text-primary" },
        { icon: AlertCircle,  label: t("Pending Approval", "अनुमोदन प्रतीक्षित"),   value: allEvents.filter((e) => e.status === "Pending Vibhag Review" || e.status === "Pending Prant Authorization").length, iconWrapClass: "bg-orange-500/10 text-orange-500", valueClass: "text-orange-500" },
        { icon: CheckCircle2, label: t("Published", "प्रकाशित"),                      value: published,                                                    iconWrapClass: "bg-success/10 text-success",       valueClass: "text-success" },
        { icon: Users,        label: t("Active Aayams", "सक्रिय आयाम"),              value: new Set(allEvents.map((e) => e.aayam)).size,                iconWrapClass: "bg-info/10 text-info",             valueClass: "text-info" },
      ];
      case "aayam_pramukh": return [
        { icon: CalendarDays, label: t("This Month", "इस माह के कार्यक्रम"),         value: monthEvents.length,                                           iconWrapClass: "bg-primary/10 text-primary",       valueClass: "text-primary" },
        { icon: Clock,        label: t("Pending My Review", "मेरी समीक्षा प्रतीक्षित"), value: allEvents.filter((e) => e.status === "Pending Aayam Review").length, iconWrapClass: "bg-warning/10 text-warning",    valueClass: "text-warning" },
        { icon: CheckCircle2, label: t("Published", "प्रकाशित"),                      value: published,                                                    iconWrapClass: "bg-success/10 text-success",       valueClass: "text-success" },
        { icon: TrendingUp,   label: t("Upcoming", "आगामी कार्यक्रम"),               value: upcoming.length,                                              iconWrapClass: "bg-violet-500/10 text-violet-500", valueClass: "text-violet-500" },
      ];
      case "unit_head": return [
        { icon: FileText,     label: t("All Events", "सभी कार्यक्रम"),               value: allEvents.length,                                             iconWrapClass: "bg-primary/10 text-primary",       valueClass: "text-primary" },
        { icon: AlertCircle,  label: t("Drafts", "प्रारूप"),                         value: allEvents.filter((e) => e.status === "Draft").length,            iconWrapClass: "bg-muted/50 text-muted-foreground", valueClass: "text-muted-foreground" },
        { icon: Clock,        label: t("Pending Approval", "अनुमोदन प्रतीक्षित"),   value: pending,                                                      iconWrapClass: "bg-warning/10 text-warning",       valueClass: "text-warning" },
        { icon: CheckCircle2, label: t("Published", "प्रकाशित"),                      value: published,                                                    iconWrapClass: "bg-success/10 text-success",       valueClass: "text-success" },
      ];
      default: return [
        { icon: CalendarDays, label: t("Org Events", "संगठन कार्यक्रम"),             value: allEvents.length,                                             iconWrapClass: "bg-primary/10 text-primary",       valueClass: "text-primary" },
        { icon: CheckCircle2, label: t("Published", "प्रकाशित"),                      value: published,                                                    iconWrapClass: "bg-success/10 text-success",       valueClass: "text-success" },
        { icon: TrendingUp,   label: t("Upcoming", "आगामी"),                         value: upcoming.length,                                              iconWrapClass: "bg-blue-500/10 text-blue-600",     valueClass: "text-blue-600" },
        { icon: Users,        label: t("Active Aayams", "सक्रिय आयाम"),              value: new Set(allEvents.map((e) => e.aayam)).size,                iconWrapClass: "bg-info/10 text-info",             valueClass: "text-info" },
      ];
    }
  }, [allEvents, monthEvents, upcoming, role, t]);

  // Navigation
  const prev = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); setSelDay(today.getDate()); };

  const days = daysInMonth(year, month);
  const offset = firstDay(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
  const monthLabel = lang === "hi" ? `${MONTHS_HI[month]} ${year}` : `${MONTHS_EN[month]} ${year}`;
  const dayHeaders = lang === "hi" ? DAYS_HI : DAYS_EN;
  const selectedDateLabel = lang === "hi" ? `${selDay} ${MONTHS_HI[month]} ${year}` : `${MONTHS_EN[month]} ${selDay}, ${year}`;

  const toggleAayam = useCallback((key: string) => {
    setAayamFilter((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }, []);

  const toggleStatus = useCallback((key: string) => {
    setStatusFilter((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch("");
    setAayamFilter([]);
    setStatusFilter([]);
  }, []);

  const hasFilters = search.trim() || aayamFilter.length > 0 || statusFilter.length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      {/* Hero masthead */}
      <section className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-muted/50 via-background to-muted/30 p-6 sm:p-8">
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)", backgroundSize: "24px 24px" }} />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-primary/3 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                <Sparkles className="w-3 h-3" />
                {t("Institutional Calendar Desk", "संस्थागत पंचांग कक्ष")}
              </span>
            </div>
            <h1 className={cn("text-3xl font-bold tracking-tight text-foreground sm:text-4xl", lang === "hi" && "font-devanagari")}>
              {t("Plan the Month", "मासिक योजना")}
            </h1>
            <p className={cn("max-w-xl text-sm leading-7 text-muted-foreground sm:text-base", lang === "hi" && "font-devanagari")}>
              {t("Track rhythm, upcoming work, and coordination in one view. Search, filter, and act on events.", "गति, आगामी कार्य और समन्वय एक दृश्य में ट्रैक करें। खोजें, फ़िल्टर करें और कार्यवाही करें।")}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-3xl font-bold text-foreground">{monthLabel.split(" ")[0]}</p>
              <p className="text-sm text-muted-foreground font-medium">{monthLabel.split(" ")[1]}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>
      </section>

      {/* Search + Filters + View Toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("Search events by title...", "कार्यक्रम शीर्षक से खोजें...")}
              className="pl-10 h-11 rounded-xl border-border/50 bg-background/80 shadow-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-muted transition-colors" aria-label={t("Clear search", "खोज साफ करें")}>
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              className="h-11 rounded-xl gap-1.5"
              onClick={() => setViewMode("month")}
            >
              <LayoutGrid className="w-4 h-4" />
              {t("Month", "माह")}
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              className="h-11 rounded-xl gap-1.5"
              onClick={() => setViewMode("week")}
            >
              <ListFilter className="w-4 h-4" />
              {t("Week", "सप्ताह")}
            </Button>
            {permissions.canCreateEvent && (
              <Button size="sm" className="h-11 rounded-xl gap-1.5 shadow-sm" onClick={() => router.push("/dashboard?tab=create")}>
                <Plus className="w-4 h-4" />
                {t("Event", "कार्यक्रम")}
              </Button>
            )}
          </div>
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Filter className="w-3 h-3" />
            {t("Filters", "फ़िल्टर")}
          </span>
          {aayamList.map((key) => {
            const cfg = AAYAM[key];
            const active = aayamFilter.includes(key);
            return (
              <motion.button
                key={key}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleAayam(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                  active
                    ? cn(cfg.chip, "shadow-sm ring-1 ring-offset-1 ring-offset-background")
                    : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:border-border"
                )}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                {lang === "hi" ? cfg.labelHi : cfg.label}
                {active && <X className="w-3 h-3 ml-0.5 opacity-60" />}
              </motion.button>
            );
          })}

          {/* Status filter dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowStatusFilter((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all",
                statusFilter.length > 0
                  ? "border-primary/30 bg-primary/5 text-primary shadow-sm"
                  : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40"
              )}
            >
              {t("Status", "स्थिति")}
              {statusFilter.length > 0 && (
                <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground px-1">
                  {statusFilter.length}
                </span>
              )}
            </button>
            <AnimatePresence>
              {showStatusFilter && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 mt-1 z-50 min-w-[180px] rounded-xl border border-border/60 bg-popover shadow-lg p-2 space-y-1"
                >
                  {Object.entries(STATUS).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => toggleStatus(key)}
                      className={cn(
                        "flex items-center gap-2 w-full rounded-lg px-2 py-1.5 text-xs transition-colors",
                        statusFilter.includes(key) ? "bg-primary/5 text-primary" : "hover:bg-muted/50 text-muted-foreground"
                      )}
                    >
                      <cfg.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className={lang === "hi" ? "font-devanagari" : ""}>{lang === "hi" ? cfg.labelHi : cfg.label}</span>
                      {statusFilter.includes(key) && <CheckCircle2 className="w-3 h-3 ml-auto" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/5 px-2.5 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <X className="w-3 h-3" />
              {t("Clear", "साफ़ करें")}
            </motion.button>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <KpiCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {allEvents.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-dashed border-border/50 bg-muted/10">
            <CardContent className="pt-12 pb-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto">
                <CalendarDays className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <div className="space-y-1">
                <p className={cn("text-sm font-medium text-muted-foreground", lang === "hi" && "font-devanagari")}>
                  {t("No events match your filters.", "कोई कार्यक्रम फ़िल्टर से मेल नहीं खाता।")}
                </p>
                <p className={cn("text-xs text-muted-foreground/60", lang === "hi" && "font-devanagari")}>
                  {t("Try adjusting your search or filters.", "अपनी खोज या फ़िल्टर समायोजित करें।")}
                </p>
              </div>
              {hasFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="rounded-full">
                  {t("Clear Filters", "फ़िल्टर साफ़ करें")}
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pending action banner */}
      <AnimatePresence>
        {pendingAction.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }}>
            <Card className="border-warning/25 bg-gradient-to-r from-warning/5 to-transparent overflow-hidden">
              <CardContent className="pt-3 pb-3 flex items-center gap-3 flex-wrap">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <Bell className="w-4 h-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold text-warning", lang === "hi" && "font-devanagari")}>
                    {t(`${pendingAction.length} event${pendingAction.length > 1 ? "s" : ""} need${pendingAction.length === 1 ? "s" : ""} attention`, `${pendingAction.length} कार्यक्रम पर अभी ध्यान चाहिए`)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {pendingAction.slice(0, 3).map((e) => (
                    <Badge key={e.id} className="text-[9px] bg-warning/10 text-warning border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors" onClick={() => setDetailEvent(e)}>
                      {lang === "hi" ? e.titleHi : e.title}
                    </Badge>
                  ))}
                  {pendingAction.length > 3 && (
                    <Badge className="text-[9px] bg-warning/10 text-warning border-warning/20">+{pendingAction.length - 3}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <span className="section-seal">{t("Planning Surface", "योजना सतह")}</span>
          <p className={cn("text-sm leading-6 text-muted-foreground", lang === "hi" && "font-devanagari")}>
            {viewMode === "month"
              ? t("Click any day to see details. Click an event chip to open details.", "विवरण देखने के लिए किसी भी दिन पर क्लिक करें।")
              : t("Week view shows your 7-day programme flow.", "सप्ताह दृश्य आपका 7-दिवसीय कार्यक्रम प्रवाह दिखाता है।")}
          </p>
        </div>
        {allEvents.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {allEvents.length} {t("events", "कार्यक्रम")}
          </p>
        )}
      </div>

      {/* Calendar + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Main view (2/3) ──────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <Card className="calendar-grid-card overflow-hidden border-border/40">
            <CardContent className="pt-5 px-3 sm:px-5 pb-5">
              {/* Navigation bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <h2 className={cn("text-lg font-bold", lang === "hi" && "font-devanagari")}>{monthLabel}</h2>
                  {!isCurrentMonth && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs rounded-full" onClick={goToday}>
                      {t("Today", "आज")}
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={prev}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={next}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {viewMode === "month" ? (
                  <motion.div
                    key="month"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* Day header row */}
                    <div className="grid grid-cols-7 mb-2">
                      {dayHeaders.map((d) => (
                        <div key={d} className={cn("text-center text-[10px] sm:text-[11px] font-bold text-muted-foreground/70 py-1.5 uppercase tracking-wider", lang === "hi" && "font-devanagari")}>{d}</div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: offset }).map((_, i) => (
                        <div key={`pad-${i}`} className="min-h-[60px] sm:min-h-[80px]" />
                      ))}
                      {Array.from({ length: days }).map((_, i) => {
                        const d = i + 1;
                        const ds = toDateStr(year, month, d);
                        const dayEvts = eventsByDate.get(ds) ?? [];
                        const isToday    = isCurrentMonth && today.getDate() === d;
                        const isSelected = selDay === d;
                        const hasPending = dayEvts.some((e) =>
                          e.status === "Pending Aayam Review" ||
                          e.status === "Pending Vibhag Review" ||
                          e.status === "Pending Prant Authorization" ||
                          e.status === "Pending Prant Dual Authorization"
                        );

                        return (
                          <motion.div
                            key={d}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelDay(d)}
                            className={cn(
                              "min-h-[60px] sm:min-h-[80px] p-1 sm:p-1.5 rounded-xl border transition-all select-none relative",
                              isSelected
                                ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                                : "border-transparent hover:border-border/40 hover:bg-muted/20",
                              isToday && !isSelected && "bg-primary/[0.03] border-primary/15",
                            )}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <p className={cn(
                                "text-[11px] sm:text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                                isToday   && "bg-primary text-primary-foreground",
                                isSelected && !isToday && "text-primary",
                                !isToday && !isSelected && "text-foreground/70"
                              )}>{d}</p>
                              {hasPending && (
                                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse shrink-0" />
                              )}
                            </div>
                            <div className="space-y-0.5">
                              {dayEvts.slice(0, 2).map((e) => (
                                <EventChip key={e.id} event={e} lang={lang} onClick={() => setDetailEvent(e)} />
                              ))}
                              {dayEvts.length > 2 && (
                                <p className="text-[8px] text-muted-foreground text-center leading-none font-medium">+{dayEvts.length - 2} more</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="week"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Week day strip */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date(weekStart);
                        d.setDate(d.getDate() + i);
                        const isToday = d.toDateString() === today.toDateString();
                        const isSelected = d.getDate() === selDay && d.getMonth() === month && d.getFullYear() === year;
                        const ds = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
                        const dayEvts = allEvents.filter((e) => e.date === ds);
                        return (
                          <motion.div
                            key={i}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => { setYear(d.getFullYear()); setMonth(d.getMonth()); setSelDay(d.getDate()); }}
                            className={cn(
                              "text-center p-2.5 rounded-xl border cursor-pointer transition-all",
                              isSelected ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20 shadow-sm" : "border-border/30 hover:border-border/60 hover:bg-muted/20",
                              isToday && !isSelected && "bg-primary/[0.03] border-primary/20",
                            )}
                          >
                            <p className={cn("text-[10px] text-muted-foreground/70 font-medium", lang === "hi" && "font-devanagari")}>
                              {lang === "hi" ? WEEK_DAYS_HI[d.getDay()].slice(0, 3) : WEEK_DAYS_EN[d.getDay()].slice(0, 3)}
                            </p>
                            <p className={cn("text-lg font-bold mt-0.5", isToday && "text-primary")}>{d.getDate()}</p>
                            {dayEvts.length > 0 && (
                              <div className="flex justify-center gap-0.5 mt-1.5">
                                {dayEvts.slice(0, 4).map((e) => {
                                  const a = AAYAM[e.aayam] ?? AAYAM.Vibhag;
                                  return <div key={e.id} className={cn("w-1.5 h-1.5 rounded-full", a.dot)} />;
                                })}
                                {dayEvts.length > 4 && <span className="text-[8px] text-muted-foreground">+</span>}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Week event list */}
                    <div className="space-y-2">
                      {weekEvents.length === 0 ? (
                        <div className="text-center py-10">
                          <CalendarDays className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                          <p className={cn("text-sm text-muted-foreground", lang === "hi" && "font-devanagari")}>
                            {t("No events this week", "इस सप्ताह कोई कार्यक्रम नहीं")}
                          </p>
                        </div>
                      ) : (
                        weekEvents.map((e, idx) => {
                          const aayam = AAYAM[e.aayam] ?? AAYAM.Vibhag;
                          const status = STATUS[e.status] ?? STATUS.Draft;
                          const StatusIcon = status.icon;
                          const ed = parseEventDate(e.dateIso);
                          return (
                            <motion.div
                              key={e.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              onClick={() => setDetailEvent(e)}
                              className="group flex items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/80 hover:border-primary/20 hover:shadow-sm transition-all cursor-pointer"
                            >
                              <div className="text-center min-w-[48px] shrink-0">
                                <p className="text-xs font-bold text-primary">{ed ? ed.getDate() : "—"}</p>
                                <p className={cn("text-[9px] text-muted-foreground", lang === "hi" && "font-devanagari")}>
                                  {ed ? (lang === "hi" ? MONTHS_HI[ed.getMonth()].slice(0, 3) : MONTHS_EN[ed.getMonth()].slice(0, 3)) : ""}
                                </p>
                              </div>
                              <div className={cn("w-1 h-10 rounded-full shrink-0", aayam.dot)} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{lang === "hi" ? e.titleHi : e.title}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <Badge className={cn("text-[9px] px-1.5 py-0 border", aayam.chip)}>
                                    {lang === "hi" ? aayam.labelHi : aayam.label}
                                  </Badge>
                                  <Badge className={cn("text-[9px] px-1.5 py-0 gap-0.5", status.chip)}>
                                    <StatusIcon className="w-2.5 h-2.5" />
                                    {lang === "hi" ? status.labelHi : status.label}
                                  </Badge>
                                </div>
                              </div>
                              <Eye className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-primary/60 transition-colors" />
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 sm:gap-4 mt-5 pt-4 border-t border-border/30">
                {Object.entries(AAYAM).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                    <span className={cn("text-[10px] sm:text-[11px] text-muted-foreground/80 font-medium", lang === "hi" && "font-devanagari")}>
                      {lang === "hi" ? cfg.labelHi : cfg.label}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-warning shrink-0 animate-pulse" />
                  <span className={cn("text-[10px] sm:text-[11px] text-muted-foreground/80 font-medium", lang === "hi" && "font-devanagari")}>
                    {t("Pending", "प्रतीक्षित")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Side panel (1/3) ─────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Selected day */}
          <Card className="calendar-side-card border-border/40 overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-primary/40 via-primary/20 to-transparent" />
            <CardContent className="pt-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <p className={cn("text-sm font-bold", lang === "hi" && "font-devanagari")}>{selectedDateLabel}</p>
                </div>
                {selEvents.length > 0 && (
                  <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">{selEvents.length}</Badge>
                )}
              </div>

              {selEvents.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center mx-auto mb-3">
                    <CalendarDays className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                  <p className={cn("text-xs text-muted-foreground", lang === "hi" && "font-devanagari")}>
                    {t("No events on this day", "इस दिन कोई कार्यक्रम नहीं")}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selEvents.map((e) => (
                    <motion.div
                      key={e.id}
                      whileHover={{ x: 2 }}
                      onClick={() => setDetailEvent(e)}
                      className="cursor-pointer"
                    >
                      <EventCard event={e} lang={lang} />
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming */}
          <Card className="calendar-side-card border-border/40 overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-violet-500/30 via-violet-500/10 to-transparent" />
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-violet-500" />
                <p className={cn("text-sm font-bold", lang === "hi" && "font-devanagari")}>
                  {t("Upcoming", "आगामी")}
                </p>
              </div>

              {upcoming.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-muted-foreground">{t("No upcoming events", "कोई आगामी कार्यक्रम नहीं")}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {upcoming.map((e) => {
                    const d    = parseEventDate(e.dateIso);
                    const aayam = AAYAM[e.aayam] ?? AAYAM.Vibhag;
                    return (
                      <motion.div
                        key={e.id}
                        whileHover={{ x: 3, backgroundColor: "hsl(var(--muted) / 0.3)" }}
                        className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => {
                          if (d) {
                            setYear(d.getFullYear());
                            setMonth(d.getMonth());
                            setSelDay(d.getDate());
                          }
                          setDetailEvent(e);
                        }}
                      >
                        <div className="text-center min-w-[36px] shrink-0">
                          <p className="text-sm font-bold text-primary leading-none">{d ? d.getDate() : "—"}</p>
                          <p className={cn("text-[9px] text-muted-foreground/70", lang === "hi" && "font-devanagari")}>
                            {d ? (lang === "hi" ? MONTHS_HI[d.getMonth()].slice(0, 3) : MONTHS_EN[d.getMonth()].slice(0, 3)) : ""}
                          </p>
                        </div>
                        <div className={cn("w-0.5 h-8 rounded-full shrink-0", aayam.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-xs font-semibold truncate", lang === "hi" && "font-devanagari")}>
                            {lang === "hi" ? e.titleHi : e.title}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={cn("text-[10px] text-muted-foreground/70", lang === "hi" && "font-devanagari")}>
                              {lang === "hi" ? aayam.labelHi : aayam.label}
                            </span>
                            {(e.status === "Pending Aayam Review" || e.status === "Pending Vibhag Review" || e.status === "Pending Prant Authorization") && (
                              <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event detail modal */}
      <EventDetailModal
        event={detailEvent}
        open={!!detailEvent}
        onClose={() => setDetailEvent(null)}
        lang={lang}
        role={role}
      />
    </motion.div>
  );
}

// ── Event card (in side panel) ────────────────────────────────────────────────
function EventCard({ event, lang }: { event: CalEvent; lang: string }) {
  const aayam = AAYAM[event.aayam] ?? AAYAM.Vibhag;
  const status = STATUS[event.status] ?? STATUS.Draft;
  const StatusIcon = status.icon;
  const title = lang === "hi" ? event.titleHi : event.title;

  return (
    <div className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-2 hover:border-primary/25 hover:bg-card/80 hover:shadow-sm transition-all">
      <div className="flex items-start gap-2">
        <div className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0", aayam.dot)} />
        <p className="text-xs font-semibold leading-snug flex-1">{title}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap pl-2">
        <Badge className={cn("text-[9px] px-1.5 py-0 border", aayam.chip)}>
          {lang === "hi" ? aayam.labelHi : aayam.label}
        </Badge>
        <Badge className={cn("text-[9px] px-1.5 py-0 gap-0.5", status.chip)}>
          <StatusIcon className="w-2.5 h-2.5" />
          {lang === "hi" ? status.labelHi : status.label}
        </Badge>
      </div>
    </div>
  );
}
