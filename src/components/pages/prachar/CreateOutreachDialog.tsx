"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { useCreateOutreach, useOutreachTypes, type OutreachTypeConfig } from "@/hooks/api/use-outreach";
import { outreachColor, outreachIcon } from "@/lib/app/outreach-style";

interface CampusUnit { id: string; name: string; nameHi: string | null }

function useCampusUnits(enabled: boolean) {
  return useQuery({
    queryKey: ["campus-units", "for-outreach"],
    queryFn: async () => {
      const res = await fetch("/api/v1/campus-units");
      const json = await res.json();
      const data = json?.data ?? [];
      return (Array.isArray(data) ? data : data.items ?? []) as CampusUnit[];
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function CreateOutreachDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const { data: types = [] } = useOutreachTypes();
  const create = useCreateOutreach();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [metadata, setMetadata] = useState<Record<string, unknown>>({});

  const typeDef: OutreachTypeConfig | undefined = useMemo(
    () => types.find((x) => x.type === selectedType),
    [types, selectedType],
  );

  const needsCampusUnits = typeDef?.fields.some((f) => f.source === "campus-units") ?? false;
  const { data: campusUnits = [] } = useCampusUnits(open && needsCampusUnits);

  // Reset whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setSelectedType(null);
      setTitle("");
      setDescription("");
      setDueDate("");
      setMetadata({});
    }
  }, [open]);

  const setMeta = (key: string, value: unknown) => setMetadata((m) => ({ ...m, [key]: value }));

  const canSubmit = !!selectedType && title.trim().length > 0 &&
    (typeDef?.fields.filter((f) => f.required).every((f) => {
      const v = metadata[f.key];
      return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== "";
    }) ?? true);

  const submit = async () => {
    if (!selectedType || !title.trim()) return;
    try {
      await create.mutateAsync({
        outreachType: selectedType,
        title: title.trim(),
        description: description.trim() || null,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        metadata,
      });
      addToast(t("Outreach created.", "प्रसार कार्य बनाया गया।"), "success");
      onOpenChange(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Failed to create outreach.", "प्रसार बनाने में विफल।"), "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("New Outreach", "नया प्रसार कार्य")}</DialogTitle>
          <DialogDescription>
            {t("Pick an outreach type, then fill in its details.", "प्रसार प्रकार चुनें, फिर उसका विवरण भरें।")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type picker */}
          <div className="space-y-2">
            <Label>{t("Outreach type", "प्रसार प्रकार")}</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {types.map((ty) => {
                const c = outreachColor(ty.color);
                const Icon = outreachIcon(ty.icon);
                const active = selectedType === ty.type;
                return (
                  <button
                    key={ty.type}
                    type="button"
                    onClick={() => { setSelectedType(ty.type); setMetadata({}); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all",
                      active ? cn(c.bg, c.border, "ring-1 ring-inset", c.text) : "border-border/60 hover:bg-muted",
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active ? c.text : "text-muted-foreground")} />
                    <span className="text-[11px] font-semibold leading-tight">{isHi ? ty.labelHi : ty.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedType && (
            <>
              <div className="space-y-1.5">
                <Label>{t("Title", "शीर्षक")}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("What is this outreach about?", "यह प्रसार किस बारे में है?")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Description", "विवरण")} <span className="text-xs text-muted-foreground">({t("optional", "वैकल्पिक")})</span></Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("Due date", "नियत तिथि")} <span className="text-xs text-muted-foreground">({t("optional", "वैकल्पिक")})</span></Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>

              {/* Dynamic type-specific fields */}
              {typeDef && typeDef.fields.length > 0 && (
                <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t(`${isHi ? typeDef.labelHi : typeDef.labelEn} details`, `${typeDef.labelHi} विवरण`)}
                  </p>
                  {typeDef.fields.map((f) => {
                    const label = (isHi ? f.labelHi : f.labelEn) + (f.required ? " *" : "");
                    const val = metadata[f.key];

                    if (f.type === "select" && f.source === "campus-units") {
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="text-xs">{label}</Label>
                          <Select value={(val as string) ?? ""} onValueChange={(v) => setMeta(f.key, v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder={t("Select unit", "इकाई चुनें")} /></SelectTrigger>
                            <SelectContent>
                              {campusUnits.map((u) => (
                                <SelectItem key={u.id} value={u.id}>{isHi ? (u.nameHi ?? u.name) : u.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }

                    if (f.type === "select" && f.options) {
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="text-xs">{label}</Label>
                          <Select value={(val as string) ?? ""} onValueChange={(v) => setMeta(f.key, v)}>
                            <SelectTrigger className="h-9"><SelectValue placeholder={t("Select", "चुनें")} /></SelectTrigger>
                            <SelectContent>
                              {f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    }

                    if (f.type === "multiselect" && f.options) {
                      const arr = Array.isArray(val) ? (val as string[]) : [];
                      return (
                        <div key={f.key} className="space-y-1.5">
                          <Label className="text-xs">{label}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {f.options.map((o) => {
                              const on = arr.includes(o);
                              return (
                                <button
                                  key={o}
                                  type="button"
                                  onClick={() => setMeta(f.key, on ? arr.filter((x) => x !== o) : [...arr, o])}
                                  className={cn(
                                    "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                                    on ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted",
                                  )}
                                >
                                  {o}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-xs">{label}</Label>
                        <Input
                          type={f.type === "number" ? "number" : f.type === "url" ? "url" : f.type === "date" ? "date" : "text"}
                          value={(val as string | number) ?? ""}
                          onChange={(e) => setMeta(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                          className="h-9"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {selectedType && !canSubmit && (
            <Badge variant="outline" className="mr-auto self-center text-[10px] text-muted-foreground">
              {t("Fill required fields", "आवश्यक फ़ील्ड भरें")}
            </Badge>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            {t("Cancel", "रद्द करें")}
          </Button>
          <Button onClick={submit} disabled={!canSubmit || create.isPending} className="gap-2">
            {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("Create outreach", "प्रसार बनाएँ")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
