"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Hash, Search, Plus, Pencil, Layers, Tag, Sparkles, Loader2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useAppContext } from "@/context/AppContext";
import { useToast } from "@/components/ToastProvider";
import {
  useVishayas, useCreateVishaya, useUpdateVishaya, useDeleteVishaya,
  type Vishaya, type VishayaInput,
} from "@/hooks/api/use-vishayas";
import {
  vishayaColor, vishayaIcon, VISHAYA_COLOR_KEYS, VISHAYA_ICON_KEYS, VISHAYA_COLORS, VISHAYA_ICONS,
} from "@/lib/app/vishaya-style";

// ── Masthead ──────────────────────────────────────────────────────────────────
function VishayMasthead({ t, total, tagged }: { t: (en: string, hi: string) => string; total: number; tagged: number }) {
  return (
    <div className="relative space-y-6 overflow-hidden rounded-[2rem] border border-primary/10 bg-gradient-to-br from-primary/[0.04] via-background to-background p-6 md:p-8">
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[0.9rem] bg-gradient-to-br from-[#ffdcc6] via-[#f57c00] to-[#964900] shadow-[0_10px_24px_-12px_rgba(150,73,0,0.55)] ring-1 ring-primary/15">
              <Layers className="h-6 w-6 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-muted-foreground">
                {t("Vishay Taxonomy", "विषय वर्गीकरण")}
              </p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.32em] text-primary/80">
                Bharat · भारत
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="font-sans text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("Subjects of Intellectual Work", "बौद्धिक कार्य के विषय")}
            </h1>
            <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
              {t(
                "A living taxonomy that threads articles, events, scholars, research, and campus work under shared subject areas — so related thought stays connected.",
                "एक जीवंत वर्गीकरण जो लेख, कार्यक्रम, विद्वान, शोध और परिसर कार्य को साझा विषयों के अंतर्गत जोड़ता है — जिससे संबंधित चिंतन परस्पर जुड़ा रहे।",
              )}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-3 self-start">
          <div className="rounded-2xl border border-border/60 bg-background/50 px-5 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("Vishayas", "विषय")}</p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/50 px-5 py-3 text-center">
            <p className="text-2xl font-bold text-foreground">{tagged}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{t("Linked items", "जुड़े आइटम")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create / Edit dialog ────────────────────────────────────────────────────
const EMPTY_FORM: VishayaInput = { nameEn: "", nameHi: "", description: "", descriptionHi: "", color: "slate", icon: "Hash" };

function VishayFormDialog({
  open, onOpenChange, editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Vishaya | null;
}) {
  const t = useT();
  const { addToast } = useToast();
  const create = useCreateVishaya();
  const update = useUpdateVishaya();
  const deactivate = useDeleteVishaya();
  const [form, setForm] = useState<VishayaInput>(EMPTY_FORM);

  // Reset form whenever the dialog target changes.
  useEffect(() => {
    if (open) {
      setForm(editing
        ? {
            nameEn: editing.nameEn, nameHi: editing.nameHi,
            description: editing.description ?? "", descriptionHi: editing.descriptionHi ?? "",
            color: editing.color, icon: editing.icon,
          }
        : EMPTY_FORM);
    }
  }, [open, editing]);

  const pending = create.isPending || update.isPending || deactivate.isPending;

  const toggleActive = async () => {
    if (!editing) return;
    try {
      if (editing.isActive) {
        await deactivate.mutateAsync(editing.id);
        addToast(t("Vishay deactivated.", "विषय निष्क्रिय किया गया।"), "success");
      } else {
        await update.mutateAsync({ id: editing.id, isActive: true });
        addToast(t("Vishay reactivated.", "विषय पुनः सक्रिय किया गया।"), "success");
      }
      onOpenChange(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Action failed.", "क्रिया विफल।"), "error");
    }
  };

  const submit = async () => {
    if (!form.nameEn.trim() || !form.nameHi.trim()) {
      addToast(t("English and Hindi names are required.", "अंग्रेज़ी और हिंदी नाम आवश्यक हैं।"), "error");
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...form });
        addToast(t("Vishay updated.", "विषय अद्यतन हुआ।"), "success");
      } else {
        await create.mutateAsync(form);
        addToast(t("Vishay created.", "विषय बनाया गया।"), "success");
      }
      onOpenChange(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Save failed.", "सहेजना विफल।"), "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t("Edit Vishay", "विषय संपादित करें") : t("New Vishay", "नया विषय")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("Name (English)", "नाम (अंग्रेज़ी)")}</Label>
              <Input value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} placeholder="Political Science" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Name (Hindi)", "नाम (हिंदी)")}</Label>
              <Input value={form.nameHi} onChange={(e) => setForm((f) => ({ ...f, nameHi: e.target.value }))} placeholder="राजनीति शास्त्र" className="font-devanagari" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Description (English)", "विवरण (अंग्रेज़ी)")}</Label>
            <Textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Description (Hindi)", "विवरण (हिंदी)")}</Label>
            <Textarea value={form.descriptionHi ?? ""} onChange={(e) => setForm((f) => ({ ...f, descriptionHi: e.target.value }))} rows={2} className="font-devanagari" />
          </div>

          <div className="space-y-1.5">
            <Label>{t("Colour", "रंग")}</Label>
            <div className="flex flex-wrap gap-2">
              {VISHAYA_COLOR_KEYS.map((key) => {
                const c = VISHAYA_COLORS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, color: key }))}
                    aria-label={key}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition-transform",
                      c.dot,
                      form.color === key ? "scale-110 border-foreground" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("Icon", "चिह्न")}</Label>
            <div className="flex flex-wrap gap-2">
              {VISHAYA_ICON_KEYS.map((key) => {
                const Icon = VISHAYA_ICONS[key];
                const c = vishayaColor(form.color);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: key }))}
                    aria-label={key}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                      form.icon === key ? cn(c.bg, c.border, c.text) : "border-border/60 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          {editing ? (
            <Button
              variant="ghost"
              onClick={toggleActive}
              disabled={pending}
              className={cn("gap-2", editing.isActive ? "text-destructive hover:text-destructive" : "text-success")}
            >
              {editing.isActive ? t("Deactivate", "निष्क्रिय करें") : t("Reactivate", "पुनः सक्रिय करें")}
            </Button>
          ) : <span />}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
              {t("Cancel", "रद्द करें")}
            </Button>
            <Button onClick={submit} disabled={pending} className="gap-2">
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? t("Save changes", "परिवर्तन सहेजें") : t("Create vishay", "विषय बनाएँ")}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Card ────────────────────────────────────────────────────────────────────
function VishayCard({ v, isHi, canManage, onEdit, index }: {
  v: Vishaya;
  isHi: boolean;
  canManage: boolean;
  onEdit: (v: Vishaya) => void;
  index: number;
}) {
  const c = vishayaColor(v.color);
  const Icon = vishayaIcon(v.icon);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
    >
      <Card className={cn("institution-panel group h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg", c.border)}>
        <Link href={`/vishay/${v.id}`} className="block">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-start justify-between gap-3">
              <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm", c.bg, c.border)}>
                <Icon className={cn("h-5 w-5", c.text)} />
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-muted/40 text-[11px] font-medium">
                  {v.contentCount} {isHi ? "जुड़े" : "linked"}
                </Badge>
                {canManage && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(v); }}
                    className="rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                    aria-label="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <h3 className={cn("text-base font-bold leading-tight text-foreground", isHi && "font-devanagari")}>
                {isHi ? v.nameHi : v.nameEn}
              </h3>
              <p className={cn("text-[11px] uppercase tracking-wider text-muted-foreground", !isHi && "font-devanagari")}>
                {isHi ? v.nameEn : v.nameHi}
              </p>
            </div>
            {(isHi ? v.descriptionHi : v.description) && (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {isHi ? v.descriptionHi : v.description}
              </p>
            )}
          </CardContent>
        </Link>
      </Card>
    </motion.div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function Vishay() {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { permissions } = useAppContext();
  const canManage = permissions.canManageUsers;

  const { data: vishayas = [], isLoading, error } = useVishayas({ includeInactive: canManage });

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vishaya | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vishayas;
    return vishayas.filter(
      (v) => v.nameEn.toLowerCase().includes(q) || v.nameHi.includes(search.trim()) ||
        (v.description?.toLowerCase().includes(q) ?? false),
    );
  }, [vishayas, search]);

  const totalLinked = useMemo(() => vishayas.reduce((sum, v) => sum + v.contentCount, 0), [vishayas]);

  const openCreate = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (v: Vishaya) => { setEditing(v); setDialogOpen(true); };

  if (error) {
    return (
      <div className="py-24 text-center">
        <p className="text-sm text-muted-foreground">{t("Failed to load vishayas.", "विषय लोड करने में विफल।")}</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <VishayMasthead t={t} total={vishayas.length} tagged={totalLinked} />

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="section-seal">{t("Subject Areas", "विषय क्षेत्र")}</p>
            <h2 className="dashboard-section-heading">
              <Tag className="h-5 w-5 text-primary" />
              {t(`All Vishayas (${vishayas.length})`, `सभी विषय (${vishayas.length})`)}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search vishayas…", "विषय खोजें…")}
                className="h-11 rounded-2xl pl-11"
              />
            </div>
            {canManage && (
              <Button onClick={openCreate} className="h-11 shrink-0 gap-2 rounded-2xl">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">{t("Add Vishay", "विषय जोड़ें")}</span>
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="institution-panel">
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-11 w-11 rounded-2xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((v, i) => (
              <div key={v.id} className={cn(!v.isActive && "opacity-50")}>
                <VishayCard v={v} isHi={isHi} canManage={canManage} onEdit={openEdit} index={i} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border/80 bg-muted/30 py-24 text-center">
            <Hash className="mx-auto mb-6 h-16 w-16 text-muted-foreground/20" />
            <p className="font-devanagari text-base font-medium text-muted-foreground">
              {search
                ? t(`No vishayas matching "${search}"`, `"${search}" से मेल खाता कोई विषय नहीं`)
                : t("No vishayas yet.", "अभी कोई विषय नहीं।")}
            </p>
          </div>
        )}
      </section>

      {/* How it connects — institutional framing */}
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="section-seal">{t("How it connects", "यह कैसे जोड़ता है")}</p>
          <h2 className="dashboard-section-heading">
            <Sparkles className="h-5 w-5 text-primary" />
            {t("One Subject, Many Surfaces", "एक विषय, अनेक आयाम")}
          </h2>
        </div>
        <Card className="institution-panel">
          <CardContent className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { en: "Aalekh", hi: "आलेख" },
              { en: "Calendar", hi: "कार्यक्रम" },
              { en: "Scholars", hi: "विद्वत मंडल" },
              { en: "Shodh", hi: "शोध" },
              { en: "Campus Ikai", hi: "परिसर इकाई" },
              { en: "Prakashan", hi: "प्रकाशन" },
            ].map((m) => (
              <div key={m.en} className="rounded-xl border border-border/50 bg-background/40 p-3 text-center">
                <p className="text-sm font-semibold text-foreground">{isHi ? m.hi : m.en}</p>
                <p className={cn("text-[10px] text-muted-foreground", !isHi && "font-devanagari")}>{isHi ? m.en : m.hi}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <VishayFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} />
    </motion.div>
  );
}
