"use client";

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import { useAppContext, GatividhiEvent, VrittStatus } from "@/context/AppContext";
import { useDashboardEvents, useUpdateEventStatus, useUpdateVritt } from "@/hooks/api/use-dashboard";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { checklistItems, dashboardStatusBadgeClass, eventStatusHi } from "@/components/pages/dashboard/config";
import { useBonsaiLLM } from "@/hooks/use-bonsai-llm";
import { ArrowRight, CheckCircle2, Clock, FileText } from "lucide-react";
import { vrittSystemPrompt, vrittUserMessage } from "@/lib/bonsai/prompts";
import type { Lang } from "@/lib/app/contracts";
import { VibhagDashboardView } from "@/components/pages/dashboard/VibhagDashboardView";
import { AayamDashboardView } from "@/components/pages/dashboard/AayamDashboardView";
import { UnitDashboardView } from "@/components/pages/dashboard/UnitDashboardView";
import { DashboardReviewOverlays } from "@/components/pages/dashboard/DashboardReviewOverlays";
import { uiToDbEventStatus } from "@/lib/app/status-maps";
import { cn } from "@/lib/utils";
import { getCanonicalRoleFromUiRole, getDashboardLane } from "@/lib/app/dashboard-lane";

type ActionItem = {
  icon: ElementType;
  label: string;
  value: string | number;
  detail: string;
  intent: string;
  tone: "primary" | "warning" | "success";
};

