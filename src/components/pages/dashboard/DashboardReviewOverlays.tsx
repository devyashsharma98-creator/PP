"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import {
  CheckCircle2, FileText, Link2, Lock, Plus, QrCode, RefreshCw, RotateCcw, Save, Send, Sparkles, X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/lib/useT";
import type { GatividhiEvent } from "@/lib/app/contracts";
import type { VrittAction, VrittActions, VrittStatus } from "@/lib/app/vritt-access";
import type { StoredVritt } from "@/lib/app/vritt-payload";

import type { VrittEditorState } from "./types";

interface DashboardReviewOverlaysProps {
  vrittEvent: GatividhiEvent | null;
  qrEvent: GatividhiEvent | null;
  vrittForm: VrittEditorState;
  setVrittForm: Dispatch<SetStateAction<VrittEditorState>>;
  vrittView: VrittSheetView;
  reviewNotes: string;
  setReviewNotes: (value: string) => void;
  isVrittDirty: boolean;
  pendingVrittAction: VrittSheetCommand | null;
  vrittActionError: VrittActionErrorView | null;
  onVrittAction: (command: VrittSheetCommand) => Promise<void>;
  onCloseVritt: () => void;
  onCloseQr: () => void;
  onGenerateSmartDraft: () => void;
}

export function DashboardReviewOverlays({
  vrittEvent,
  qrEvent,
  vrittForm,
  setVrittForm,
  vrittView,
  reviewNotes,
  setReviewNotes,
  isVrittDirty,
  pendingVrittAction,
  vrittActionError,
  onVrittAction,
  onCloseVritt,
  onCloseQr,
  onGenerateSmartDraft,
}: DashboardReviewOverlaysProps) {
  const t = useT();
  const { addToast } = useToast();

  return (
    <>
      <Sheet open={!!vrittEvent} onOpenChange={(open) => !open && onCloseVritt()}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {vrittEvent && (
            <VrittSheetBody
              event={vrittEvent}
              form={vrittForm}
              setForm={setVrittForm}
              view={vrittView}
              reviewNotes={reviewNotes}
              setReviewNotes={setReviewNotes}
              isDirty={isVrittDirty}
              pendingAction={pendingVrittAction}
              actionError={vrittActionError}
              onAction={onVrittAction}
              onGenerateSmartDraft={onGenerateSmartDraft}
            />
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

// ── Vritt sheet ──────────────────────────────────────────────────────────────

/** What the sheet knows about the stored report while it is open. */
export type VrittSheetView =
  | { state: "loading" }
  | { state: "error"; message: string; forbidden: boolean; onRetry: () => void }
  | { state: "ready"; stored: StoredVritt | null; actions: VrittActions };

/**
 * `saveAndSubmit` saves the edits on screen as the draft, then submits it.
 * `submitSaved` submits the last saved draft and discards the edits on screen.
 */
export type VrittSheetCommand = VrittAction | "saveAndSubmit" | "submitSaved";

export interface VrittActionErrorView {
  /** Localised headline. */
  title: string;
  /** The server's explanation, shown as given. */
  detail?: string;
  /** The report changed underneath the viewer and has been reloaded. */
  stale?: boolean;
}

interface VrittSheetBodyProps {
  event: GatividhiEvent;
  form: VrittEditorState;
  setForm: Dispatch<SetStateAction<VrittEditorState>>;
  view: VrittSheetView;
  reviewNotes: string;
  setReviewNotes: (value: string) => void;
  isDirty: boolean;
  pendingAction: VrittSheetCommand | null;
  actionError: VrittActionErrorView | null;
  onAction: (command: VrittSheetCommand) => Promise<void>;
  onGenerateSmartDraft: () => void;
}

export function VrittSheetBody({
  event,
  form,
  setForm,
  view,
  reviewNotes,
  setReviewNotes,
  isDirty,
  pendingAction,
  actionError,
  onAction,
  onGenerateSmartDraft,
}: VrittSheetBodyProps) {
  const t = useT();
  const [confirmingSubmit, setConfirmingSubmit] = useState(false);

  // A fresh report, or a change of stage, clears any half-made decision.
  const stage = view.state === "ready" ? view.stored?.status ?? "none" : view.state;
  useEffect(() => {
    setConfirmingSubmit(false);
  }, [event.id, stage]);

  const header = (
    <SheetHeader className="mb-5">
      <SheetTitle className="flex items-center gap-2 text-base font-devanagari">
        <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        {t("Vritt — Post-Event Report", "वृत्त — कार्यक्रम विवरण")}
      </SheetTitle>
      <SheetDescription>
        {t(
          "Write the report as a draft, then submit it for review. Submitted reports are locked.",
          "विवरण को प्रारूप में लिखें, फिर समीक्षा के लिए प्रस्तुत करें। प्रस्तुत विवरण बंद हो जाता है।",
        )}
      </SheetDescription>
      <p className="break-words text-xs text-muted-foreground">
        {event.title} · {event.date}
      </p>
    </SheetHeader>
  );

  if (view.state === "loading") {
    return (
      <>
        {header}
        <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground" role="status" aria-live="polite">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" aria-hidden="true" />
          {t("Loading the report…", "विवरण लोड हो रहा है…")}
        </div>
      </>
    );
  }

  if (view.state === "error") {
    return (
      <>
        {header}
        <div className="space-y-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4" role="alert">
          <p className="text-sm font-medium text-destructive">
            {view.forbidden
              ? t("You do not have access to this event's report.", "इस कार्यक्रम के विवरण तक आपकी पहुँच नहीं है।")
              : t("The report could not be loaded.", "विवरण लोड नहीं हो सका।")}
          </p>
          <p className="break-words text-xs text-muted-foreground">{view.message}</p>
          {!view.forbidden && (
            <Button variant="outline" size="sm" onClick={view.onRetry}>
              <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {t("Try again", "पुनः प्रयास करें")}
            </Button>
          )}
        </div>
      </>
    );
  }

  const { stored, actions } = view;
  const status: VrittStatus | null = stored?.status ?? null;
  const editable = actions.saveDraft.allowed;
  const busy = pendingAction !== null;
  const anyAction = (Object.keys(actions) as VrittAction[]).some((a) => actions[a].allowed);

  const statusLabel =
    status === "submitted"
      ? t("Submitted", "प्रस्तुत")
      : status === "reviewed"
        ? t("Reviewed", "समीक्षित")
        : status === "draft"
          ? t("Draft", "प्रारूप")
          : t("Not started", "आरंभ नहीं");

  const statusTone =
    status === "reviewed"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : status === "submitted"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300"
        : "border-border bg-muted text-muted-foreground";

  let lockNotice: string | null = null;
  if (status === "submitted") {
    lockNotice = actions.review.allowed
      ? t(
          "Submitted for review. Accept it as written, or reopen it to draft to ask for changes.",
          "समीक्षा हेतु प्रस्तुत। इसे जैसा लिखा है वैसा स्वीकार करें, या परिवर्तन हेतु प्रारूप में वापस खोलें।",
        )
      : t(
          "Submitted and locked. Only a reviewer can reopen it for changes.",
          "प्रस्तुत और बंद। परिवर्तन हेतु केवल समीक्षक इसे फिर खोल सकते हैं।",
        );
  } else if (status === "reviewed") {
    lockNotice = actions.reopen.allowed
      ? t(
          "Reviewed and on record. Reopen it to draft if it needs correcting.",
          "समीक्षित और अभिलेख में दर्ज। सुधार आवश्यक हो तो प्रारूप में फिर खोलें।",
        )
      : t(
          "Reviewed and on record. Only a reviewer can reopen it.",
          "समीक्षित और अभिलेख में दर्ज। केवल समीक्षक इसे फिर खोल सकते हैं।",
        );
  } else if (!editable) {
    lockNotice = t(
      "You can read this report but not edit it.",
      "आप यह विवरण पढ़ सकते हैं, पर संपादित नहीं कर सकते।",
    );
  }

  const requestSubmit = () => {
    // Submission sends no content, so unsaved edits would silently be left
    // behind. Make the person choose.
    if (isDirty) setConfirmingSubmit(true);
    else void onAction("submit");
  };

  const labelFor = (command: VrittSheetCommand, idle: string, idleHi: string, working: string, workingHi: string) =>
    pendingAction === command ? t(working, workingHi) : t(idle, idleHi);

  return (
    <>
      {header}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground font-devanagari">{t("Status", "स्थिति")}</span>
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusTone}`}
            data-testid="vritt-status"
          >
            {status && status !== "draft" && <Lock className="h-3 w-3" aria-hidden="true" />}
            {statusLabel}
          </span>
          {editable && isDirty && (
            <span className="text-xs text-amber-700 dark:text-amber-400" role="status">
              {t("Unsaved changes", "असहेजे परिवर्तन")}
            </span>
          )}
        </div>

        {lockNotice && (
          <p className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground" role="note">
            {lockNotice}
          </p>
        )}

        {actionError && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3" role="alert" data-testid="vritt-error">
            <p className="text-sm font-medium text-destructive">{actionError.title}</p>
            {actionError.detail && <p className="mt-1 break-words text-xs text-muted-foreground">{actionError.detail}</p>}
            {actionError.stale && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("The latest version has been loaded below.", "नवीनतम संस्करण नीचे लोड कर दिया गया है।")}
              </p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="vritt-attendance" className="font-devanagari">{t("Attendance Count", "उपस्थिति संख्या")}</Label>
          <Input
            id="vritt-attendance"
            type="number"
            inputMode="numeric"
            min={0}
            value={form.attendanceCount || ""}
            readOnly={!editable}
            disabled={!editable || busy}
            onChange={(e) => setForm((prev) => ({ ...prev, attendanceCount: parseInt(e.target.value, 10) || 0 }))}
            placeholder="0"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor="vritt-content" className="font-devanagari">{t("Report Content", "विवरण सामग्री")}</Label>
          {editable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 border border-primary/20 px-2 text-[10px] text-primary hover:bg-primary/5"
              onClick={onGenerateSmartDraft}
              disabled={busy}
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" /> {t("Smart Draft", "स्मार्ट ड्राफ्ट")}
            </Button>
          )}
        </div>

        <Textarea
          id="vritt-content"
          value={form.content}
          readOnly={!editable}
          disabled={!editable || busy}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          rows={6}
          placeholder={t("Write the post-event report...", "कार्यक्रम के बाद का विवरण लिखें...")}
        />

        <div>
          <Label className="font-devanagari">
            {t("Media URLs", "मीडिया लिंक")}{" "}
            <span className="text-xs font-normal text-muted-foreground">({t("photos, videos", "फ़ोटो, वीडियो")})</span>
          </Label>
          <div className="mt-1 space-y-2">
            {form.mediaUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={url}
                  readOnly={!editable}
                  disabled={!editable || busy}
                  aria-label={t(`Media URL ${index + 1}`, `मीडिया लिंक ${index + 1}`)}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      mediaUrls: prev.mediaUrls.map((u, i) => (i === index ? e.target.value : u)),
                    }))
                  }
                  placeholder="https://..."
                  type="url"
                  className="min-w-0 text-sm"
                />
                {editable && form.mediaUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, mediaUrls: prev.mediaUrls.filter((_, i) => i !== index) }))}
                    className="shrink-0 p-1 text-muted-foreground hover:text-destructive"
                    aria-label={t("Remove media URL", "मीडिया लिंक हटाएँ")}
                    disabled={busy}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {editable && form.mediaUrls.length < 5 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                disabled={busy}
                onClick={() => setForm((prev) => ({ ...prev, mediaUrls: [...prev.mediaUrls, ""] }))}
              >
                <Plus className="mr-1 h-3 w-3" aria-hidden="true" /> {t("Add URL", "लिंक जोड़ें")}
              </Button>
            )}
          </div>
        </div>

        {stored?.reviewNotes && status === "reviewed" && (
          <div className="rounded-lg border border-border/60 p-3">
            <p className="text-xs font-medium font-devanagari">{t("Review notes", "समीक्षा टिप्पणी")}</p>
            <p className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">{stored.reviewNotes}</p>
          </div>
        )}

        {actions.review.allowed && (
          <div>
            <Label htmlFor="vritt-review-notes" className="font-devanagari">
              {t("Review notes", "समीक्षा टिप्पणी")}{" "}
              <span className="text-xs font-normal text-muted-foreground">({t("optional", "वैकल्पिक")})</span>
            </Label>
            <Textarea
              id="vritt-review-notes"
              value={reviewNotes}
              disabled={busy}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={3}
              placeholder={t("Anything the record should note about this report", "इस विवरण के बारे में अभिलेख हेतु कोई टिप्पणी")}
            />
          </div>
        )}

        {confirmingSubmit && actions.submit.allowed && (
          <div className="space-y-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3" role="alertdialog" aria-labelledby="vritt-unsaved-title">
            <p id="vritt-unsaved-title" className="text-sm font-medium">
              {t("You have unsaved changes.", "आपके परिवर्तन सहेजे नहीं गए हैं।")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(
                "Submitting sends the saved draft for review. Save your changes first, or submit the last saved version.",
                "प्रस्तुत करने पर सहेजा गया प्रारूप समीक्षा हेतु जाता है। पहले परिवर्तन सहेजें, या अंतिम सहेजा संस्करण प्रस्तुत करें।",
              )}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button size="sm" disabled={busy} onClick={() => void onAction("saveAndSubmit")}>
                {labelFor("saveAndSubmit", "Save and submit", "सहेजें और प्रस्तुत करें", "Saving and submitting…", "सहेजकर प्रस्तुत किया जा रहा है…")}
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void onAction("submitSaved")}>
                {labelFor("submitSaved", "Discard changes and submit", "परिवर्तन छोड़कर प्रस्तुत करें", "Submitting…", "प्रस्तुत किया जा रहा है…")}
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmingSubmit(false)}>
                {t("Keep editing", "संपादन जारी रखें")}
              </Button>
            </div>
          </div>
        )}

        {!confirmingSubmit && anyAction && (
          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:justify-end">
            {actions.saveDraft.allowed && (
              <Button variant="outline" disabled={busy || (status !== null && !isDirty)} onClick={() => void onAction("saveDraft")}>
                <Save className="mr-2 h-4 w-4" aria-hidden="true" />
                {labelFor("saveDraft", "Save draft", "प्रारूप सहेजें", "Saving…", "सहेजा जा रहा है…")}
              </Button>
            )}
            {actions.submit.allowed && (
              <Button disabled={busy} onClick={requestSubmit}>
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                {labelFor("submit", "Submit for review", "समीक्षा हेतु प्रस्तुत करें", "Submitting…", "प्रस्तुत किया जा रहा है…")}
              </Button>
            )}
            {actions.reopen.allowed && (
              <Button variant="outline" disabled={busy} onClick={() => void onAction("reopen")}>
                <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                {labelFor("reopen", "Reopen to draft", "प्रारूप में फिर खोलें", "Reopening…", "फिर खोला जा रहा है…")}
              </Button>
            )}
            {actions.review.allowed && (
              <Button disabled={busy} onClick={() => void onAction("review")}>
                <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {labelFor("review", "Mark reviewed", "समीक्षित चिह्नित करें", "Recording review…", "समीक्षा दर्ज हो रही है…")}
              </Button>
            )}
          </div>
        )}

        {status === null && actions.saveDraft.allowed && (
          <p className="text-xs text-muted-foreground">
            {t("Save a draft first; it can then be submitted.", "पहले प्रारूप सहेजें; फिर उसे प्रस्तुत किया जा सकता है।")}
          </p>
        )}
      </div>
    </>
  );
}
