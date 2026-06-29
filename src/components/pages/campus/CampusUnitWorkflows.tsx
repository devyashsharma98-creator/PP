"use client";

import { useState } from "react";
import {
  BookOpen, Megaphone, Package, Activity, Plus, Check, Circle, Trash2, X,
  CalendarClock, Users, AlertCircle, Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import {
  useStudyCircles, useAddStudyCircle, useUpdateStudyCircle, useDeleteStudyCircle,
  useCampusOutreach, useAddCampusOutreach, useDeleteCampusOutreach,
  useCampusResources, useAddCampusResource, useUpdateCampusResource, useDeleteCampusResource,
  useUnitActivation,
  type StudyCircleFrequency, type CampusOutreachType, type CampusResourceType,
} from "@/hooks/api/use-campus-workflows";

type WTab = "activation" | "circles" | "outreach" | "resources";

const FREQ_LABEL: Record<StudyCircleFrequency, { en: string; hi: string }> = {
  weekly: { en: "Weekly", hi: "साप्ताहिक" }, biweekly: { en: "Bi-weekly", hi: "पाक्षिक" },
  monthly: { en: "Monthly", hi: "मासिक" }, one_time: { en: "One-time", hi: "एक बार" },
};
const OUTREACH_LABEL: Record<CampusOutreachType, { en: string; hi: string }> = {
  seminar: { en: "Seminar", hi: "संगोष्ठी" }, lecture: { en: "Lecture", hi: "व्याख्यान" },
  workshop: { en: "Workshop", hi: "कार्यशाला" }, book_discussion: { en: "Book Discussion", hi: "पुस्तक चर्चा" },
};
const RESOURCE_LABEL: Record<CampusResourceType, { en: string; hi: string }> = {
  book: { en: "Book", hi: "पुस्तक" }, journal: { en: "Journal", hi: "पत्रिका" },
  digital: { en: "Digital", hi: "डिजिटल" }, study_material: { en: "Study Material", hi: "अध्ययन सामग्री" },
};

function fmtDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function CampusUnitWorkflows({ unitId, canManage }: { unitId: string; canManage: boolean }) {
  const t = useT();
  const [tab, setTab] = useState<WTab>("activation");

  const tabs: Array<{ key: WTab; label: string; icon: typeof Activity }> = [
    { key: "activation", label: t("Activation", "सक्रियता"), icon: Activity },
    { key: "circles", label: t("Study Circles", "अध्ययन मंडल"), icon: BookOpen },
    { key: "outreach", label: t("Outreach", "प्रसार"), icon: Megaphone },
    { key: "resources", label: t("Resources", "संसाधन"), icon: Package },
  ];

  return (
    <div className="space-y-4 border-t border-border/50 pt-5">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                active ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted",
              )}
            >
              <tb.icon className="h-3.5 w-3.5" /> {tb.label}
            </button>
          );
        })}
      </div>

      {tab === "activation" && <ActivationTab unitId={unitId} />}
      {tab === "circles" && <StudyCirclesTab unitId={unitId} canManage={canManage} />}
      {tab === "outreach" && <OutreachTab unitId={unitId} canManage={canManage} />}
      {tab === "resources" && <ResourcesTab unitId={unitId} canManage={canManage} />}
    </div>
  );
}

