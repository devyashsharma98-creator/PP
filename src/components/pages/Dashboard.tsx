"use client";

import { useState } from "react";
import { useAppContext, GatividhiEvent, VrittStatus } from "@/context/AppContext";
import { useDashboardEvents, useUpdateEventStatus, useUpdateVritt } from "@/hooks/api/use-dashboard";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { checklistItems, dashboardStatusBadgeClass, eventStatusHi } from "@/components/pages/dashboard/config";
import { useBonsaiLLM } from "@/hooks/use-bonsai-llm";
import { vrittSystemPrompt, vrittUserMessage } from "@/lib/bonsai/prompts";
import type { Lang } from "@/lib/app/contracts";
import { VibhagDashboardView } from "@/components/pages/dashboard/VibhagDashboardView";
import { AayamDashboardView } from "@/components/pages/dashboard/AayamDashboardView";
import { UnitDashboardView } from "@/components/pages/dashboard/UnitDashboardView";
import { DashboardReviewOverlays } from "@/components/pages/dashboard/DashboardReviewOverlays";
import { uiToDbEventStatus } from "@/lib/app/status-maps";
import { PrajnaDashboard } from "@/components/pages/PrajnaDashboard";
import { getCanonicalRoleFromUiRole, getDashboardLane } from "@/lib/app/dashboard-lane";

export default function Dashboard() {
  const { role, lang, permissions, viewer } = useAppContext();
  const { addToast } = useToast();
  const t = useT();
  const { status: bonsaiStatus, generate: bonsaiGenerate, initModel: bonsaiInit } = useBonsaiLLM();
  const primaryRoleCode = viewer?.primaryRoleCode ?? getCanonicalRoleFromUiRole(role);
  const dashboardLane = getDashboardLane(primaryRoleCode);
  
  // Real data from API with TanStack Query
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useDashboardEvents();
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
    try {
      await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'pending_prant_authorization' });
      addToast(t('Forwarded to Prant', 'प्रान्त को भेजा'), 'info');
    } catch {
      addToast(t('Failed to forward', 'भेजने में विफल'), 'error');
    }
  };

  const handlePublishFromVibhag = async (eventId: string, title: string, currentStatus: GatividhiEvent["status"]) => {
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
    const toStatus = currentStatus === "Submitted by Unit" ? 'pending_aayam_review' : 'pending_vibhag_review';
    try {
      await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus });
      addToast(t('Forwarded for vibhag review', 'विभाग समीक्षा के लिए भेजा'), 'info', t('Sent to Vibhag Pramukh', 'विभाग प्रमुख की समीक्षा के लिए भेजा'));
    } catch {
      addToast(t('Forward not allowed', 'आगे भेजने की अनुमति नहीं है'), 'error');
    }
  };

  const handleSubmitFromUnit = async (eventId: string) => {
    try {
      await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'submitted_by_unit' });
      addToast(t('Event submitted for review!', 'कार्यक्रम समीक्षा के लिए भेजा गया!'), 'success', t('Sent for Aayam review', 'आयाम समीक्षा के लिए भेजा गया'));
    } catch {
      addToast(t('Submit not allowed', 'भेजने की अनुमति नहीं है'), 'error');
    }
  };

  const saveVritt = async () => {
    if (!vrittEvent) return;
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
    />
  );

  if (dashboardLane === "super_admin" || dashboardLane === "prant") {
    return <PrajnaDashboard />;
  }

  if (dashboardLane === "vibhag") {
    return (
      <>
        <VibhagDashboardView
          events={events}
          permissions={permissions}
          t={t}
          eventStatusHi={eventStatusHi}
          statusBadge={dashboardStatusBadgeClass}
          onOpenVrittEditor={openVrittEditor}
          onOpenQr={setQrEvent}
          lastPublished={lastPublished}
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
        <AayamDashboardView
          dashboardKind={primaryRoleCode === "prant_aayam_pramukh" ? "prant_aayam_pramukh" : "aayam_pramukh"}
          events={events}
          permissions={permissions}
          t={t}
          eventStatusHi={eventStatusHi}
          statusBadge={dashboardStatusBadgeClass}
          onOpenVrittEditor={openVrittEditor}
          onOpenQr={setQrEvent}
          onForwardToVibhag={(eventId, currentStatus) => handleForwardToVibhag(eventId, currentStatus)}
        />
        {reviewOverlays}
      </>
    );
  }
  return (
    <>
      <UnitDashboardView
        dashboardKind={dashboardLane === "karyakarta" ? "karyakarta" : "unit_head"}
        events={events}
        isApiConnected={isApiConnected}
        statusBadge={dashboardStatusBadgeClass}
        statusLabel={statusLabel}
        vrittStatusLabel={vrittStatusLabel}
        onOpenVrittEditor={openVrittEditor}
        onOpenQr={setQrEvent}
        onSubmitForReview={handleSubmitFromUnit}
      />
      {reviewOverlays}
    </>
  );
}
