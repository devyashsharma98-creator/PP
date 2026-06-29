"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { useCreateProject, type ProjectStatus } from "@/hooks/api/use-research";
import { useSetVishayLinks } from "@/hooks/api/use-vishayas";
import { VishaySelect } from "@/components/vishay/VishaySelect";
import { PROJECT_STATUS_STYLE } from "@/lib/app/research-style";

interface Scholar { id: string; name: string; nameHi: string | null }
const NONE = "__none__";

function useScholars(enabled: boolean) {
  return useQuery({
    queryKey: ["scholars", "for-research"],
    queryFn: async () => {
      const res = await fetch("/api/v1/scholars");
      const json = await res.json();
      const data = json?.data ?? [];
      return (Array.isArray(data) ? data : data.items ?? []) as Scholar[];
    },
    enabled,
    staleTime: 5 * 60_000,
  });
}

export function CreateProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const create = useCreateProject();
  const setVishayLinks = useSetVishayLinks();
  const { data: scholars = [] } = useScholars(open);

  const [form, setForm] = useState({ title: "", titleHi: "", objective: "", status: "proposed" as ProjectStatus, leadResearcherId: NONE });
  const [vishayIds, setVishayIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm({ title: "", titleHi: "", objective: "", status: "proposed", leadResearcherId: NONE });
      setVishayIds([]);
    }
  }, [open]);

  const pending = create.isPending || setVishayLinks.isPending;

  const submit = async () => {
    if (!form.title.trim()) {
      addToast(t("Title is required.", "शीर्षक आवश्यक है।"), "error");
      return;
    }
    try {
      const created = await create.mutateAsync({
        title: form.title.trim(),
        titleHi: form.titleHi.trim() || null,
        objective: form.objective.trim() || null,
        status: form.status,
        leadResearcherId: form.leadResearcherId === NONE ? null : form.leadResearcherId,
      });
      if (vishayIds.length > 0 && created?.id) {
        try {
          await setVishayLinks.mutateAsync({ contentType: "project", contentId: created.id, vishayIds });
        } catch {
          addToast(t("Project saved, but vishay tags failed.", "परियोजना सहेजी गई, पर विषय टैग विफल।"), "error");
        }
      }
      addToast(t("Project created.", "परियोजना बनाई गई।"), "success");
      onOpenChange(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Create failed.", "बनाना विफल।"), "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("New Research Project", "नई शोध परियोजना")}</DialogTitle>
          <DialogDescription>{t("Propose a research project with a lead and subject areas.", "एक प्रमुख एवं विषय क्षेत्रों सहित शोध परियोजना प्रस्तावित करें।")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("Title (English)", "शीर्षक (अंग्रेज़ी)")}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Title (Hindi)", "शीर्षक (हिंदी)")}</Label>
              <Input value={form.titleHi} onChange={(e) => setForm((f) => ({ ...f, titleHi: e.target.value }))} className="font-devanagari" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Objective", "उद्देश्य")}</Label>
            <Textarea value={form.objective} onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))} rows={3} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("Lead researcher", "प्रमुख शोधकर्ता")}</Label>
              <Select value={form.leadResearcherId} onValueChange={(v) => setForm((f) => ({ ...f, leadResearcherId: v }))}>
                <SelectTrigger><SelectValue placeholder={t("Select scholar", "विद्वान चुनें")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>{t("Unassigned", "अनिर्धारित")}</SelectItem>
                  {scholars.map((s) => <SelectItem key={s.id} value={s.id}>{isHi ? (s.nameHi ?? s.name) : s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("Status", "स्थिति")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as ProjectStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PROJECT_STATUS_STYLE) as ProjectStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{PROJECT_STATUS_STYLE[s].labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Vishay", "विषय")} <span className="text-xs text-muted-foreground">({t("subject areas", "विषय क्षेत्र")})</span></Label>
            <VishaySelect value={vishayIds} onChange={setVishayIds} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>{t("Cancel", "रद्द करें")}</Button>
          <Button onClick={submit} disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("Create project", "परियोजना बनाएँ")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
