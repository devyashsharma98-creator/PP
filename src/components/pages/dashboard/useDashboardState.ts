"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, GatividhiEvent, FormConfig, VrittStatus } from "@/context/AppContext";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import { parseISO, isValid, format } from "date-fns";
import { EXPERT_POOL, checklistItems } from "./constants";

export function useDashboardState() {
  const { role, lang, permissions, events, addEvent, updateEventStatus, updateVritt, updateFormConfig, addPoll, castVote, finalizePoll } = useAppContext();
  const router = useRouter();
  const { addToast } = useToast();
  const t = useT();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTab, setFormTab] = useState("pre");
  const [dateValue, setDateValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [responseEvent, setResponseEvent] = useState<GatividhiEvent | null>(null);
  const [pollResultsEvent, setPollResultsEvent] = useState<GatividhiEvent | null>(null);
  const [pollCreateEvent, setPollCreateEvent] = useState<GatividhiEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [localFormConfig, setLocalFormConfig] = useState<FormConfig>({
    fields: { phone: true, city: true, attendingCount: true, specialNeeds: true },
    customQuestions: [],
  });
  const [newCustomQ, setNewCustomQ] = useState('');
  const [newCustomQHi, setNewCustomQHi] = useState('');
  const [newCustomQType, setNewCustomQType] = useState<'text' | 'yesno'>('yesno');
  const [showAddQ, setShowAddQ] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState('');
  const [newPollQuestionHi, setNewPollQuestionHi] = useState('');
  const [newPollType, setNewPollType] = useState<'date' | 'general'>('date');
  const [newPollOptions, setNewPollOptions] = useState(['', '', '']);
  const [form, setForm] = useState({
    title: "", description: "", unit: "",
    checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
    report: "", fileName: "", videoUrl: "", posterName: "",
  });
  const [lastPublished, setLastPublished] = useState<string | null>(null);
  const [vrittEvent, setVrittEvent] = useState<GatividhiEvent | null>(null);
  const [vrittForm, setVrittForm] = useState({ content: '', attendanceCount: 0, mediaUrls: [''], status: 'draft' as VrittStatus });
  const [qrEvent, setQrEvent] = useState<GatividhiEvent | null>(null);
  const [suggestedExperts, setSuggestedExperts] = useState<{ name: string; nameHi: string; vakshe: string[] }[]>([]);

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
    const totalPeople = vrittEvent.registrations?.reduce((s: number, r: { attendingCount: number }) => s + r.attendingCount, 0) ?? 0;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDate = parseISO(dateValue);
    if (!form.title || !isValid(selectedDate)) return;

    const ok = await addEvent({
      title: form.title,
      description: form.description,
      date: format(selectedDate, "dd MMM yyyy"),
      dateIso: selectedDate.toISOString(),
      unit: form.unit || "Bhopal",
      submittedBy: "Current User",
      checklist: form.checklist,
      report: form.report,
      imageUrl: "",
      formConfig: localFormConfig,
    });
    if (!ok) {
      addToast(t('Not authorized to submit event', 'कार्यक्रम भेजने की अनुमति नहीं है'), 'error');
      return;
    }
    setForm({
      title: "", description: "", unit: "",
      checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
      report: "", fileName: "", videoUrl: "", posterName: "",
    });
    setDateValue("");
    setFormTab("pre");
    setDialogOpen(false);
    setSubmitted(true);
    addToast(t('Event submitted for review!', 'कार्यक्रम समीक्षा के लिए भेजा गया!'), 'success', t('Sent for Aayam review', 'आयाम समीक्षा के लिए भेजा गया'));
    router.push("/dashboard");
  };

  const addSuggestion = (s: { question: string; questionHi: string; type: 'text' | 'yesno' }) => {
    if (localFormConfig.customQuestions.length >= 5) return;
    if (localFormConfig.customQuestions.some((q: { question: string }) => q.question === s.question)) return;
    setLocalFormConfig(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, { id: `cq${Date.now()}`, ...s }],
    }));
  };

  const addCustomQuestion = () => {
    if (!newCustomQ.trim() || localFormConfig.customQuestions.length >= 5) return;
    setLocalFormConfig(prev => ({
      ...prev,
      customQuestions: [...prev.customQuestions, {
        id: `cq${Date.now()}`, question: newCustomQ.trim(),
        questionHi: newCustomQHi.trim() || newCustomQ.trim(), type: newCustomQType,
      }],
    }));
    setNewCustomQ(''); setNewCustomQHi(''); setShowAddQ(false);
  };

  const removeCustomQuestion = (id: string) => {
    setLocalFormConfig(prev => ({ ...prev, customQuestions: prev.customQuestions.filter((q: { id: string }) => q.id !== id) }));
  };

  const handleCreatePoll = async () => {
    if (!pollCreateEvent || !newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter(o => o.trim());
    if (validOptions.length < 2) return;
    const ok = await addPoll(pollCreateEvent.id, {
      question: newPollQuestion.trim(),
      questionHi: newPollQuestionHi.trim() || newPollQuestion.trim(),
      type: newPollType,
      options: validOptions.map((label, i) => {
        const trimmed = label.trim();
        const parsedMs = newPollType === 'date' ? Date.parse(trimmed) : Number.NaN;
        return {
          id: `o${i}${Date.now()}`,
          label: trimmed,
          votes: 0,
          scheduledAtIso: Number.isNaN(parsedMs) ? null : new Date(parsedMs).toISOString(),
        };
      }),
    });
    if (!ok) {
      addToast(t('Not authorized to create poll', 'मतदान बनाने की अनुमति नहीं है'), 'error');
      return;
    }
    setPollCreateEvent(null);
    setNewPollQuestion(''); setNewPollQuestionHi(''); setNewPollOptions(['', '', '']);
    addToast(t('Poll created!', 'मतदान बनाया गया!'), 'success', t('Share the vote link with members', 'सदस्यों को वोट लिंक भेजें'));
  };

  const copyFormLink = (eventId: string) => {
    const url = `${window.location.origin}/form/${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const applyTemplate = (type: string) => {
    const template = {
      seminar: { checklist: ["designing", "seating", "soundMic", "screen", "camera", "food"] as string[] },
      protest: { checklist: ["designing", "soundMic", "camera", "transport"] as string[] },
      study_circle: { checklist: ["seating", "food"] as string[] },
      workshop: { checklist: ["designing", "seating", "soundMic", "screen", "camera", "food", "accommodation"] as string[] },
      outreach: { checklist: ["designing", "transport", "camera"] as string[] },
    }[type];
    if (!template) return;

    const newChecklist = { ...form.checklist };
    (Object.keys(newChecklist) as (keyof typeof form.checklist)[]).forEach(k => {
      newChecklist[k] = false;
    });
    (template.checklist as (keyof typeof form.checklist)[]).forEach(k => {
      newChecklist[k] = true;
    });

    const suggestions = EXPERT_POOL.filter(e => e.keywords.includes(type));
    setSuggestedExperts(suggestions);

    setForm(p => ({ ...p, checklist: newChecklist }));
  };

  const toggleChecklist = (key: keyof typeof form.checklist) => {
    setForm(prev => ({
      ...prev,
      checklist: { ...prev.checklist, [key]: !prev.checklist[key] },
    }));
  };

  return {
    // App context
    role, lang, permissions, events, addEvent, updateEventStatus, updateVritt, updateFormConfig, addPoll, castVote, finalizePoll,
    router,
    addToast,
    t,
    // Dialog state
    dialogOpen, setDialogOpen,
    formTab, setFormTab,
    dateValue, setDateValue,
    submitted, setSubmitted,
    // Event dialog state
    responseEvent, setResponseEvent,
    pollResultsEvent, setPollResultsEvent,
    pollCreateEvent, setPollCreateEvent,
    copiedId, setCopiedId,
    // Form state
    localFormConfig, setLocalFormConfig,
    newCustomQ, setNewCustomQ,
    newCustomQHi, setNewCustomQHi,
    newCustomQType, setNewCustomQType,
    showAddQ, setShowAddQ,
    form, setForm,
    suggestedExperts,
    // Poll state
    newPollQuestion, setNewPollQuestion,
    newPollQuestionHi, setNewPollQuestionHi,
    newPollType, setNewPollType,
    newPollOptions, setNewPollOptions,
    // Vritt state
    vrittEvent, setVrittEvent,
    vrittForm, setVrittForm,
    // QR state
    qrEvent, setQrEvent,
    lastPublished, setLastPublished,
    // Functions
    vrittStatusLabel,
    openVrittEditor,
    generateSmartDraft,
    handleSubmit,
    addSuggestion,
    addCustomQuestion,
    removeCustomQuestion,
    handleCreatePoll,
    copyFormLink,
    applyTemplate,
    toggleChecklist,
  };
}
