"use client";

import { useState } from "react";
import { useAppContext, GatividhiEvent, VrittStatus } from "@/context/AppContext";
import { useDashboardEvents, useUpdateEventStatus } from "@/hooks/api/use-dashboard";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { checklistItems, dashboardStatusBadgeClass, eventStatusHi } from "@/components/pages/dashboard/config";
import { VibhagDashboardView } from "@/components/pages/dashboard/VibhagDashboardView";
import { AayamDashboardView } from "@/components/pages/dashboard/AayamDashboardView";
import { UnitDashboardView } from "@/components/pages/dashboard/UnitDashboardView";
import { DashboardReviewOverlays } from "@/components/pages/dashboard/DashboardReviewOverlays";
import { uiToDbEventStatus } from "@/lib/app/status-maps";



export default function Dashboard() {
  const { role, lang, permissions, events: demoEvents, updateEventStatus, updateVritt } = useAppContext();
  const { addToast } = useToast();
  const t = useT();
  
  // Real data from API with TanStack Query
  const { data: apiEvents = [], isLoading: eventsLoading, error: eventsError } = useDashboardEvents();
  const updateEventStatusMutation = useUpdateEventStatus();
  
  // Use API data if available, fallback to demo data
  const events = apiEvents.length > 0 ? apiEvents : demoEvents;
  const isApiConnected = apiEvents.length > 0 || !eventsLoading;
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
          <p className="text-xs text-muted-foreground font-devanagari">
            {t('Showing demo data.', 'डेमो डेटा दिखाया जा रहा है।')}
          </p>
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

  const generateSmartDraft = () => {
    if (!vrittEvent) return;
    const isHi = lang === 'hi';
    const lines: string[] = [];

    // Header
    lines.push(isHi ? `।। वृत्त : ${vrittEvent.title} ।।` : `!! Vritt : ${vrittEvent.title} !!`);
    lines.push(isHi ? `दिनांक: ${vrittEvent.date} | इकाई: ${vrittEvent.unit}` : `Date: ${vrittEvent.date} | Unit: ${vrittEvent.unit}`);
    lines.push("");

    // Description/Goal
    if (vrittEvent.description) {
      lines.push(isHi ? `मुख्य उद्देश्य: ${vrittEvent.description}` : `Core Objective: ${vrittEvent.description}`);
      lines.push("");
    }

    // Vyavastha/Checklist items
    const checkedItems = Object.entries(vrittEvent.checklist)
      .filter(([_, checked]) => !!checked)
      .map(([key]) => checklistItems.find(i => i.key === key))
      .filter(Boolean);

    if (checkedItems.length > 0) {
      lines.push(isHi ? "समीक्षा (व्यवस्थाएं):" : "Operational Review (Arrangements):");
      checkedItems.forEach(item => {
        lines.push(`• ${t(item!.en, item!.hi)}: ${isHi ? '[सफल/सुधार अपेक्षित]' : '[Successful / Needs Improvement]'}`);
      });
      lines.push("");
    }

    // Statistics from registrations
    const regCount = vrittEvent.registrations?.length ?? 0;
    const totalPeople = vrittEvent.registrations?.reduce((s, r) => s + r.attendingCount, 0) ?? 0;
    const checkedIn = vrittEvent.vrittCheckedInCount ?? 0;

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

    // Final result
    lines.push(isHi ? "निष्कर्ष / आगामी योजना:" : "Conclusion / Next Steps:");
    lines.push(isHi ? "[कार्यक्रम का सारांश और आगामी कार्ययोजना यहाँ लिखें]" : "[Write event summary and future action points here]");

    setVrittForm(p => ({
      ...p,
      content: lines.join("\n"),
      attendanceCount: checkedIn || totalPeople || p.attendanceCount
    }));
    addToast(t('Smart Draft generated!', 'स्मार्ट ड्राफ्ट तैयार!'), 'info');
  };

  const statusLabel = (status: string) => lang === 'hi' ? (eventStatusHi[status] ?? status) : status;
  const handleForwardToPrant = async (eventId: string) => {
    if (isApiConnected) {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'pending_prant_authorization' });
        addToast(t('Forwarded to Prant', 'प्रांत को भेजा'), 'info');
      } catch {
        addToast(t('Failed to forward', 'भेजने में विफल'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, "Pending Prant Authorization");
    if (ok) addToast(t('Forwarded to Prant', 'प्रांत को भेजा'), 'info');
  };

  const handlePublishFromVibhag = async (eventId: string, title: string, currentStatus: GatividhiEvent["status"]) => {
    const dbStatus = uiToDbEventStatus[currentStatus] ?? currentStatus;
    const nextStatus = dbStatus === 'pending_prant_authorization'
      ? 'pending_prant_dual_authorization'
      : 'authorized_public';

    if (isApiConnected) {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: nextStatus });
        setLastPublished(title);
        addToast(t('Published to Feed!', 'फ़ीड में प्रकाशित!'), 'success', t('Update Prachar now', 'प्रचार अद्यतन करें'));
      } catch {
        addToast(t('Publish failed', 'प्रकाशन विफल'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, "Published");
    if (!ok) {
      addToast(t('Publish not allowed', 'प्रकाशन की अनुमति नहीं है'), 'error');
      return;
    }
    setLastPublished(title);
    addToast(t('Published to Feed!', 'फ़ीड में प्रकाशित!'), 'success', t('Update Prachar now', 'प्रचार अद्यतन करें'));
  };

  const handleForwardToVibhag = async (eventId: string) => {
    if (isApiConnected) {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'pending_vibhag_review' });
        addToast(t('Forwarded for vibhag review', 'विभाग समीक्षा के लिए भेजा'), 'info', t('Sent to Vibhag Pramukh', 'विभाग प्रमुख की समीक्षा के लिए भेजा'));
      } catch {
        addToast(t('Forward not allowed', 'आगे भेजने की अनुमति नहीं है'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, "Pending Vibhag Review");
    if (!ok) {
      addToast(t('Forward not allowed', 'आगे भेजने की अनुमति नहीं है'), 'error');
      return;
    }
    addToast(t('Forwarded for vibhag review', 'विभाग समीक्षा के लिए भेजा'), 'info', t('Sent to Vibhag Pramukh', 'विभाग प्रमुख की समीक्षा के लिए भेजा'));
  };
  const handleSubmitFromUnit = async (eventId: string) => {
    if (isApiConnected) {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'submitted_by_unit' });
        addToast(t('Event submitted for review!', 'कार्यक्रम समीक्षा के लिए भेजा गया!'), 'success', t('Sent for Aayam review', 'आयाम समीक्षा के लिए भेजा गया'));
      } catch {
        addToast(t('Submit not allowed', 'भेजने की अनुमति नहीं है'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, "Submitted by Unit");
    if (!ok) {
      addToast(t('Submit not allowed', 'भेजने की अनुमति नहीं है'), 'error');
      return;
    }
    addToast(t('Event submitted for review!', 'कार्यक्रम समीक्षा के लिए भेजा गया!'), 'success', t('Sent for Aayam review', 'आयाम समीक्षा के लिए भेजा गया'));
  };

  const saveVritt = async () => {
    if (!vrittEvent) return;
    const urls = vrittForm.mediaUrls.filter((url) => url.trim());
    const ok = await updateVritt(vrittEvent.id, {
      vrittContent: vrittForm.content || undefined,
      vrittAttendanceCount: vrittForm.attendanceCount || undefined,
      vrittMediaUrls: urls.length > 0 ? urls : undefined,
      vrittStatus: vrittForm.status,
    });
    if (!ok) {
      addToast(t("Failed to save vritt", "वृत्त सहेजने में विफल"), "error");
      return;
    }
    addToast(t("Vritt saved!", "वृत्त सहेजा गया!"), "success");
    setVrittEvent(null);
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

  if (role === "vibhag_pramukh") {
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

  if (role === "aayam_pramukh") {
    return (
      <>
        <AayamDashboardView
          events={events}
          permissions={permissions}
          t={t}
          eventStatusHi={eventStatusHi}
          statusBadge={dashboardStatusBadgeClass}
          onOpenVrittEditor={openVrittEditor}
          onOpenQr={setQrEvent}
          onForwardToVibhag={handleForwardToVibhag}
        />
        {reviewOverlays}
      </>
    );
  }
  return (
    <>
      <UnitDashboardView
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




