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
import { usePublications, useSubmitArticle } from "@/hooks/api/use-publications";
import { useSetVishayLinks } from "@/hooks/api/use-vishayas";
import { VishaySelect } from "@/components/vishay/VishaySelect";

const NONE = "__none__";

export function SubmitArticleDialog({ open, onOpenChange, defaultPublicationId }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultPublicationId?: string | null;
}) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const { data: issues = [] } = usePublications();
  const submit = useSubmitArticle();
  const setVishayLinks = useSetVishayLinks();

  const [form, setForm] = useState({ title: "", titleHi: "", abstract: "", body: "", references: "", publicationId: NONE });
  const [vishayIds, setVishayIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm({ title: "", titleHi: "", abstract: "", body: "", references: "", publicationId: defaultPublicationId ?? NONE });
      setVishayIds([]);
    }
  }, [open, defaultPublicationId]);

  const onSubmit = async () => {
    if (!form.title.trim()) {
      addToast(t("Title is required.", "शीर्षक आवश्यक है।"), "error");
      return;
    }
    try {
      const created = await submit.mutateAsync({
        title: form.title.trim(),
        titleHi: form.titleHi.trim() || null,
        abstract: form.abstract.trim() || null,
        body: form.body,
        references: form.references.trim() || null,
        publicationId: form.publicationId === NONE ? null : form.publicationId,
      });
      // Best-effort vishay tagging via the cross-module bridge.
      if (vishayIds.length > 0 && created?.id) {
        try {
          await setVishayLinks.mutateAsync({ contentType: "publication", contentId: created.id, vishayIds });
        } catch {
          addToast(t("Submitted, but vishay tags failed.", "प्रस्तुत, पर विषय टैग विफल।"), "error");
        }
      }
      addToast(t("Article submitted for review.", "लेख समीक्षा हेतु प्रस्तुत।"), "success");
      onOpenChange(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Submission failed.", "प्रस्तुति विफल।"), "error");
    }
  };

  const pending = submit.isPending || setVishayLinks.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Submit Article", "लेख प्रस्तुत करें")}</DialogTitle>
          <DialogDescription>{t("Submit a scholarly article into the editorial review process.", "विद्वत लेख को संपादकीय समीक्षा में प्रस्तुत करें।")}</DialogDescription>
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
            <Label>{t("Issue", "अंक")} <span className="text-xs text-muted-foreground">({t("optional", "वैकल्पिक")})</span></Label>
            <Select value={form.publicationId} onValueChange={(v) => setForm((f) => ({ ...f, publicationId: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("Unassigned", "अनिर्धारित")}</SelectItem>
                {issues.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{(isHi ? i.titleHi : i.title)}{i.issueNumber ? ` · ${i.issueNumber}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("Abstract", "सारांश")}</Label>
            <Textarea value={form.abstract} onChange={(e) => setForm((f) => ({ ...f, abstract: e.target.value }))} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Body", "मुख्य पाठ")}</Label>
            <Textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={5} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("References", "संदर्भ")} <span className="text-xs text-muted-foreground">({t("optional", "वैकल्पिक")})</span></Label>
            <Textarea value={form.references} onChange={(e) => setForm((f) => ({ ...f, references: e.target.value }))} rows={2} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("Vishay", "विषय")} <span className="text-xs text-muted-foreground">({t("subject areas", "विषय क्षेत्र")})</span></Label>
            <VishaySelect value={vishayIds} onChange={setVishayIds} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>{t("Cancel", "रद्द करें")}</Button>
          <Button onClick={onSubmit} disabled={pending} className="gap-2">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("Submit for review", "समीक्षा हेतु प्रस्तुत करें")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