function DashboardActionQueue({ items, t, lang }: { items: ActionItem[]; t: (en: string, hi: string) => string; lang: string }) {
  return (
    <section className="dashboard-panel-grid">
      {items.map((item) => {
        const Icon = item.icon;
        const toneClass =
          item.tone === "warning"
            ? "border-warning/20 bg-warning/[0.04]"
            : item.tone === "success"
              ? "border-success/20 bg-success/[0.04]"
              : "border-primary/20 bg-primary/[0.04]";

        return (
          <Card key={item.label} className="institution-panel-muted border-border/70">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", toneClass)}>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {item.value}
                </Badge>
              </div>
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className={cn("text-xs leading-5", lang === "hi" && "font-devanagari")}>{item.detail}</p>
                <p className="text-[11px] font-medium text-primary">{item.intent}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

export default function Dashboard() {
  const { role, lang, permissions, viewer } = useAppContext();
  const { addToast } = useToast();
  const t = useT();
  const { status: bonsaiStatus, generate: bonsaiGenerate, initModel: bonsaiInit } = useBonsaiLLM();
  const primaryRoleCode = viewer?.primaryRoleCode ?? getCanonicalRoleFromUiRole(role);
  const dashboardLane = getDashboardLane(primaryRoleCode);
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useDashboardEvents();
  const actionItems = useMemo<ActionItem[]>(() => {
    const reviewStatuses = [
      "Submitted by Unit",
      "Pending Aayam Review",
      "Pending Vibhag Review",
      "Pending Prant Authorization",
      "Pending Prant Dual Authorization",
    ];
    const pendingReview = events.filter((event) => reviewStatuses.includes(event.status));
    const drafts = events.filter((event) => event.status === "Draft");
    const published = events.filter((event) => event.status === "Published");
    const vrittPending = events.filter((event) => event.status === "Published" && (!event.vrittStatus || event.vrittStatus === "draft"));

    if (dashboardLane === "karyakarta") {
      return [
        {
          icon: FileText,
          label: t("Drafts to write or revise", "लिखे या सुधारे जाने वाले मसौदे"),
          value: drafts.length,
          detail: t("These are still in your unit lane.", "ये अभी आपकी इकाई धारा में हैं।"),
          intent: t("Write clearly, attach proof, then submit.", "स्पष्ट लिखें, प्रमाण जोड़ें, फिर भेजें।"),
          tone: "primary",
        },
        {
          icon: Clock,
          label: t("Items in review", "समीक्षा में प्रविष्टियाँ"),
          value: pendingReview.length,
          detail: t("Track what is waiting with Unit, Aayam, Vibhag, or Prant.", "यूनिट, आयाम, विभाग या प्रान्त में क्या रुका है, देखें।"),
          intent: t("Follow up only when the next lane asks for action.", "अगली धारा मांगे तभी आगे बढ़ाएँ।"),
          tone: "warning",
        },
        {
          icon: CheckCircle2,
          label: t("Published records", "प्रकाशित अभिलेख"),
          value: published.length,
          detail: t("Published events are visible in the institutional record.", "प्रकाशित कार्यक्रम संस्थागत अभिलेख में दिखेंगे।"),
          intent: t("Update Vritt where evidence is pending.", "जहाँ प्रमाण बाकी है, वृत्त अद्यतन करें।"),
          tone: "success",
        },
      ];
    }

    if (dashboardLane === "unit") {
      return [
        {
          icon: FileText,
          label: t("Unit drafts to clear", "इकाई के साफ़ होने वाले मसौदे"),
          value: drafts.length,
          detail: t("Drafts that need unit-level correction before review.", "समीक्षा से पहले इकाई स्तर पर सुधार चाहिए।"),
          intent: t("Correct, complete, and submit for Aayam review.", "सुधारें, पूरा करें, फिर आयाम समीक्षा में भेजें।"),
          tone: "primary",
        },
        {
          icon: Clock,
          label: t("Awaiting approval", "अनुमोदन प्रतीक्षित"),
          value: pendingReview.length,
          detail: t("Work already sent upward and waiting for the next lane.", "आगे भेजा हुआ कार्य अगली धारा में प्रतीक्षित है।"),
          intent: t("Keep follow-up gentle and evidence-based.", "सौम्य और प्रमाण आधारित अनुवर्ती रखें।"),
          tone: "warning",
        },
        {
          icon: CheckCircle2,
          label: t("Published from this lane", "इस धारा से प्रकाशित"),
          value: published.length,
          detail: t("Published output that came through the unit workflow.", "इकाई प्रवाह से निकला प्रकाशित कार्य।"),
          intent: t("Ensure post-event Vritt is complete.", "कार्यक्रमोत्तर वृत्त पूरा रखें।"),
          tone: "success",
        },
      ];
    }

    if (dashboardLane === "aayam") {
      return [
        {
          icon: Clock,
          label: t("Aayam review queue", "आयाम समीक्षा कतार"),
          value: pendingReview.filter((event) => event.status === "Submitted by Unit" || event.status === "Pending Aayam Review").length,
          detail: t("Programmes waiting for thematic review.", "विषयगत समीक्षा प्रतीक्षित कार्यक्रम।"),
          intent: t("Review, edit if needed, then forward to Vibhag.", "समीक्षा करें, जरूरत हो तो संपादित करें, फिर विभाग को भेजें।"),
          tone: "warning",
        },
        {
          icon: FileText,
          label: t("Forwarded record", "अग्रेषित अभिलेख"),
          value: events.filter((event) => event.status !== "Draft" && event.status !== "Submitted by Unit" && event.status !== "Pending Aayam Review").length,
          detail: t("Items already moved ahead or published.", "आगे भेजे या प्रकाशित किए गए कार्य।"),
          intent: t("Keep the thematic lane clean.", "विषयगत धारा साफ़ रखें।"),
          tone: "primary",
        },
        {
          icon: CheckCircle2,
          label: t("Published output", "प्रकाशित सामग्री"),
          value: published.length,
          detail: t("Published programmes available for Prachar and feed use.", "प्रचार और फ़ीड उपयोग हेतु प्रकाशित कार्यक्रम।"),
          intent: t("Confirm Prachar follow-through after publishing.", "प्रकाशन के बाद प्रचार अनुवर्ती पुष्टि करें।"),
          tone: "success",
        },
      ];
    }

    if (dashboardLane === "vibhag" || dashboardLane === "super_admin" || dashboardLane === "prant") {
      return [
        {
          icon: Clock,
          label: t("Approval queue", "अनुमोदन कतार"),
          value: pendingReview.length,
          detail: t("Items waiting at Vibhag or Prant level.", "विभाग या प्रान्त स्तर पर रुके कार्य।"),
          intent: t("Clear approvals before opening secondary panels.", "द्वितीयक पैनल से पहले अनुमोदन साफ़ करें।"),
          tone: "warning",
        },
        {
          icon: CheckCircle2,
          label: t("Published records", "प्रकाशित अभिलेख"),
          value: published.length,
          detail: t("Published work visible for institutional continuity.", "संस्थागत निरंतरता हेतु प्रकाशित कार्य।"),
          intent: t("Use these for review, feed, and accountability.", "समीक्षा, फ़ीड और उत्तरदायित्व के लिए उपयोग करें।"),
          tone: "success",
        },
        {
          icon: FileText,
          label: t("Vritt pending", "वृत्त बाकी"),
          value: vrittPending.length,
          detail: t("Published events where post-event reporting may be incomplete.", "प्रकाशित कार्यक्रम जिनमें कार्यक्रमोत्तर विवरण बाकी हो सकता है।"),
          intent: t("Complete evidence before closure.", "समापन से पहले प्रमाण पूरा करें।"),
          tone: "primary",
        },
      ];
    }

    return [
      {
        icon: Clock,
        label: t("Today’s action queue", "आज की कार्य कतार"),
        value: pendingReview.length || drafts.length,
        detail: t("Open the relevant lane below and take the next visible action.", "नीचे संबंधित धारा खोलें और अगला स्पष्ट कार्य करें।"),
        intent: t("Review first, then record.", "पहले समीक्षा, फिर अभिलेख।"),
        tone: "primary",
      },
    ];
  }, [dashboardLane, events, t]);

  const updateEventStatusMutation = useUpdateEventStatus();
  const updateVrittMutation = useUpdateVritt();

  const isApiConnected = !eventsError && !eventsLoading;
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [vrittEvent, setVrittEvent] = useState<GatividhiEvent | null>(null);
  const [vrittForm, setVrittForm] = useState({ content: '', attendanceCount: 0, mediaUrls: [''], status: 'draft' as VrittStatus });
  const [qrEvent, setQrEvent] = useState<GatividhiEvent | null>(null);

  // Loading state
  if (eventsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground font-devanagari">
            {t('Loading dashboard data...', 'डैशबोर्ड डेटा लोड हो रहा है...')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (eventsError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="space-y-4 text-center max-w-md">
          <p className="text-sm text-destructive font-devanagari">
            {t('Failed to load dashboard data.', 'डैशबोर्ड डेटा लोड करने में विफल।')}
          </p>
          <p className="text-xs text-muted-foreground">{(eventsError as Error).message}</p>
        </div>
      </div>
    );
  }

  const vrittStatusLabel = (s: VrittStatus) => {
    const map: Record<VrittStatus, string> = { draft: t('Draft', 'प्रारूप'), submitted: t('Submitted', 'प्रस्तुत'), reviewed: t('Reviewed', 'समीक्षित') };
    return map[s] ?? s;
  };

  const openVrittEditor = (event: GatividhiEvent) => {
    setVrittForm({
      content: event.vrittContent ?? '',
      attendanceCount: event.vrittAttendanceCount ?? 0,
      mediaUrls: event.vrittMediaUrls?.length ? [...event.vrittMediaUrls] : [''],
      status: event.vrittStatus ?? 'draft',
    });
    setVrittEvent(event);
  };

  const generateSmartDraft = async () => {
    if (!vrittEvent) return;

    const checkedArrangements = Object.entries(vrittEvent.checklist)
      .filter(([, checked]) => !!checked)
      .map(([key]) => checklistItems.find(i => i.key === key))
      .filter(Boolean)
      .map(item => t(item!.en, item!.hi));

    const regCount = vrittEvent.registrations?.length ?? 0;
    const totalPeople = vrittEvent.registrations?.reduce((s, r) => s + r.attendingCount, 0) ?? 0;
    const checkedIn = vrittEvent.vrittCheckedInCount ?? 0;

    // Use LLM when ready; otherwise fall back to template draft
    if (bonsaiStatus === "ready") {
      addToast(t('Sahayak is drafting…', 'सहायक लिख रहा है…'), 'info');
      const ctx = {
        title: vrittEvent.title,
        date: vrittEvent.date,
        unit: vrittEvent.unit,
        description: vrittEvent.description,
        checkedArrangements,
        registrationCount: regCount,
        expectedAttendance: totalPeople,
        checkIns: checkedIn,
      };
      const result = await bonsaiGenerate({
        systemPrompt: vrittSystemPrompt(lang as Lang),
        userMessage: vrittUserMessage(lang as Lang, ctx),
        maxTokens: 500,
        temperature: 0.5,
        onToken: (_token, full) =>
          setVrittForm(p => ({ ...p, content: full })),
      });
      if (result) {
        setVrittForm(p => ({
          ...p,
          content: result,
          attendanceCount: checkedIn || totalPeople || p.attendanceCount,
        }));
        addToast(t('Sahayak draft ready!', 'सहायक ड्राफ्ट तैयार!'), 'success');
      }
      return;
    }

    // If model not loaded yet, trigger init for next time and fall back to template
    if (bonsaiStatus === "idle") {
      bonsaiInit();
    }

    const isHi = lang === 'hi';
    const lines: string[] = [];
    lines.push(isHi ? `॥ वृत्त : ${vrittEvent.title} ॥` : `!! Vritt : ${vrittEvent.title} !!`);
    lines.push(isHi ? `दिनांक: ${vrittEvent.date} | इकाई: ${vrittEvent.unit}` : `Date: ${vrittEvent.date} | Unit: ${vrittEvent.unit}`);
    lines.push("");
    if (vrittEvent.description) {
      lines.push(isHi ? `मुख्य उद्देश्य: ${vrittEvent.description}` : `Core Objective: ${vrittEvent.description}`);
      lines.push("");
    }
    if (checkedArrangements.length > 0) {
      lines.push(isHi ? "समीक्षा (व्यवस्थाएँ):" : "Operational Review (Arrangements):");
      checkedArrangements.forEach(name => {
        lines.push(`• ${name}: ${isHi ? '[सफल/सुधार अपेक्षित]' : '[Successful / Needs Improvement]'}`);
      });
      lines.push("");
    }
    if (regCount > 0 || checkedIn > 0) {
      lines.push(isHi ? "उपस्थिति एवं सहभागिता:" : "Attendance & Participation:");
      if (regCount > 0) {
        lines.push(isHi ? `• कुल पंजीकरण: ${regCount}` : `• Total Registrations: ${regCount}`);
        lines.push(isHi ? `• अपेक्षित उपस्थिति: ${totalPeople}` : `• Expected Attendance: ${totalPeople}`);
      }
      if (checkedIn > 0) {
        lines.push(isHi ? `• क्यूआर चेक-इन (Venue QR): ${checkedIn}` : `• Venue QR Check-ins: ${checkedIn}`);
      }
      lines.push("");
    }
    lines.push(isHi ? "निष्कर्ष / आगामी योजना:" : "Conclusion / Next Steps:");
    lines.push(isHi ? "[कार्यक्रम का सारांश और आगामी कार्ययोजना यहाँ लिखें]" : "[Write event summary and future action points here]");
    setVrittForm(p => ({
      ...p,
      content: lines.join("\n"),
      attendanceCount: checkedIn || totalPeople || p.attendanceCount,
    }));
    addToast(t('Smart Draft generated!', 'स्मार्ट ड्राफ्ट तैयार!'), 'info');
  };

  const statusLabel = (status: string) => t(status, eventStatusHi[status] ?? status);
  
  const handleForwardToPrant = async (eventId: string) => {
    if (updateEventStatusMutation.isPending) return;
    try {
      await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'pending_prant_authorization' });
      addToast(t('Forwarded to Prant', 'प्रान्त को भेजा'), 'info');
    } catch {
      addToast(t('Failed to forward', 'भेजने में विफल'), 'error');
    }
  };

  const handlePublishFromVibhag = async (eventId: string, title: string, currentStatus: GatividhiEvent["status"]) => {
    if (updateEventStatusMutation.isPending) return;
    const dbStatus = uiToDbEventStatus[currentStatus] ?? currentStatus;
    const nextStatus = dbStatus === 'pending_prant_authorization'
      ? 'pending_prant_dual_authorization'
      : 'authorized_public';

    try {
      await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: nextStatus });
      setLastPublished(title);
      addToast(t('Published to Feed!', 'फ़ीड में प्रकाशित!'), 'success', t('Update Prachar now', 'प्रचार अद्यतन करें'));
    } catch {
      addToast(t('Publish failed', 'प्रकाशन विफल'), 'error');
    }
  };

  const handleForwardToVibhag = async (eventId: string, currentStatus: GatividhiEvent["status"]) => {
    if (updateEventStatusMutation.isPending) return;
    const toStatus = currentStatus === "Submitted by Unit" ? 'pending_aayam_review' : 'pending_vibhag_review';
    try {
      await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus });
      addToast(t('Forwarded for vibhag review', 'विभाग समीक्षा के लिए भेजा'), 'info', t('Sent to Vibhag Pramukh', 'विभाग प्रमुख की समीक्षा के लिए भेजा'));
    } catch {
      addToast(t('Forward not allowed', 'आगे भेजने की अनुमति नहीं है'), 'error');
    }
  };

  const handleSubmitFromUnit = async (eventId: string) => {
    if (updateEventStatusMutation.isPending) return;
    try {
      await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'submitted_by_unit' });
      addToast(t('Event submitted for review!', 'कार्यक्रम समीक्षा के लिए भेजा गया!'), 'success', t('Sent for Aayam review', 'आयाम समीक्षा के लिए भेजा गया'));
    } catch {
      addToast(t('Submit not allowed', 'भेजने की अनुमति नहीं है'), 'error');
    }
  };

  const saveVritt = async () => {
    if (!vrittEvent) return;
    if (updateVrittMutation.isPending) return;
    const urls = vrittForm.mediaUrls.filter((url) => url.trim());
    try {
      await updateVrittMutation.mutateAsync({
        eventId: vrittEvent.id,
        content: vrittForm.content,
        attendanceCount: vrittForm.attendanceCount,
        mediaUrls: urls.length > 0 ? urls : [],
        status: vrittForm.status,
      });
      addToast(t("Vritt saved!", "वृत्त सहेजा गया!"), "success");
      setVrittEvent(null);
    } catch {
      addToast(t("Failed to save vritt", "वृत्त सहेजा मरने में विफल"), "error");
    }
  };

  const reviewOverlays = (
    <DashboardReviewOverlays
      vrittEvent={vrittEvent}
      qrEvent={qrEvent}
      vrittForm={vrittForm}
      setVrittForm={setVrittForm}
      onCloseVritt={() => setVrittEvent(null)}
      onCloseQr={() => setQrEvent(null)}
      onGenerateSmartDraft={generateSmartDraft}
      onSaveVritt={saveVritt}
      isSavingVritt={updateVrittMutation.isPending}
    />
  );

  if (dashboardLane === "super_admin" || dashboardLane === "prant") {
    return (
      <>
        <DashboardActionQueue items={actionItems} t={t} lang={lang} />
        <UnitDashboardView
          dashboardKind="super_admin"
          events={events}
          isApiConnected={isApiConnected}
          statusBadge={dashboardStatusBadgeClass}
          statusLabel={statusLabel}
          vrittStatusLabel={vrittStatusLabel}
          onOpenVrittEditor={openVrittEditor}
          onOpenQr={setQrEvent}
          workflowPending={updateEventStatusMutation.isPending}
          onSubmitForReview={handleSubmitFromUnit}
          onForwardToVibhag={handleForwardToVibhag}
          onForwardToPrant={handleForwardToPrant}
          onPublishEvent={handlePublishFromVibhag}
        />
        {reviewOverlays}
      </>
    );
  }

  if (dashboardLane === "vibhag") {
    return (
      <>
        <DashboardActionQueue items={actionItems} t={t} lang={lang} />
        <VibhagDashboardView
          events={events}
          permissions={permissions}
          t={t}
          eventStatusHi={eventStatusHi}
          statusBadge={dashboardStatusBadgeClass}
          onOpenVrittEditor={openVrittEditor}
          onOpenQr={setQrEvent}
          lastPublished={lastPublished}
          workflowPending={updateEventStatusMutation.isPending}
          onDismissPublished={() => setLastPublished(null)}
          onForwardToPrant={handleForwardToPrant}
          onPublishEvent={handlePublishFromVibhag}
        />
        {reviewOverlays}
      </>
    );
  }

  if (dashboardLane === "aayam") {
    return (
      <>
        <DashboardActionQueue items={actionItems} t={t} lang={lang} />
        <AayamDashboardView
          dashboardKind={primaryRoleCode === "prant_aayam_pramukh" ? "prant_aayam_pramukh" : "aayam_pramukh"}
          events={events}
          permissions={permissions}
          t={t}
          eventStatusHi={eventStatusHi}
          statusBadge={dashboardStatusBadgeClass}
          onOpenVrittEditor={openVrittEditor}
          onOpenQr={setQrEvent}
          workflowPending={updateEventStatusMutation.isPending}
          onForwardToVibhag={(eventId, currentStatus) => handleForwardToVibhag(eventId, currentStatus)}
        />
        {reviewOverlays}
      </>
    );
  }
  return (
    <>
      <DashboardActionQueue items={actionItems} t={t} lang={lang} />
      <UnitDashboardView
        dashboardKind={dashboardLane === "karyakarta" ? "karyakarta" : "unit_head"}
        events={events}
        isApiConnected={isApiConnected}
        statusBadge={dashboardStatusBadgeClass}
        statusLabel={statusLabel}
        vrittStatusLabel={vrittStatusLabel}
        onOpenVrittEditor={openVrittEditor}
        onOpenQr={setQrEvent}
        workflowPending={updateEventStatusMutation.isPending}
        onSubmitForReview={handleSubmitFromUnit}
      />
      {reviewOverlays}
    </>
  );
}
