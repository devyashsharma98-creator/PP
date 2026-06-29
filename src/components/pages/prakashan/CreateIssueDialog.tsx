"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import {
  useCreatePublication, useUpdatePublication, type Publication, type IssueStatus,
} from "@/hooks/api/use-publications";
import { ISSUE_STATUS_STYLE } from "@/lib/app/publication-style";

export function CreateIssueDialog({ open, onOpenChange, editing }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Publication | null;
}) {
  const t = useT();
  const { addToast } = useToast();
  const create = useCreatePublication();
  const update = useUpdatePublication();

  const [form, setForm] = useState({ title: "", titleHi: "", subtitle: "", issueNumber: "", description: "", status: "draft" as IssueStatus });

  useEffect(() => {
    if (open) {
      setForm(editing
        ? {
            title: editing.title, titleHi: editing.titleHi, subtitle: editing.subtitle ?? "",
            issueNumber: editing.issueNumber ?? "", description: editing.description ?? "", status: editing.status,
          }
        : { title: "", titleHi: "", subtitle: "", issueNumber: "", description: "", status: "draft" });
    }
  }, [open, editing]);

  const pending = create.isPending || update.isPending;

  const submit = async () => {
    if (!form.title.trim() || !form.titleHi.trim()) {
      addToast(t("English and Hindi titles are required.", "अंग्रेज़ी और हिंदी शीर्षक आवश्यक हैं।"), "error");
      return;
    }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...form });
        addToast(t("Issue updated.", "अंक अद्यतन हुआ।"), "success");
      } else {
        await create.mutateAsync(form);
        addToast(t("Issue created.", "अंक बनाया गया।"), "success");
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
          <DialogTitle>{editing ? t("Edit Issue", "अंक संपादित करें") : t("New Issue", "नया अंक")}</DialogTitle>
          <DialogDescription>{t("An issue groups articles for publication.", "एक अंक प्रकाशन हेतु लेखों को समूहित करता है।")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("Title (English)", "शीर्षक (अंग्रेज़ी)")}</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Prajna Patrika" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Title (Hindi)", "शीर्षक (हिंदी)")}</Label>
              <Input value={form.titleHi} onChange={(e) => setForm((f) => ({ ...f, titleHi: e.target.value }))} placeholder="प्रज्ञा पत्रिका" className="font-devanagari" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("Issue number", "अंक संख्या")}</Label>
              <Input value={form.issueNumber} onChange={(e) => setForm((f) => ({ ...f, issueNumber: e.target.value }))} placeholder="Vol.3 No.1" />
            </div>
            <div className="space-y-1.5">
              <Label>{t("Status", "स्थिति")}</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as IssueStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ISSUE_STATUS_STYLE) as IssueStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>{ISSUE_STATUS_STYLE[s].labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Subtitle", "उपशीर्षक")}</Label>
            <Input value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Description", "विवरण")}</Label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>{t("Cancel", "रद्द करें")}</Button>
          <Button onClick={submit} disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? t("Save", "सहेजें") : t("Create issue", "अंक बनाएँ")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
