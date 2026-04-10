"use client";

import type { Dispatch, SetStateAction } from "react";
import { CheckCircle2, FileText, Link2, Plus, QrCode, Sparkles, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/useT";
import type { GatividhiEvent, VrittStatus } from "@/lib/app/contracts";

import type { VrittEditorState } from "./types";

interface DashboardReviewOverlaysProps {
  vrittEvent: GatividhiEvent | null;
  qrEvent: GatividhiEvent | null;
  vrittForm: VrittEditorState;
  setVrittForm: Dispatch<SetStateAction<VrittEditorState>>;
  onCloseVritt: () => void;
  onCloseQr: () => void;
  onGenerateSmartDraft: () => void;
  onSaveVritt: () => Promise<void>;
}

export function DashboardReviewOverlays({
  vrittEvent,
  qrEvent,
  vrittForm,
  setVrittForm,
  onCloseVritt,
  onCloseQr,
  onGenerateSmartDraft,
  onSaveVritt,
}: DashboardReviewOverlaysProps) {
  const t = useT();
  const { addToast } = useToast();

  return (
    <>
      <Sheet open={!!vrittEvent} onOpenChange={(open) => !open && onCloseVritt()}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {vrittEvent && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-2 text-base font-devanagari">
                  <FileText className="h-4 w-4 text-primary" /> {t("Vritt — Post-Event Report", "वृत्त — कार्यक्रम विवरण")}
                </SheetTitle>
                <SheetDescription>
                  {t("Update the post-event report, attendance count, and supporting media links.", "कार्यक्रमोत्तर विवरण, उपस्थिति संख्या और मीडिया लिंक अद्यतन करें।")}
                </SheetDescription>
                <p className="text-xs text-muted-foreground">
                  {vrittEvent.title} · {vrittEvent.date}
                </p>
              </SheetHeader>

              <div className="space-y-4">
                <div>
                  <Label className="font-devanagari">{t("Status", "स्थिति")}</Label>
                  <Select value={vrittForm.status} onValueChange={(value: string) => setVrittForm((previous) => ({ ...previous, status: value as VrittStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="draft">{t("Draft", "प्रारूप")}</SelectItem>
                      <SelectItem value="submitted">{t("Submitted", "प्रस्तुत")}</SelectItem>
                      <SelectItem value="reviewed">{t("Reviewed", "समीक्षित")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-devanagari">{t("Attendance Count", "उपस्थिति संख्या")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={vrittForm.attendanceCount || ""}
                    onChange={(event) => setVrittForm((previous) => ({ ...previous, attendanceCount: parseInt(event.target.value, 10) || 0 }))}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="font-devanagari">{t("Report Content", "विवरण सामग्री")}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 border border-primary/20 px-2 text-[10px] text-primary hover:bg-primary/5"
                    onClick={onGenerateSmartDraft}
                  >
                    <Sparkles className="h-3 w-3" /> {t("Smart Draft", "स्मार्ट ड्राफ्ट")}
                  </Button>
                </div>

                <Textarea
                  value={vrittForm.content}
                  onChange={(event) => setVrittForm((previous) => ({ ...previous, content: event.target.value }))}
                  rows={5}
                  placeholder={t("Write the post-event report...", "कार्यक्रम के बाद का विवरण लिखें...")}
                />

                <div>
                  <Label className="font-devanagari">
                    {t("Media URLs", "मीडिया लिंक")}{" "}
                    <span className="text-xs font-normal text-muted-foreground">({t("photos, videos", "फ़ोटो, वीडियो")})</span>
                  </Label>
                  <div className="mt-1 space-y-2">
                    {vrittForm.mediaUrls.map((url, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={url}
                          onChange={(event) =>
                            setVrittForm((previous) => ({
                              ...previous,
                              mediaUrls: previous.mediaUrls.map((currentUrl, mediaIndex) => (mediaIndex === index ? event.target.value : currentUrl)),
                            }))
                          }
                          placeholder="https://..."
                          type="url"
                          className="text-sm"
                        />
                        {vrittForm.mediaUrls.length > 1 && (
                          <button
                            onClick={() => setVrittForm((previous) => ({ ...previous, mediaUrls: previous.mediaUrls.filter((_, mediaIndex) => mediaIndex !== index) }))}
                            className="shrink-0 text-muted-foreground hover:text-destructive"
                            aria-label={t("Remove media URL", "मीडिया लिंक हटाएँ")}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {vrittForm.mediaUrls.length < 5 && (
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setVrittForm((previous) => ({ ...previous, mediaUrls: [...previous.mediaUrls, ""] }))}>
                        <Plus className="mr-1 h-3 w-3" /> {t("Add URL", "लिंक जोड़ें")}
                      </Button>
                    )}
                  </div>
                </div>

                <Button className="w-full" onClick={() => void onSaveVritt()}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> {t("Save Vritt", "वृत्त सहेजें")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!qrEvent} onOpenChange={(open) => !open && onCloseQr()}>
        <DialogContent className="bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-devanagari">
              <QrCode className="h-5 w-5 text-amber-600" /> {t("Venue Check-in QR", "उपस्थिति क्यूआर कोड")}
            </DialogTitle>
            <DialogDescription>
              {t("Share this QR code for event attendance check-in.", "कार्यक्रम उपस्थिति चेक-इन के लिए यह क्यूआर साझा करें।")}
            </DialogDescription>
            {qrEvent && <p className="mt-1 text-xs text-muted-foreground">{qrEvent.title}</p>}
          </DialogHeader>

          <div className="flex flex-col items-center justify-center space-y-6 p-6">
            <div className="rounded-3xl border-8 border-primary/5 bg-white p-4 shadow-xl">
              {qrEvent && <QRCodeSVG value={`${window.location.origin}/form/${qrEvent.id}/checkin`} size={240} level="H" includeMargin />}
            </div>

            <div className="space-y-2 text-center">
              <p className="text-sm font-bold font-devanagari">{t("Scan to mark attendance", "उपस्थिति दर्ज करने के लिए स्कैन करें")}</p>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("This QR links to the official institutional check-in page for this event.", "यह क्यूआर इस कार्यक्रम के आधिकारिक संस्थागत चेक-इन पेज से जुड़ता है।")}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl text-xs"
                onClick={() => {
                  if (qrEvent) {
                    navigator.clipboard.writeText(`${window.location.origin}/form/${qrEvent.id}/checkin`);
                    addToast(t("Check-in link copied!", "चेक-इन लिंक कॉपी हुआ!"), "success");
                  }
                }}
              >
                <Link2 className="h-4 w-4" /> {t("Copy Check-in Link", "चेक-इन लिंक कॉपी करें")}
              </Button>
              <Button variant="ghost" className="text-xs" onClick={onCloseQr}>
                {t("Close", "बंद करें")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