// ── Activation ───────────────────────────────────────────────────────────────
function ActivationTab({ unitId }: { unitId: string }) {
  const t = useT();
  const { data, isLoading } = useUnitActivation(unitId);
  if (isLoading || !data) return <Skeleton className="h-32 w-full rounded-xl" />;

  const bandStyle = data.band === "active"
    ? "text-emerald-600 border-emerald-500/30 bg-emerald-500/10"
    : data.band === "moderate" ? "text-amber-600 border-amber-500/30 bg-amber-500/10"
    : "text-destructive border-destructive/30 bg-destructive/10";
  const bandLabel = data.band === "active" ? t("Active", "सक्रिय") : data.band === "moderate" ? t("Moderate", "मध्यम") : t("Dormant", "निष्क्रिय");
  const c = data.components;

  const cells = [
    { label: t("Study circles", "अध्ययन मंडल"), value: `${c.studyCirclesCompleted}/${c.studyCirclesTotal}`, sub: t("completed", "पूर्ण") },
    { label: t("Outreach (quarter)", "प्रसार (तिमाही)"), value: c.outreachRecent, sub: t("recent", "हाल") },
    { label: t("Resources", "संसाधन"), value: c.resources, sub: t("distributed", "वितरित") },
    { label: t("Pending follow-up", "लंबित अनुवर्तन"), value: c.pendingFollowUp, sub: t("items", "आइटम") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
          <svg viewBox="0 0 36 36" className="h-20 w-20 -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-muted" strokeWidth="3" />
            <circle cx="18" cy="18" r="15.9" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${data.score} 100`} />
          </svg>
          <span className="absolute text-lg font-bold text-foreground">{data.score}</span>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Activation score", "सक्रियता स्कोर")}</p>
          <Badge variant="outline" className={cn("text-[11px]", bandStyle)}>{bandLabel}</Badge>
          <p className="text-xs text-muted-foreground">{t("Based on study circles, outreach, and resources.", "अध्ययन मंडल, प्रसार एवं संसाधन के आधार पर।")}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cells.map((cell) => (
          <div key={cell.label} className="rounded-xl border border-border/60 bg-background/40 p-3">
            <p className="text-lg font-bold text-foreground">{cell.value}</p>
            <p className="text-[10px] text-muted-foreground">{cell.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Study Circles ────────────────────────────────────────────────────────────
function StudyCirclesTab({ unitId, canManage }: { unitId: string; canManage: boolean }) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const { data: circles = [], isLoading } = useStudyCircles(unitId);
  const add = useAddStudyCircle();
  const update = useUpdateStudyCircle();
  const del = useDeleteStudyCircle();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", frequency: "weekly" as StudyCircleFrequency, scheduledDate: "", topic: "" });

  const submit = async () => {
    if (!form.title.trim() || !form.scheduledDate) return;
    try {
      await add.mutateAsync({ unitId, title: form.title.trim(), frequency: form.frequency, scheduledDate: new Date(form.scheduledDate).toISOString(), topic: form.topic.trim() || undefined });
      setForm({ title: "", frequency: "weekly", scheduledDate: "", topic: "" }); setAdding(false);
    } catch (e) { addToast(e instanceof Error ? e.message : t("Failed.", "विफल।"), "error"); }
  };

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;

  return (
    <div className="space-y-2.5">
      {canManage && !adding && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> {t("Schedule study circle", "अध्ययन मंडल निर्धारित करें")}</Button>
      )}
      {adding && (
        <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t("Title", "शीर्षक")} className="h-8 text-sm" autoFocus />
          <Input value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder={t("Topic / reading", "विषय / पठन")} className="h-8 text-sm" />
          <div className="flex items-center gap-2">
            <Input type="date" value={form.scheduledDate} onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))} className="h-8 flex-1 text-xs" />
            <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as StudyCircleFrequency }))}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(FREQ_LABEL) as StudyCircleFrequency[]).map((k) => <SelectItem key={k} value={k}>{FREQ_LABEL[k].en}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="sm" className="h-8 shrink-0 px-2" disabled={add.isPending || !form.title.trim() || !form.scheduledDate} onClick={submit}>
              {add.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
      {circles.length === 0 && !adding && <p className="py-4 text-center text-xs text-muted-foreground">{t("No study circles scheduled.", "कोई अध्ययन मंडल निर्धारित नहीं।")}</p>}
      {circles.map((c) => (
        <div key={c.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
          <button disabled={!canManage || update.isPending} onClick={() => update.mutateAsync({ id: c.id, unitId, completed: !c.completed })}
            className={cn("shrink-0", c.completed ? "text-emerald-600" : "text-muted-foreground hover:text-foreground")}>
            {c.completed ? <Check className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm", c.completed && "text-muted-foreground line-through")}>{isHi ? (c.titleHi || c.title) : c.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[9px]">{isHi ? FREQ_LABEL[c.frequency].hi : FREQ_LABEL[c.frequency].en}</Badge>
              {fmtDate(c.scheduledDate) && <span className="inline-flex items-center gap-0.5"><CalendarClock className="h-3 w-3" />{fmtDate(c.scheduledDate)}</span>}
              {c.attendance != null && <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{c.attendance}</span>}
              {c.topic && <span className="truncate">· {c.topic}</span>}
            </div>
          </div>
          {canManage && <button onClick={() => del.mutateAsync({ id: c.id, unitId })} className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      ))}
    </div>
  );
}

// ── Outreach ─────────────────────────────────────────────────────────────────
function OutreachTab({ unitId, canManage }: { unitId: string; canManage: boolean }) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const { data: log = [], isLoading } = useCampusOutreach(unitId);
  const add = useAddCampusOutreach();
  const del = useDeleteCampusOutreach();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ outreachType: "lecture" as CampusOutreachType, title: "", conductedBy: "", conductedDate: "", attendance: "" });

  const submit = async () => {
    if (!form.title.trim() || !form.conductedDate) return;
    try {
      await add.mutateAsync({ unitId, outreachType: form.outreachType, title: form.title.trim(), conductedBy: form.conductedBy.trim() || undefined, conductedDate: new Date(form.conductedDate).toISOString(), attendance: form.attendance ? Number(form.attendance) : undefined });
      setForm({ outreachType: "lecture", title: "", conductedBy: "", conductedDate: "", attendance: "" }); setAdding(false);
    } catch (e) { addToast(e instanceof Error ? e.message : t("Failed.", "विफल।"), "error"); }
  };

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;

  return (
    <div className="space-y-2.5">
      {canManage && !adding && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> {t("Log outreach", "प्रसार दर्ज करें")}</Button>
      )}
      {adding && (
        <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex gap-2">
            <Select value={form.outreachType} onValueChange={(v) => setForm((f) => ({ ...f, outreachType: v as CampusOutreachType }))}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(OUTREACH_LABEL) as CampusOutreachType[]).map((k) => <SelectItem key={k} value={k}>{OUTREACH_LABEL[k].en}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder={t("Title", "शीर्षक")} className="h-8 flex-1 text-sm" autoFocus />
          </div>
          <div className="flex gap-2">
            <Input value={form.conductedBy} onChange={(e) => setForm((f) => ({ ...f, conductedBy: e.target.value }))} placeholder={t("Conducted by", "संचालक")} className="h-8 flex-1 text-sm" />
            <Input type="date" value={form.conductedDate} onChange={(e) => setForm((f) => ({ ...f, conductedDate: e.target.value }))} className="h-8 w-36 text-xs" />
            <Input type="number" value={form.attendance} onChange={(e) => setForm((f) => ({ ...f, attendance: e.target.value }))} placeholder={t("Att.", "उपस्थिति")} className="h-8 w-20 text-sm" />
            <Button size="sm" className="h-8 shrink-0 px-2" disabled={add.isPending || !form.title.trim() || !form.conductedDate} onClick={submit}>
              {add.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
      {log.length === 0 && !adding && <p className="py-4 text-center text-xs text-muted-foreground">{t("No outreach logged.", "कोई प्रसार दर्ज नहीं।")}</p>}
      {log.map((o) => (
        <div key={o.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{o.title}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[9px]">{isHi ? OUTREACH_LABEL[o.outreachType].hi : OUTREACH_LABEL[o.outreachType].en}</Badge>
              {fmtDate(o.conductedDate) && <span className="inline-flex items-center gap-0.5"><CalendarClock className="h-3 w-3" />{fmtDate(o.conductedDate)}</span>}
              {o.attendance != null && <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{o.attendance}</span>}
              {o.conductedBy && <span className="truncate">· {o.conductedBy}</span>}
              {o.followUpNeeded && <span className="inline-flex items-center gap-0.5 text-amber-600"><AlertCircle className="h-3 w-3" />{t("Follow-up", "अनुवर्तन")}</span>}
            </div>
          </div>
          {canManage && <button onClick={() => del.mutateAsync({ id: o.id, unitId })} className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      ))}
    </div>
  );
}

// ── Resources ────────────────────────────────────────────────────────────────
function ResourcesTab({ unitId, canManage }: { unitId: string; canManage: boolean }) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const { data: resources = [], isLoading } = useCampusResources(unitId);
  const add = useAddCampusResource();
  const update = useUpdateCampusResource();
  const del = useDeleteCampusResource();

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ resourceType: "book" as CampusResourceType, resourceName: "", quantity: "1" });

  const submit = async () => {
    if (!form.resourceName.trim()) return;
    try {
      await add.mutateAsync({ unitId, resourceType: form.resourceType, resourceName: form.resourceName.trim(), quantity: Number(form.quantity) || 1 });
      setForm({ resourceType: "book", resourceName: "", quantity: "1" }); setAdding(false);
    } catch (e) { addToast(e instanceof Error ? e.message : t("Failed.", "विफल।"), "error"); }
  };

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;

  return (
    <div className="space-y-2.5">
      {canManage && !adding && (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> {t("Record distribution", "वितरण दर्ज करें")}</Button>
      )}
      {adding && (
        <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="flex gap-2">
            <Select value={form.resourceType} onValueChange={(v) => setForm((f) => ({ ...f, resourceType: v as CampusResourceType }))}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(RESOURCE_LABEL) as CampusResourceType[]).map((k) => <SelectItem key={k} value={k}>{RESOURCE_LABEL[k].en}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={form.resourceName} onChange={(e) => setForm((f) => ({ ...f, resourceName: e.target.value }))} placeholder={t("Resource name", "संसाधन नाम")} className="h-8 flex-1 text-sm" autoFocus />
            <Input type="number" min={1} value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="h-8 w-16 text-sm" />
            <Button size="sm" className="h-8 shrink-0 px-2" disabled={add.isPending || !form.resourceName.trim()} onClick={submit}>
              {add.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </Button>
            <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => setAdding(false)}><X className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      )}
      {resources.length === 0 && !adding && <p className="py-4 text-center text-xs text-muted-foreground">{t("No resources distributed.", "कोई संसाधन वितरित नहीं।")}</p>}
      {resources.map((r) => (
        <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{r.resourceName} <span className="text-muted-foreground">×{r.quantity}</span></p>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              <Badge variant="outline" className="text-[9px]">{isHi ? RESOURCE_LABEL[r.resourceType].hi : RESOURCE_LABEL[r.resourceType].en}</Badge>
              {fmtDate(r.distributedAt) && <span>{fmtDate(r.distributedAt)}</span>}
              <button
                disabled={!canManage || update.isPending}
                onClick={() => update.mutateAsync({ id: r.id, unitId, feedbackReceived: !r.feedbackReceived })}
                className={cn("inline-flex items-center gap-0.5", r.feedbackReceived ? "text-emerald-600" : "text-muted-foreground hover:text-foreground", !canManage && "pointer-events-none")}
              >
                <Check className="h-3 w-3" />{r.feedbackReceived ? t("Feedback in", "प्रतिक्रिया प्राप्त") : t("Mark feedback", "प्रतिक्रिया दर्ज")}
              </button>
            </div>
          </div>
          {canManage && <button onClick={() => del.mutateAsync({ id: r.id, unitId })} className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      ))}
    </div>
  );
}
