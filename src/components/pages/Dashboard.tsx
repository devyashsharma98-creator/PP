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
            {t('Loading dashboard data...', 'à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤¡à¥‡à¤Ÿà¤¾ à¤²à¥‹à¤¡ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆ...')}
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
            {t('Failed to load dashboard data.', 'à¤¡à¥ˆà¤¶à¤¬à¥‹à¤°à¥à¤¡ à¤¡à¥‡à¤Ÿà¤¾ à¤²à¥‹à¤¡ à¤•à¤°à¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²à¥¤')}
          </p>
          <p className="text-xs text-muted-foreground">{(eventsError as Error).message}</p>
          <p className="text-xs text-muted-foreground font-devanagari">
            {t('Showing demo data.', 'à¤¡à¥‡à¤®à¥‹ à¤¡à¥‡à¤Ÿà¤¾ à¤¦à¤¿à¤–à¤¾à¤¯à¤¾ à¤œà¤¾ à¤°à¤¹à¤¾ à¤¹à¥ˆà¥¤')}
          </p>
        </div>
      </div>
    );
  }

  const vrittStatusLabel = (s: VrittStatus) => {
    const map: Record<VrittStatus, string> = { draft: t('Draft', 'à¤ªà¥à¤°à¤¾à¤°à¥‚à¤ª'), submitted: t('Submitted', 'à¤ªà¥à¤°à¤¸à¥à¤¤à¥à¤¤'), reviewed: t('Reviewed', 'à¤¸à¤®à¥€à¤•à¥à¤·à¤¿à¤¤') };
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
    lines.push(isHi ? `à¥¤à¥¤ à¤µà¥ƒà¤¤à¥à¤¤ : ${vrittEvent.title} à¥¤à¥¤` : `!! Vritt : ${vrittEvent.title} !!`);
    lines.push(isHi ? `à¤¦à¤¿à¤¨à¤¾à¤‚à¤•: ${vrittEvent.date} | à¤‡à¤•à¤¾à¤ˆ: ${vrittEvent.unit}` : `Date: ${vrittEvent.date} | Unit: ${vrittEvent.unit}`);
    lines.push("");

    // Description/Goal
    if (vrittEvent.description) {
      lines.push(isHi ? `à¤®à¥à¤–à¥à¤¯ à¤‰à¤¦à¥à¤¦à¥‡à¤¶à¥à¤¯: ${vrittEvent.description}` : `Core Objective: ${vrittEvent.description}`);
      lines.push("");
    }

    // Vyavastha/Checklist items
    const checkedItems = Object.entries(vrittEvent.checklist)
      .filter(([_, checked]) => !!checked)
      .map(([key]) => checklistItems.find(i => i.key === key))
      .filter(Boolean);

    if (checkedItems.length > 0) {
      lines.push(isHi ? "à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ (à¤µà¥à¤¯à¤µà¤¸à¥à¤¥à¤¾à¤à¤‚):" : "Operational Review (Arrangements):");
      checkedItems.forEach(item => {
        lines.push(`â€¢ ${t(item!.en, item!.hi)}: ${isHi ? '[à¤¸à¤«à¤²/à¤¸à¥à¤§à¤¾à¤° à¤…à¤ªà¥‡à¤•à¥à¤·à¤¿à¤¤]' : '[Successful / Needs Improvement]'}`);
      });
      lines.push("");
    }

    // Statistics from registrations
    const regCount = vrittEvent.registrations?.length ?? 0;
    const totalPeople = vrittEvent.registrations?.reduce((s, r) => s + r.attendingCount, 0) ?? 0;
    const checkedIn = vrittEvent.vrittCheckedInCount ?? 0;

    if (regCount > 0 || checkedIn > 0) {
      lines.push(isHi ? "à¤‰à¤ªà¤¸à¥à¤¥à¤¿à¤¤à¤¿ à¤à¤µà¤‚ à¤¸à¤¹à¤­à¤¾à¤—à¤¿à¤¤à¤¾:" : "Attendance & Participation:");
      if (regCount > 0) {
        lines.push(isHi ? `â€¢ à¤•à¥à¤² à¤ªà¤‚à¤œà¥€à¤•à¤°à¤£: ${regCount}` : `â€¢ Total Registrations: ${regCount}`);
        lines.push(isHi ? `â€¢ à¤…à¤ªà¥‡à¤•à¥à¤·à¤¿à¤¤ à¤‰à¤ªà¤¸à¥à¤¥à¤¿à¤¤à¤¿: ${totalPeople}` : `â€¢ Expected Attendance: ${totalPeople}`);
      }
      if (checkedIn > 0) {
        lines.push(isHi ? `â€¢ à¤•à¥à¤¯à¥‚à¤†à¤° à¤šà¥‡à¤•-à¤‡à¤¨ (Venue QR): ${checkedIn}` : `â€¢ Venue QR Check-ins: ${checkedIn}`);
      }
      lines.push("");
    }

    // Final result
    lines.push(isHi ? "à¤¨à¤¿à¤·à¥à¤•à¤°à¥à¤· / à¤†à¤—à¤¾à¤®à¥€ à¤¯à¥‹à¤œà¤¨à¤¾:" : "Conclusion / Next Steps:");
    lines.push(isHi ? "[à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤® à¤•à¤¾ à¤¸à¤¾à¤°à¤¾à¤‚à¤¶ à¤”à¤° à¤†à¤—à¤¾à¤®à¥€ à¤•à¤¾à¤°à¥à¤¯à¤¯à¥‹à¤œà¤¨à¤¾ à¤¯à¤¹à¤¾à¤ à¤²à¤¿à¤–à¥‡à¤‚]" : "[Write event summary and future action points here]");

    setVrittForm(p => ({
      ...p,
      content: lines.join("\n"),
      attendanceCount: checkedIn || totalPeople || p.attendanceCount
    }));
    addToast(t('Smart Draft generated!', 'à¤¸à¥à¤®à¤¾à¤°à¥à¤Ÿ à¤¡à¥à¤°à¤¾à¤«à¥à¤Ÿ à¤¤à¥ˆà¤¯à¤¾à¤°!'), 'info');
  };

  const statusLabel = (status: string) => lang === 'hi' ? (eventStatusHi[status] ?? status) : status;
  const handleForwardToPrant = async (eventId: string) => {
    if (isApiConnected) {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'pending_prant_authorization' });
        addToast(t('Forwarded to Prant', 'à¤ªà¥à¤°à¤¾à¤‚à¤¤ à¤•à¥‹ à¤­à¥‡à¤œà¤¾'), 'info');
      } catch {
        addToast(t('Failed to forward', 'à¤­à¥‡à¤œà¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, "Pending Prant Authorization");
    if (ok) addToast(t('Forwarded to Prant', 'à¤ªà¥à¤°à¤¾à¤‚à¤¤ à¤•à¥‹ à¤­à¥‡à¤œà¤¾'), 'info');
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
        addToast(t('Published to Feed!', 'à¤«à¤¼à¥€à¤¡ à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤!'), 'success', t('Update Prachar now', 'à¤ªà¥à¤°à¤šà¤¾à¤° à¤…à¤¦à¥à¤¯à¤¤à¤¨ à¤•à¤°à¥‡à¤‚'));
      } catch {
        addToast(t('Publish failed', 'à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¨ à¤µà¤¿à¤«à¤²'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, "Published");
    if (!ok) {
      addToast(t('Publish not allowed', 'à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¨ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ'), 'error');
      return;
    }
    setLastPublished(title);
    addToast(t('Published to Feed!', 'à¤«à¤¼à¥€à¤¡ à¤®à¥‡à¤‚ à¤ªà¥à¤°à¤•à¤¾à¤¶à¤¿à¤¤!'), 'success', t('Update Prachar now', 'à¤ªà¥à¤°à¤šà¤¾à¤° à¤…à¤¦à¥à¤¯à¤¤à¤¨ à¤•à¤°à¥‡à¤‚'));
  };

  const handleForwardToVibhag = async (eventId: string, currentStatus: GatividhiEvent["status"]) => {
    const toStatus = currentStatus === "Submitted by Unit" ? 'pending_aayam_review' : 'pending_vibhag_review';
    if (isApiConnected) {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus });
        addToast(t('Forwarded for vibhag review', 'à¤µà¤¿à¤­à¤¾à¤— à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾'), 'info', t('Sent to Vibhag Pramukh', 'à¤µà¤¿à¤­à¤¾à¤— à¤ªà¥à¤°à¤®à¥à¤– à¤•à¥€ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾'));
      } catch {
        addToast(t('Forward not allowed', 'à¤†à¤—à¥‡ à¤­à¥‡à¤œà¤¨à¥‡ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, currentStatus === "Submitted by Unit" ? "Pending Aayam Review" : "Pending Vibhag Review");
    if (!ok) {
      addToast(t('Forward not allowed', 'à¤†à¤—à¥‡ à¤­à¥‡à¤œà¤¨à¥‡ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ'), 'error');
      return;
    }
    addToast(t('Forwarded for vibhag review', 'à¤µà¤¿à¤­à¤¾à¤— à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾'), 'info', t('Sent to Vibhag Pramukh', 'à¤µà¤¿à¤­à¤¾à¤— à¤ªà¥à¤°à¤®à¥à¤– à¤•à¥€ à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾'));
  };
  const handleSubmitFromUnit = async (eventId: string) => {
    if (isApiConnected) {
      try {
        await updateEventStatusMutation.mutateAsync({ id: eventId, toStatus: 'submitted_by_unit' });
        addToast(t('Event submitted for review!', 'à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤® à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾ à¤—à¤¯à¤¾!'), 'success', t('Sent for Aayam review', 'à¤†à¤¯à¤¾à¤® à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾ à¤—à¤¯à¤¾'));
      } catch {
        addToast(t('Submit not allowed', 'à¤­à¥‡à¤œà¤¨à¥‡ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ'), 'error');
      }
      return;
    }

    const ok = await updateEventStatus(eventId, "Submitted by Unit");
    if (!ok) {
      addToast(t('Submit not allowed', 'à¤­à¥‡à¤œà¤¨à¥‡ à¤•à¥€ à¤…à¤¨à¥à¤®à¤¤à¤¿ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ'), 'error');
      return;
    }
    addToast(t('Event submitted for review!', 'à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤® à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾ à¤—à¤¯à¤¾!'), 'success', t('Sent for Aayam review', 'à¤†à¤¯à¤¾à¤® à¤¸à¤®à¥€à¤•à¥à¤·à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤­à¥‡à¤œà¤¾ à¤—à¤¯à¤¾'));
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
      addToast(t("Failed to save vritt", "à¤µà¥ƒà¤¤à¥à¤¤ à¤¸à¤¹à¥‡à¤œà¤¨à¥‡ à¤®à¥‡à¤‚ à¤µà¤¿à¤«à¤²"), "error");
      return;
    }
    addToast(t("Vritt saved!", "à¤µà¥ƒà¤¤à¥à¤¤ à¤¸à¤¹à¥‡à¤œà¤¾ à¤—à¤¯à¤¾!"), "success");
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
          onForwardToVibhag={(eventId, currentStatus) => handleForwardToVibhag(eventId, currentStatus)}
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





