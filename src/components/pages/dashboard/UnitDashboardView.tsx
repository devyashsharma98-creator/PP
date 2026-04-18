"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, isValid, parseISO } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Building2, CalendarDays, CheckCircle2, ClipboardCheck, Lightbulb, Link2, MapPin, Phone, Plus, QrCode, RotateCcw, SlidersHorizontal, Trash2, User, Users, Vote, X, FileText } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useCreateDashboardEvent } from "@/hooks/api/use-dashboard";
import { Masthead } from "@/components/Masthead";
import { useToast } from "@/components/ToastProvider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { displayBilingualHi, useT } from "@/lib/useT";
import type { FormConfig, GatividhiEvent } from "@/lib/app/contracts";

import { checklistItems, eventTemplates, expertPool, suggestedQuestions, type SuggestedExpert } from "./config";
import type { UnitDashboardViewProps } from "./types";

export function UnitDashboardView({
  dashboardKind = "unit_head",
  events,
  isApiConnected,
  statusBadge,
  statusLabel,
  vrittStatusLabel,
  onOpenVrittEditor,
  onOpenQr,
  onSubmitForReview,
}: UnitDashboardViewProps) {
  const { permissions, lang, addEvent, addPoll, finalizePoll } = useAppContext();
  const router = useRouter();
  const { addToast } = useToast();
  const t = useT();
  const createEventMutation = useCreateDashboardEvent();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTab, setFormTab] = useState("pre");
  const [dateValue, setDateValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [responseEvent, setResponseEvent] = useState<GatividhiEvent | null>(null);
  const [pollResultsEvent, setPollResultsEvent] = useState<GatividhiEvent | null>(null);
  const [pollCreateEvent, setPollCreateEvent] = useState<GatividhiEvent | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestedExperts, setSuggestedExperts] = useState<SuggestedExpert[]>([]);
  const [localFormConfig, setLocalFormConfig] = useState<FormConfig>({
    fields: { phone: true, city: true, attendingCount: true, specialNeeds: true },
    customQuestions: [],
  });
  const [newCustomQ, setNewCustomQ] = useState("");
  const [newCustomQHi, setNewCustomQHi] = useState("");
  const [newCustomQType, setNewCustomQType] = useState<"text" | "yesno">("yesno");
  const [showAddQ, setShowAddQ] = useState(false);
  const [newPollQuestion, setNewPollQuestion] = useState("");
  const [newPollQuestionHi, setNewPollQuestionHi] = useState("");
  const [newPollType, setNewPollType] = useState<"date" | "general">("date");
  const [newPollOptions, setNewPollOptions] = useState(["", "", ""]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    unit: "",
    checklist: {
      designing: false,
      food: false,
      seating: false,
      transport: false,
      accommodation: false,
      soundMic: false,
      camera: false,
      screen: false,
      lights: false,
    },
    report: "",
    fileName: "",
    videoUrl: "",
    posterName: "",
  });

  const myEvents = isApiConnected
    ? events
    : events.filter(
        (event) =>
          event.submittedBy === "Current User" ||
          event.submittedBy === "Unit Head" ||
          event.submittedBy === "Ramesh Sharma" ||
          event.submittedBy === "Priya Patel" ||
          event.submittedBy === "Anil Verma" ||
          event.submittedBy === "Kavita Singh" ||
          event.submittedBy === "Suresh Yadav",
      );

  const activeWorkflowCount = myEvents.filter((event) => event.status !== "Published").length;
  const publishedUnitEvents = myEvents.filter((event) => event.status === "Published").length;
  const isKaryakartaLane = dashboardKind === "karyakarta" || !permissions.canCreateEvent;

  const applyTemplate = (type: string) => {
    const template = eventTemplates[type];
    if (!template) return;

    const nextChecklist = { ...form.checklist };
    (Object.keys(nextChecklist) as (keyof typeof form.checklist)[]).forEach((key) => {
      nextChecklist[key] = false;
    });
    template.checklist.forEach((key) => {
      nextChecklist[key] = true;
    });

    setSuggestedExperts(expertPool.filter((expert) => expert.keywords.includes(type)));
    setForm((previous) => ({ ...previous, checklist: nextChecklist }));
  };

  const toggleChecklist = (key: keyof typeof form.checklist) => {
    setForm((previous) => ({
      ...previous,
      checklist: { ...previous.checklist, [key]: !previous.checklist[key] },
    }));
  };

  const addSuggestion = (suggestion: (typeof suggestedQuestions)[number]) => {
    if (localFormConfig.customQuestions.length >= 5) return;
    if (localFormConfig.customQuestions.some((question) => question.question === suggestion.question)) return;
    setLocalFormConfig((previous) => ({
      ...previous,
      customQuestions: [...previous.customQuestions, { id: `cq${Date.now()}`, ...suggestion }],
    }));
  };

  const addCustomQuestion = () => {
    if (!newCustomQ.trim() || localFormConfig.customQuestions.length >= 5) return;
    setLocalFormConfig((previous) => ({
      ...previous,
      customQuestions: [
        ...previous.customQuestions,
        {
          id: `cq${Date.now()}`,
          question: newCustomQ.trim(),
          questionHi: newCustomQHi.trim() || newCustomQ.trim(),
          type: newCustomQType,
        },
      ],
    }));
    setNewCustomQ("");
    setNewCustomQHi("");
    setShowAddQ(false);
  };

  const removeCustomQuestion = (id: string) => {
    setLocalFormConfig((previous) => ({
      ...previous,
      customQuestions: previous.customQuestions.filter((question) => question.id !== id),
    }));
  };

  const copyFormLink = (eventId: string) => {
    const url = `${window.location.origin}/form/${eventId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(eventId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const selectedDate = parseISO(dateValue);
    if (!form.title || !isValid(selectedDate)) return;

    if (isApiConnected) {
      try {
        await createEventMutation.mutateAsync({
          title: form.title,
          description: form.description,
          startsAt: selectedDate.toISOString(),
        });
        setForm({
          title: "",
          description: "",
          unit: "",
          checklist: {
            designing: false,
            food: false,
            seating: false,
            transport: false,
            accommodation: false,
            soundMic: false,
            camera: false,
            screen: false,
            lights: false,
          },
          report: "",
          fileName: "",
          videoUrl: "",
          posterName: "",
        });
        setDateValue("");
        setFormTab("pre");
        setDialogOpen(false);
        setSubmitted(true);
        addToast(t("Event submitted for review!", "कार्यक्रम समीक्षा के लिए भेजा गया!"), "success", t("Sent for Aayam review", "आयाम समीक्षा के लिए भेजा गया"));
        router.push("/dashboard");
        return;
      } catch {
        addToast(t("Failed to submit event", "कार्यक्रम भेजने में विफल"), "error");
        return;
      }
    }

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
      addToast(t("Not authorized to submit event", "कार्यक्रम भेजने की अनुमति नहीं है"), "error");
      return;
    }
    setForm({
      title: "",
      description: "",
      unit: "",
      checklist: {
        designing: false,
        food: false,
        seating: false,
        transport: false,
        accommodation: false,
        soundMic: false,
        camera: false,
        screen: false,
        lights: false,
      },
      report: "",
      fileName: "",
      videoUrl: "",
      posterName: "",
    });
    setDateValue("");
    setFormTab("pre");
    setDialogOpen(false);
    setSubmitted(true);
    addToast(t("Event submitted for review!", "कार्यक्रम समीक्षा के लिए भेजा गया!"), "success", t("Sent for Aayam review", "आयाम समीक्षा के लिए भेजा गया"));
    router.push("/dashboard");
  };

  const handleCreatePoll = async () => {
    if (!pollCreateEvent || !newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter((option) => option.trim());
    if (validOptions.length < 2) return;

    const ok = await addPoll(pollCreateEvent.id, {
      question: newPollQuestion.trim(),
      questionHi: newPollQuestionHi.trim() || newPollQuestion.trim(),
      type: newPollType,
      options: validOptions.map((label, index) => {
        const trimmed = label.trim();
        const parsedMs = newPollType === "date" ? Date.parse(trimmed) : Number.NaN;
        return {
          id: `o${index}${Date.now()}`,
          label: trimmed,
          votes: 0,
          scheduledAtIso: Number.isNaN(parsedMs) ? null : new Date(parsedMs).toISOString(),
        };
      }),
    });

    if (!ok) {
      addToast(t("Not authorized to create poll", "मतदान बनाने की अनुमति नहीं है"), "error");
      return;
    }

    setPollCreateEvent(null);
    setNewPollQuestion("");
    setNewPollQuestionHi("");
    setNewPollOptions(["", "", ""]);
    addToast(t("Poll created!", "मतदान बनाया गया!"), "success", t("Share the vote link with members", "सदस्यों को वोट लिंक भेजें"));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Masthead
        seal={isKaryakartaLane ? "Karyakarta Work Desk" : "Unit Activity Desk"}
        sealHi={isKaryakartaLane ? "कार्यकर्ता कार्य डेस्क" : "इकाई गतिविधि डेस्क"}
        title={isKaryakartaLane ? "Karyakarta Dashboard" : "Gatividhi Dashboard"}
        titleHi={isKaryakartaLane ? "कार्यकर्ता डैशबोर्ड" : "गतिविधि डैशबोर्ड"}
        subtitle={isKaryakartaLane ? "See assigned work, pending contributions, and current activity in one place." : "Programme planning, review movement, and post-event follow-through for your unit in one place."}
        subtitleHi={
          isKaryakartaLane
            ? "सौंपा गया कार्य, लंबित योगदान और वर्तमान गतिविधि — एक ही स्थान पर।"
            : "इकाई हेतु कार्यक्रम योजना, समीक्षा की गति और कार्यक्रम के बाद की पूर्ति — एक ही दृश्य में।"
        }
        contexts={[
          {
            labelEn: "Operational scope",
            labelHi: "परिचालन क्षेत्र",
            valueEn: permissions.canCreateEvent ? "Unit planning and submission" : "Karyakarta participation lane",
            valueHi: permissions.canCreateEvent ? "इकाई योजना और प्रस्तुति" : "कार्यकर्ता सहभागिता धारा",
            detailEn: permissions.canCreateEvent
              ? "Prepare programmes, complete vyavastha, and move work into review."
              : "Track assigned programmes, contribute inputs, and stay aligned with the review lane.",
            detailHi: permissions.canCreateEvent
              ? "कार्यक्रम तैयार करें, व्यवस्था पूर्ण करें और कार्य को समीक्षा में भेजें।"
              : "निर्धारित कार्यक्रम देखें, योगदान दें और समीक्षा धारा के साथ जुड़े रहें।",
          },
          {
            labelEn: "Active workflow",
            labelHi: "सक्रिय प्रवाह",
            valueEn: `${activeWorkflowCount} records in motion`,
            valueHi: `${activeWorkflowCount} प्रविष्टियाँ गतिशील`,
            detailEn: "Drafts, reviews, and pending follow-through remain visible together.",
            detailHi: "प्रारूप, समीक्षा और लंबित अनुवर्ती एक साथ दिखाई देते हैं।",
          },
          {
            labelEn: "Published record",
            labelHi: "प्रकाशित अभिलेख",
            valueEn: `${publishedUnitEvents} published events`,
            valueHi: `${publishedUnitEvents} प्रकाशित कार्यक्रम`,
            detailEn: "Keep published work, forms, polls, and vritt updates close to the planning lane.",
            detailHi: "प्रकाशित कार्य, फ़ॉर्म, मतदान और वृत्त अद्यतन को योजना धारा से जुड़ा रखें।",
          },
        ]}
      />

      <div className="flex justify-end">
        {permissions.canCreateEvent && (
          <>
            <Button type="button" onClick={() => setDialogOpen(true)} className="shadow-sm transition-shadow hover:shadow-md">
              <Plus className="mr-2 h-4 w-4" aria-hidden /> {t("Create New Event", "नया कार्यक्रम बनाएं")}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="bg-popover sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-devanagari">{t("New Gatividhi", "नई गतिविधि")}</DialogTitle>
                <DialogDescription>
                  {t("Create a programme record and send it into the review workflow.", "कार्यक्रम रिकॉर्ड बनाकर समीक्षा प्रवाह में भेजें।")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="col-span-2">
                    <Label>{t("Event Type (Template)", "कार्यक्रम का प्रकार")}</Label>
                    <Select onValueChange={applyTemplate}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("Select a template to auto-fill checklist", "चेकलिस्ट भरने के लिए टेम्पलेट चुनें")} />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        {Object.entries(eventTemplates).map(([key, template]) => (
                          <SelectItem key={key} value={key}>
                            {t(template.labelEn, template.labelHi)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>{t("Event Title", "कार्यक्रम का नाम")}</Label>
                    <Input value={form.title} onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))} placeholder={t("Enter event name", "कार्यक्रम का नाम दर्ज करें")} required />
                  </div>
                  <div>
                    <Label>{t("Date", "दिनांक")}</Label>
                    <Input type="date" value={dateValue} onChange={(event) => setDateValue(event.target.value)} required className="w-full" />
                  </div>
                  <div>
                    <Label>{t("Unit", "इकाई")}</Label>
                    <Input value={form.unit} onChange={(event) => setForm((previous) => ({ ...previous, unit: event.target.value }))} placeholder={t("e.g. Bhopal", "जैसे भोपाल")} />
                  </div>
                  <div className="col-span-2">
                    <Label>{t("Description", "विवरण")}</Label>
                    <Textarea value={form.description} onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))} rows={2} />
                  </div>
                </div>

                <Tabs value={formTab} onValueChange={setFormTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="pre" className="flex-1 text-xs font-devanagari">
                      {t("Vyavastha", "व्यवस्थाएँ")}
                    </TabsTrigger>
                    <TabsTrigger value="post" className="flex-1 text-xs font-devanagari">
                      {t("Vritt", "वृत्त")}
                    </TabsTrigger>
                    <TabsTrigger value="form" className="flex-1 text-xs font-devanagari">
                      <SlidersHorizontal className="mr-1 h-3 w-3" />
                      {t("Form", "फ़ॉर्म")}
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pre" className="space-y-3 pt-2">
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[10px] text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          setForm((previous) => ({
                            ...previous,
                            checklist: Object.keys(previous.checklist).reduce(
                              (accumulator, key) => ({ ...accumulator, [key]: false }),
                              {} as typeof previous.checklist,
                            ),
                          }))
                        }
                      >
                        <RotateCcw className="mr-1 h-3 w-3" /> {t("Clear Selection", "सब हटाएँ")}
                      </Button>
                    </div>
                    {checklistItems.map((item) => (
                      <div key={item.key} className="flex items-center gap-3">
                        <Checkbox checked={form.checklist[item.key]} onCheckedChange={() => toggleChecklist(item.key)} id={item.key} />
                        <Label htmlFor={item.key} className="cursor-pointer text-sm font-devanagari">
                          {t(item.en, item.hi)}
                        </Label>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="post" className="space-y-3 pt-2">
                    <div>
                      <Label className="font-devanagari">{t("Vritt (Detailed Report)", "वृत्त (विस्तृत विवरण)")}</Label>
                      <Textarea value={form.report} onChange={(event) => setForm((previous) => ({ ...previous, report: event.target.value }))} rows={3} placeholder={t("Write the detailed post-event report...", "कार्यक्रम के बाद का विस्तृत विवरण लिखें...")} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("Upload Photos", "फ़ोटो अपलोड करें")}</Label>
                        <div className="mt-1 cursor-pointer rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50" onClick={() => setForm((previous) => ({ ...previous, fileName: "photos_event.zip" }))}>
                          {form.fileName ? <p className="text-xs font-medium text-foreground">📷 {form.fileName}</p> : <p className="text-xs">📷 {t("Photos (simulated)", "फ़ोटो (अनुकरण)")}</p>}
                        </div>
                      </div>
                      <div>
                        <Label>{t("Upload Video", "वीडियो अपलोड करें")}</Label>
                        <div className="mt-1 cursor-pointer rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50" onClick={() => setForm((previous) => ({ ...previous, videoUrl: "event_video.mp4" }))}>
                          {form.videoUrl ? <p className="text-xs font-medium text-foreground">🎥 {form.videoUrl}</p> : <p className="text-xs">🎥 {t("Video (simulated)", "वीडियो (अनुकरण)")}</p>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label>{t("Upload Poster", "पोस्टर अपलोड करें")}</Label>
                      <div className="mt-1 cursor-pointer rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50" onClick={() => setForm((previous) => ({ ...previous, posterName: "event_poster.jpg" }))}>
                        {form.posterName ? <p className="text-xs font-medium text-foreground">🖼️ {form.posterName}</p> : <p className="text-xs">🖼️ {t("Upload Poster (simulated)", "पोस्टर अपलोड करें (अनुकरण)")}</p>}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="form" className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Default Fields", "डिफ़ॉल्ट फ़ील्ड")}</p>
                      {([
                        { key: "phone" as const, en: "Mobile Number", hi: "मोबाइल नंबर" },
                        { key: "city" as const, en: "City", hi: "शहर" },
                        { key: "attendingCount" as const, en: "Attendee Count", hi: "उपस्थित संख्या" },
                        { key: "specialNeeds" as const, en: "Special Needs", hi: "विशेष जरूरत" },
                      ] as { key: keyof FormConfig["fields"]; en: string; hi: string }[]).map((field) => (
                        <div key={field.key} className="flex items-center justify-between border-b border-border/30 py-1.5 last:border-0">
                          <Label className="cursor-pointer text-sm font-devanagari">{t(field.en, field.hi)}</Label>
                          <Switch checked={localFormConfig.fields[field.key]} onCheckedChange={(value) => setLocalFormConfig((previous) => ({ ...previous, fields: { ...previous.fields, [field.key]: value } }))} />
                        </div>
                      ))}
                    </div>

                    {localFormConfig.customQuestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("Custom Questions", "कस्टम प्रश्न")}</p>
                        {localFormConfig.customQuestions.map((question) => (
                          <div key={question.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/40 bg-muted/50 p-2">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium">{question.question}</p>
                              <p className="text-[10px] text-muted-foreground">{question.type === "yesno" ? "Yes/No" : "Text"}</p>
                            </div>
                            <button onClick={() => removeCustomQuestion(question.id)} className="shrink-0 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {localFormConfig.customQuestions.length < 5 &&
                      (showAddQ ? (
                        <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                          <Input value={newCustomQ} onChange={(event) => setNewCustomQ(event.target.value)} placeholder={t("Question (English)", "प्रश्न (अंग्रेज़ी)")} className="h-8 text-sm" />
                          <Input value={newCustomQHi} onChange={(event) => setNewCustomQHi(event.target.value)} placeholder={t("Question (Hindi, optional)", "प्रश्न (हिन्दी, वैकल्पिक)")} className="h-8 text-sm font-devanagari" />
                          <div className="flex gap-2">
                            <Select value={newCustomQType} onValueChange={(value: "text" | "yesno") => setNewCustomQType(value)}>
                              <SelectTrigger className="h-8 flex-1 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="yesno">Yes / No</SelectItem>
                                <SelectItem value="text">Text Answer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button size="sm" onClick={addCustomQuestion} className="h-8 text-xs">
                              {t("Add", "जोड़ें")}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowAddQ(false)} className="h-8 text-xs">
                              {t("Cancel", "रद्द")}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowAddQ(true)}>
                          <Plus className="mr-1 h-3 w-3" /> {t("Add Custom Question", "कस्टम प्रश्न जोड़ें")}
                        </Button>
                      ))}

                    <div className="space-y-2">
                      <p className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <Lightbulb className="h-3 w-3 text-warning" />
                        {t("Suggestions", "सुझाव")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedQuestions.map((suggestion) => {
                          const alreadyAdded = localFormConfig.customQuestions.some((question) => question.question === suggestion.question);
                          return (
                            <button
                              key={suggestion.question}
                              type="button"
                              disabled={alreadyAdded || localFormConfig.customQuestions.length >= 5}
                              onClick={() => addSuggestion(suggestion)}
                              className={`rounded-full border px-2 py-1 text-[11px] font-devanagari transition-colors ${
                                alreadyAdded
                                  ? "cursor-default border-primary/30 bg-primary/10 text-primary"
                                  : "cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5"
                              } disabled:opacity-40`}
                            >
                              {alreadyAdded ? "✓ " : "+ "}
                              {t(suggestion.question, suggestion.questionHi)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                {suggestedExperts.length > 0 && (
                  <div className="space-y-3 border-t border-border/40 pt-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("Suggested Institutional Experts", "अनुशंसित संस्थागत विशेषज्ञ")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {suggestedExperts.map((expert, index) => (
                        <div key={index} className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 p-2">
                          <div className="saffron-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                            <span className="text-[10px] font-bold text-white">{expert.name.charAt(0)}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold">{displayBilingualHi(expert.name, expert.nameHi, lang)}</p>
                            <div className="flex gap-1 overflow-hidden">
                              {expert.vakshe.slice(0, 2).map((vakshe, vaksheIndex) => (
                                <span key={vaksheIndex} className="text-[8px] font-medium text-primary">
                                  {vakshe}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="px-1 text-[9px] italic text-muted-foreground">
                      {t("These members have relevant expertise for this event type.", "इन सदस्यों के पास इस कार्यक्रम के प्रकार हेतु प्रासंगिक विशेषज्ञता है।")}
                    </p>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  {t("Submit for Review", "समीक्षा के लिए भेजें")}
                </Button>
              </form>
            </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      {submitted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="border-green-500/40 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-sm font-devanagari text-green-800 dark:text-green-300">
                {t("Event submitted for review! It will appear in the list below.", "कार्यक्रम समीक्षा के लिए भेजा गया! यह नीचे सूची में दिखाई देगा।")}
              </span>
              <button onClick={() => setSubmitted(false)} className="ml-4 shrink-0 text-muted-foreground transition-colors hover:text-foreground" aria-label="Dismiss">
                <X className="h-4 w-4" />
              </button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {myEvents.length === 0 ? (
        <div
          className="institution-panel flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-primary/25 bg-gradient-to-b from-primary/[0.04] to-transparent px-6 py-14 text-center"
          role="status"
          aria-live="polite"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <CalendarDays className="h-7 w-7" aria-hidden />
          </div>
          <div className="max-w-md space-y-2">
            <h2 className={lang === "hi" ? "text-lg font-semibold font-devanagari" : "text-lg font-semibold tracking-tight"}>
              {t("No programmes in your lane yet", "अभी आपकी धारा में कोई कार्यक्रम नहीं है")}
            </h2>
            <p className={lang === "hi" ? "text-sm text-muted-foreground font-devanagari leading-relaxed" : "text-sm text-muted-foreground leading-relaxed"}>
              {permissions.canCreateEvent
                ? t(
                    "Create your first event to start checklist, registration form, and review flow — everything stays in one place.",
                    "पहला कार्यक्रम बनाएँ: चेकलिस्ट, पंजीकरण फ़ॉर्म और समीक्षा प्रवाह — सब एक जगह।",
                  )
                : t(
                    "When your unit head assigns or submits programmes, they will appear here with status and next steps.",
                    "जब इकाई प्रमुख कार्यक्रम सौंपेंगे या भेजेंगे, वे यहाँ स्थिति और अगले कदमों के साथ दिखेंगे।",
                  )}
            </p>
          </div>
          {permissions.canCreateEvent ? (
            <Button type="button" size="lg" className="mt-2 gap-2 rounded-2xl px-8 shadow-md" onClick={() => setDialogOpen(true)}>
              <Plus className="h-5 w-5" aria-hidden />
              {t("Create your first event", "पहला कार्यक्रम बनाएँ")}
            </Button>
          ) : null}
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {myEvents.map((event, index) => (
            <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.05 }}>
              <Card className="glass-card h-full hover-lift [content-visibility:auto] [contain-intrinsic-size:auto_280px]">
                <CardContent className="space-y-3 pt-5">
                  <div className="flex items-start justify-between">
                    <h3 className="mr-2 flex-1 text-sm font-semibold leading-snug">{event.title}</h3>
                    <Badge className={`${statusBadge(event.status)} shrink-0 text-[10px]`}>{statusLabel(event.status)}</Badge>
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{event.description}</p>
                  <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {event.unit}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {event.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" /> {event.submittedBy}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {event.status === "Draft" && permissions.canCreateEvent && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary/80" onClick={() => void onSubmitForReview(event.id)}>
                        <ArrowRight className="mr-1 h-3 w-3" />
                        {t("Submit", "भेजें")}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => copyFormLink(event.id)}>
                      {copiedId === event.id ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3 text-green-600" />
                          {t("Copied!", "कॉपी!")}
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-1 h-3 w-3" />
                          {t("Form Link", "फ़ॉर्म लिंक")}
                        </>
                      )}
                    </Button>
                    {(event.registrations?.length ?? 0) > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary/80" onClick={() => setResponseEvent(event)}>
                        <ClipboardCheck className="mr-1 h-3 w-3" />
                        {t(`Responses (${event.registrations?.length ?? 0})`, `प्रतिक्रियाएँ (${event.registrations?.length ?? 0})`)}
                      </Button>
                    )}
                    {(event.polls?.length ?? 0) > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700" onClick={() => setPollResultsEvent(event)}>
                        <Vote className="mr-1 h-3 w-3" />
                        {t(
                          `Matdan (${event.polls?.reduce((sum, poll) => sum + poll.options.reduce((optionSum, option) => optionSum + option.votes, 0), 0) ?? 0})`,
                          `मतदान (${event.polls?.reduce((sum, poll) => sum + poll.options.reduce((optionSum, option) => optionSum + option.votes, 0), 0) ?? 0})`,
                        )}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => setPollCreateEvent(event)}>
                      <Vote className="mr-1 h-3 w-3" />
                      {t("+ Poll", "+ मत")}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={() => onOpenVrittEditor(event)}>
                      <FileText className="mr-1 h-3 w-3" />
                      {t("Vritt", "वृत्त")}
                    </Button>
                    {event.status === "Published" && (
                      <>
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700" onClick={() => onOpenQr(event)}>
                          <QrCode className="mr-1 h-3 w-3" />
                          {t("Venue QR", "क्यूआर")}
                        </Button>
                        <Link href="/feed">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary/80">
                            {t("Feed", "फ़ीड")} <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                  {event.vrittStatus && (
                    <button onClick={() => onOpenVrittEditor(event)} className="w-full space-y-1 border-t border-border/30 pt-2 text-left">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge variant="outline" className={`text-[10px] ${event.vrittStatus === "reviewed" ? "border-green-500/40 text-green-600" : event.vrittStatus === "submitted" ? "border-blue-500/40 text-blue-600" : ""}`}>
                          <FileText className="mr-0.5 h-2.5 w-2.5" /> {vrittStatusLabel(event.vrittStatus)}
                        </Badge>
                        {event.vrittCheckedInCount != null && event.vrittCheckedInCount > 0 && (
                          <span className="flex items-center gap-1 font-bold text-amber-600">
                            <QrCode className="h-3 w-3" /> {event.vrittCheckedInCount}
                          </span>
                        )}
                        {event.vrittAttendanceCount != null && event.vrittAttendanceCount > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3" /> {event.vrittAttendanceCount}
                          </span>
                        )}
                      </div>
                      {event.vrittContent && <p className="line-clamp-2 text-[11px] text-muted-foreground">{event.vrittContent}</p>}
                    </button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      )}

      <Dialog open={!!pollCreateEvent} onOpenChange={(open) => !open && setPollCreateEvent(null)}>
        <DialogContent className="bg-popover sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-devanagari">
              <Vote className="h-4 w-4 text-amber-500" /> {t("Create Poll — Matdan", "मतदान बनाएं")}
            </DialogTitle>
            <DialogDescription>
              {t("Add a date or option poll for this event.", "इस कार्यक्रम के लिए तारीख या विकल्प मतदान जोड़ें।")}
            </DialogDescription>
            {pollCreateEvent && <p className="mt-1 text-xs text-muted-foreground">{pollCreateEvent.title}</p>}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t("Question (English)", "प्रश्न (अंग्रेज़ी)")}</Label>
              <Input value={newPollQuestion} onChange={(event) => setNewPollQuestion(event.target.value)} placeholder={t("e.g. Which date works best?", "जैसे: कौन सी तारीख उचित है?")} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-devanagari">{t("Question (Hindi)", "प्रश्न (हिन्दी)")}</Label>
              <Input value={newPollQuestionHi} onChange={(event) => setNewPollQuestionHi(event.target.value)} placeholder="जैसे: कार्यक्रम के लिए कौन सी तारीख उचित है?" className="font-devanagari" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t("Poll Type", "मतदान प्रकार")}</Label>
              <Select value={newPollType} onValueChange={(value: "date" | "general") => setNewPollType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">📅 {t("Date Selection", "तारीख चुनाव")}</SelectItem>
                  <SelectItem value="general">📋 {t("General / Options", "सामान्य / विकल्प")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t("Options (min 2)", "विकल्प (न्यूनतम 2)")}</Label>
              {newPollOptions.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={option} onChange={(event) => setNewPollOptions((previous) => previous.map((currentOption, optionIndex) => (optionIndex === index ? event.target.value : currentOption)))} placeholder={newPollType === "date" ? `${t("Date", "तारीख")} ${index + 1}` : `${t("Option", "विकल्प")} ${index + 1}`} className="text-sm" />
                  {newPollOptions.length > 2 && (
                    <button onClick={() => setNewPollOptions((previous) => previous.filter((_, optionIndex) => optionIndex !== index))} className="shrink-0 text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {newPollOptions.length < 5 && (
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setNewPollOptions((previous) => [...previous, ""])}>
                  <Plus className="mr-1 h-3 w-3" /> {t("Add Option", "विकल्प जोड़ें")}
                </Button>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreatePoll} className="flex-1" disabled={!newPollQuestion.trim() || newPollOptions.filter((option) => option.trim()).length < 2}>
                <Vote className="mr-2 h-4 w-4" /> {t("Create Poll", "मतदान बनाएं")}
              </Button>
              <Button variant="outline" onClick={() => setPollCreateEvent(null)}>
                {t("Cancel", "रद्द")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!pollResultsEvent} onOpenChange={(open) => !open && setPollResultsEvent(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {pollResultsEvent && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="flex items-center gap-2 text-base font-devanagari">
                  <Vote className="h-4 w-4 text-amber-500" /> {t("Poll Results — Matdan", "मतदान परिणाम")}
                </SheetTitle>
                <SheetDescription>
                  {t("Review member votes and finalize the selected option.", "सदस्य मतदान देखें और चुने हुए विकल्प को अंतिम करें।")}
                </SheetDescription>
                <p className="text-xs text-muted-foreground">{pollResultsEvent.title}</p>
              </SheetHeader>

              <div className="space-y-4">
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/vote/${pollResultsEvent.id}`);
                  addToast(t("Vote link copied!", "वोट लिंक कॉपी हुआ!"), "success");
                }}>
                  <Link2 className="mr-1 h-3 w-3" />
                  {t("Copy Vote Link for Members", "सदस्यों के लिए वोट लिंक कॉपी करें")}
                </Button>

                {(pollResultsEvent.polls ?? []).map((poll) => {
                  const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
                  const winner = poll.options.reduce((currentWinner, option) => (option.votes > currentWinner.votes ? option : currentWinner), poll.options[0]);
                  return (
                    <div key={poll.id} className="space-y-3 rounded-xl border border-border/60 bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{lang === "hi" ? poll.questionHi : poll.question}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {poll.type === "date" ? "📅" : "📋"} {totalVotes} {t("total votes", "कुल वोट")}
                            {poll.isFinalized && <span className="ml-2 font-medium text-green-600">✓ {t("Finalized", "अंतिम")}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {poll.options.map((option) => {
                          const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                          const isWinner = option.id === winner?.id && option.votes > 0;
                          const isFinalizedWinner = option.id === poll.winnerOptionId;
                          return (
                            <div key={option.id} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={`font-medium ${isFinalizedWinner ? "text-green-600" : ""}`}>
                                  {isFinalizedWinner ? "✓ " : ""}
                                  {option.label}
                                </span>
                                <span className="text-muted-foreground">{option.votes} ({pct}%)</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-muted">
                                <motion.div className={`h-full rounded-full ${isWinner && !poll.isFinalized ? "saffron-gradient" : isFinalizedWinner ? "bg-green-500" : "bg-muted-foreground/40"}`} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {!poll.isFinalized && totalVotes > 0 && (
                        <Button size="sm" className="w-full text-xs" disabled={!permissions.canFinalizePoll} onClick={async () => {
                          const ok = await finalizePoll(pollResultsEvent.id, poll.id, winner.id);
                          if (!ok) {
                            addToast(t("Finalize not allowed", "अंतिम करने की अनुमति नहीं है"), "error");
                            return;
                          }
                          setPollResultsEvent((previous) =>
                            previous
                              ? {
                                  ...previous,
                                  polls: (previous.polls ?? []).map((currentPoll) => (currentPoll.id === poll.id ? { ...currentPoll, isFinalized: true, winnerOptionId: winner.id } : currentPoll)),
                                }
                              : null,
                          );
                          addToast(t(`Finalized: ${winner.label}`, `अंतिम: ${winner.label}`), "success", poll.type === "date" ? t("Event date updated!", "कार्यक्रम की तारीख अद्यतन हुई!") : "");
                        }}>
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          {t(`Finalize with "${winner.label}"`, `"${winner.label}" से अंतिम करें`)}
                        </Button>
                      )}
                    </div>
                  );
                })}

                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                  setPollResultsEvent(null);
                  setPollCreateEvent(pollResultsEvent);
                }}>
                  <Plus className="mr-1 h-3 w-3" /> {t("Add Another Poll", "और मतदान जोड़ें")}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!responseEvent} onOpenChange={(open) => !open && setResponseEvent(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
          {responseEvent && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="text-base font-devanagari leading-snug">
                  {t("Registrations", "पंजीकरण")} — {responseEvent.title}
                </SheetTitle>
                <SheetDescription>
                  {t("Review registration responses and participant details.", "पंजीकरण प्रतिक्रियाएँ और सहभागी विवरण देखें।")}
                </SheetDescription>
                <p className="text-xs text-muted-foreground">{responseEvent.date} · {responseEvent.unit}</p>
              </SheetHeader>

              {(() => {
                const registrations = responseEvent.registrations ?? [];
                const totalPeople = registrations.reduce((sum, registration) => sum + registration.attendingCount, 0);
                const cities = new Set(registrations.map((registration) => registration.city)).size;
                return (
                  <div className="mb-5 grid grid-cols-3 gap-3">
                    {[
                      { label: t("Registrations", "पंजीकरण"), value: registrations.length, icon: ClipboardCheck, color: "text-primary" },
                      { label: t("Total People", "कुल लोग"), value: totalPeople, icon: Users, color: "text-info" },
                      { label: t("Cities", "शहर"), value: cities, icon: Building2, color: "text-success" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-border/60 bg-card p-3 text-center">
                        <stat.icon className={`mx-auto mb-1 h-4 w-4 ${stat.color}`} />
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-[10px] leading-tight text-muted-foreground font-devanagari">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <div className="mb-4 flex items-center gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => copyFormLink(responseEvent.id)}>
                  {copiedId === responseEvent.id ? (
                    <>
                      <CheckCircle2 className="mr-1 h-3 w-3 text-green-600" />
                      {t("Copied!", "कॉपी!")}
                    </>
                  ) : (
                    <>
                      <Link2 className="mr-1 h-3 w-3" />
                      {t("Copy Form Link", "फ़ॉर्म लिंक कॉपी करें")}
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {(responseEvent.registrations ?? []).map((registration, index) => (
                  <motion.div key={registration.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="space-y-2 rounded-xl border border-border/60 bg-muted/30 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="dashboard-section-heading">
                        <div className="saffron-gradient flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
                          <span className="text-[10px] font-bold text-white">{registration.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-none">{registration.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{registration.submittedAt}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                          <Users className="mr-1 h-2.5 w-2.5" />
                          {registration.attendingCount}
                        </Badge>
                        {registration.hasSpecialNeeds && <Badge className="border-warning/30 bg-warning/20 px-1.5 py-0 text-[10px] text-warning">{t("Special", "विशेष")}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pl-9 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {registration.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {registration.city}
                      </span>
                    </div>
                    {registration.notes && <p className="pl-9 text-xs italic text-foreground/70">"{registration.notes}"</p>}
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

