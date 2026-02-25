"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext, GatividhiEvent, FormConfig, VotePoll } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, isValid } from "date-fns";
import {
  Plus, CalendarDays, MapPin, User, CheckCircle2, Clock, Eye,
  ArrowRight, BarChart3, Users, TrendingUp, X, Link2, ClipboardCheck,
  Phone, Building2, Trash2, SlidersHorizontal, Vote, Lightbulb,
} from "lucide-react";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Draft: "status-draft",
    "Pending Aayam Review": "status-pending-review",
    "Pending Final Approval": "status-pending-approval",
    Published: "status-published",
  };
  return map[status] || "";
};

const eventStatusHi: Record<string, string> = {
  Draft: "प्रारूप",
  "Pending Aayam Review": "आयाम समीक्षा प्रतीक्षित",
  "Pending Final Approval": "अंतिम अनुमोदन प्रतीक्षित",
  Published: "प्रकाशित",
};

export default function Dashboard() {
  const { role, lang, events, addEvent, updateEventStatus, updateFormConfig, addPoll, castVote, finalizePoll } = useAppContext();
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

  const statusLabel = (status: string) => lang === 'hi' ? (eventStatusHi[status] ?? status) : status;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDate = parseISO(dateValue);
    if (!form.title || !isValid(selectedDate)) return;

    addEvent({
      title: form.title,
      description: form.description,
      date: format(selectedDate, "dd MMM yyyy"),
      unit: form.unit || "Bhopal",
      submittedBy: "Current User",
      checklist: form.checklist,
      report: form.report,
      imageUrl: "",
      formConfig: localFormConfig,
    });
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

  const toggleChecklist = (key: keyof typeof form.checklist) => {
    setForm(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
  };

  const SUGGESTIONS: { question: string; questionHi: string; type: 'text' | 'yesno' }[] = [
    { question: 'T-shirt size?', questionHi: 'टी-शर्ट साइज?', type: 'text' },
    { question: 'Vegetarian?', questionHi: 'शाकाहारी?', type: 'yesno' },
    { question: 'Need accommodation?', questionHi: 'आवास चाहिए?', type: 'yesno' },
    { question: 'Coming from outside city?', questionHi: 'शहर से बाहर से आ रहे हैं?', type: 'yesno' },
    { question: 'Preferred session time?', questionHi: 'पसंदीदा सत्र समय?', type: 'text' },
    { question: 'Bringing family?', questionHi: 'परिवार ला रहे हैं?', type: 'yesno' },
  ];

  const addSuggestion = (s: typeof SUGGESTIONS[0]) => {
    if (localFormConfig.customQuestions.length >= 5) return;
    if (localFormConfig.customQuestions.some(q => q.question === s.question)) return;
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
    setLocalFormConfig(prev => ({ ...prev, customQuestions: prev.customQuestions.filter(q => q.id !== id) }));
  };

  const handleCreatePoll = () => {
    if (!pollCreateEvent || !newPollQuestion.trim()) return;
    const validOptions = newPollOptions.filter(o => o.trim());
    if (validOptions.length < 2) return;
    addPoll(pollCreateEvent.id, {
      question: newPollQuestion.trim(),
      questionHi: newPollQuestionHi.trim() || newPollQuestion.trim(),
      type: newPollType,
      options: validOptions.map((label, i) => ({ id: `o${i}${Date.now()}`, label: label.trim(), votes: 0 })),
    });
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

  // Role-specific content
  if (role === "vibhag_pramukh") {
    const totalEvents = events.length;
    const published = events.filter(e => e.status === "Published").length;
    const pending = events.filter(e => e.status === "Pending Final Approval");
    const units = new Set(events.map(e => e.unit)).size;
    const [lastPublished, setLastPublished] = useState<string | null>(null);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("Vibhag Dashboard", "विभाग डैशबोर्ड")}</h1>
          <p className="text-muted-foreground text-sm">{t("Overview of all activities across Bhopal Vibhag", "भोपाल विभाग की सभी गतिविधियों का अवलोकन")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: t("Total Events", "कुल कार्यक्रम"), value: totalEvents, icon: BarChart3, color: "text-primary" },
            { label: t("Published", "प्रकाशित"), value: published, icon: CheckCircle2, color: "text-success" },
            { label: t("Pending Approval", "अनुमोदन प्रतीक्षित"), value: pending.length, icon: Clock, color: "text-warning" },
            { label: t("Active Units", "सक्रिय इकाइयाँ"), value: units, icon: Users, color: "text-info" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="glass-card hover-lift">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className={`w-8 h-8 ${stat.color} opacity-70`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" /> {t('Final Approvals Queue', 'अंतिम अनुमोदन कतार')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">{t('No events pending final approval.', 'अंतिम अनुमोदन प्रतीक्षित कोई कार्यक्रम नहीं।')}</p>
            ) : (
              <div className="space-y-3">
                {pending.map(event => (
                  <motion.div key={event.id} layout className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.unit} · {event.date}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        updateEventStatus(event.id, "Published");
                        setLastPublished(event.title);
                        addToast(t('Published to Feed!', 'फ़ीड में प्रकाशित!'), 'success', t('Update Prachar now', 'प्रचार अद्यतन करें'));
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" /> {t('Publish to Feed', 'फ़ीड में प्रकाशित करें')}
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            {lastPublished && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <Card className="border border-green-500/40 bg-green-500/10">
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-green-800 dark:text-green-300 font-devanagari">
                            <span className="font-semibold">{lastPublished}</span> {t('published! Update Prachar now.', 'प्रकाशित! प्रचार अद्यतन करना न भूलें।')}
                          </p>
                          <Link href="/prachar">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-green-700 dark:text-green-400 hover:text-green-900">
                              {t('Go to Prachar', 'प्रचार पर जाएं')} <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <button onClick={() => setLastPublished(null)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Dismiss">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (role === "aayam_pramukh") {
    const pendingReview = events.filter(e => e.status === "Pending Aayam Review");
    const forwarded = events.filter(e => e.status === "Pending Final Approval" || e.status === "Published");

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("Aayam Review Board", "आयाम समीक्षा मंडल")}</h1>
          <p className="text-muted-foreground text-sm">{t("Review and forward events submitted by Unit Heads", "इकाई प्रमुखों द्वारा प्रस्तुत कार्यक्रमों की समीक्षा करें")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Reviews */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> {t(`Pending Reviews (${pendingReview.length})`, `समीक्षा प्रतीक्षित (${pendingReview.length})`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingReview.length === 0 ? (
                <p className="text-muted-foreground text-sm py-6 text-center">{t('All caught up! No pending reviews.', 'सब ठीक है! कोई समीक्षा प्रतीक्षित नहीं।')}</p>
              ) : (
                pendingReview.map(event => (
                  <motion.div key={event.id} layout className="p-4 rounded-lg bg-accent/50 border border-border/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <MapPin className="w-3 h-3" />{event.unit}
                          <CalendarDays className="w-3 h-3 ml-2" />{event.date}
                        </p>
                      </div>
                      <Badge className={statusBadge(event.status)}>{statusLabel(event.status)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                    <div className="space-y-1">
                      <Button size="sm" onClick={() => {
                        updateEventStatus(event.id, "Pending Final Approval");
                        addToast(t('Forwarded for final approval', 'अंतिम अनुमोदन के लिए भेजा'), 'info', t('Sent to Vibhag Pramukh', 'विभाग प्रमुख की समीक्षा के लिए भेजा'));
                      }}>
                        {t('Review & Forward', 'समीक्षा करें और भेजें')} <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                      <p className="text-xs text-muted-foreground pl-0.5 font-devanagari">
                        {t('Forwarded events are visible to Vibhag Pramukh for final approval.', 'अग्रेषित कार्यक्रम विभाग प्रमुख को अंतिम अनुमोदन के लिए दिखाई देंगे।')}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Forwarded */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" /> {t(`Forwarded (${forwarded.length})`, `अग्रेषित (${forwarded.length})`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {forwarded.map(event => (
                <div key={event.id} className="p-4 rounded-lg bg-muted/30 border border-border/30">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-sm">{event.title}</p>
                    <Badge className={statusBadge(event.status)}>{statusLabel(event.status)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{event.unit} · {event.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  // Unit Head & Karyakarta View
  const myEvents = events.filter(e => e.submittedBy === "Current User" || true);

  const checklistItems: { key: keyof typeof form.checklist; en: string; hi: string }[] = [
    { key: "designing", en: "Designing", hi: "डिज़ाइनिंग" },
    { key: "food", en: "Food", hi: "भोजन" },
    { key: "seating", en: "Sitting & Place", hi: "बैठक व स्थान" },
    { key: "transport", en: "Transport", hi: "परिवहन" },
    { key: "accommodation", en: "Accommodation", hi: "आवास" },
    { key: "soundMic", en: "Sound + Music", hi: "ध्वनि एवं संगीत" },
    { key: "camera", en: "Camera", hi: "कैमरा" },
    { key: "screen", en: "Screen", hi: "स्क्रीन" },
    { key: "lights", en: "Lights", hi: "रोशनी" },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("Gatividhi Dashboard", "गतिविधि डैशबोर्ड")}</h1>
          <p className="text-muted-foreground text-sm">{t("Create and track events for your unit", "अपनी इकाई के लिए कार्यक्रम बनाएं और ट्रैक करें")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> {t("Create New Event", "नया कार्यक्रम बनाएं")}</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg bg-popover">
            <DialogHeader>
              <DialogTitle className="font-devanagari">{t('New Gatividhi', 'नई गतिविधि')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>{t('Event Title', 'कार्यक्रम का नाम')}</Label>
                  <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t('Enter event name', 'कार्यक्रम का नाम दर्ज करें')} required />
                </div>
                <div>
                  <Label>{t('Date', 'दिनांक')}</Label>
                  <Input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} required className="w-full" />
                </div>
                <div>
                  <Label>{t('Unit', 'इकाई')}</Label>
                  <Input value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder={t('e.g. Bhopal', 'जैसे भोपाल')} />
                </div>
                <div className="col-span-2">
                  <Label>{t('Description', 'विवरण')}</Label>
                  <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
              </div>

              <Tabs value={formTab} onValueChange={setFormTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="pre" className="flex-1 font-devanagari text-xs">{t('Vyavastha', 'व्यवस्थाएं')}</TabsTrigger>
                  <TabsTrigger value="post" className="flex-1 font-devanagari text-xs">{t('Vritt', 'वृत्त')}</TabsTrigger>
                  <TabsTrigger value="form" className="flex-1 font-devanagari text-xs">
                    <SlidersHorizontal className="w-3 h-3 mr-1" />{t('Form', 'फॉर्म')}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pre" className="space-y-3 pt-2">
                  {checklistItems.map(item => (
                    <div key={item.key} className="flex items-center gap-3">
                      <Checkbox checked={form.checklist[item.key]} onCheckedChange={() => toggleChecklist(item.key)} id={item.key} />
                      <Label htmlFor={item.key} className="text-sm cursor-pointer font-devanagari">{t(item.en, item.hi)}</Label>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="post" className="space-y-3 pt-2">
                  <div>
                    <Label className="font-devanagari">{t('Vritt (Detailed Report)', 'वृत्त (विस्तृत विवरण)')}</Label>
                    <Textarea value={form.report} onChange={e => setForm(p => ({ ...p, report: e.target.value }))} rows={3} placeholder={t('Write the detailed post-event report...', 'कार्यक्रम के बाद का विस्तृत विवरण लिखें...')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{t('Upload Photos', 'फ़ोटो अपलोड करें')}</Label>
                      <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setForm(p => ({ ...p, fileName: "photos_event.zip" }))}>
                        {form.fileName ? (
                          <p className="text-foreground font-medium text-xs">📷 {form.fileName}</p>
                        ) : (
                          <p className="text-xs">📷 {t('Photos (simulated)', 'फ़ोटो (अनुकरण)')}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label>{t('Upload Video', 'वीडियो अपलोड करें')}</Label>
                      <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => setForm(p => ({ ...p, videoUrl: "event_video.mp4" }))}>
                        {form.videoUrl ? (
                          <p className="text-foreground font-medium text-xs">🎥 {form.videoUrl}</p>
                        ) : (
                          <p className="text-xs">🎥 {t('Video (simulated)', 'वीडियो (अनुकरण)')}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>{t('Upload Poster', 'पोस्टर अपलोड करें')}</Label>
                    <div className="mt-1 border-2 border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => setForm(p => ({ ...p, posterName: "event_poster.jpg" }))}>
                      {form.posterName ? (
                        <p className="text-foreground font-medium text-xs">🖼️ {form.posterName}</p>
                      ) : (
                        <p className="text-xs">🖼️ {t('Upload Poster (simulated)', 'पोस्टर अपलोड करें (अनुकरण)')}</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

                <TabsContent value="form" className="space-y-4 pt-2">
                  {/* Field toggles */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('Default Fields', 'डिफ़ॉल्ट फ़ील्ड')}</p>
                    {([
                      { key: 'phone' as const, en: 'Mobile Number', hi: 'मोबाइल नंबर' },
                      { key: 'city' as const, en: 'City', hi: 'शहर' },
                      { key: 'attendingCount' as const, en: 'Attendee Count', hi: 'उपस्थित संख्या' },
                      { key: 'specialNeeds' as const, en: 'Special Needs', hi: 'विशेष जरूरत' },
                    ] as { key: keyof FormConfig['fields']; en: string; hi: string }[]).map(f => (
                      <div key={f.key} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                        <Label className="font-devanagari text-sm cursor-pointer">{t(f.en, f.hi)}</Label>
                        <Switch
                          checked={localFormConfig.fields[f.key]}
                          onCheckedChange={v => setLocalFormConfig(prev => ({ ...prev, fields: { ...prev.fields, [f.key]: v } }))}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Custom questions */}
                  {localFormConfig.customQuestions.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('Custom Questions', 'कस्टम प्रश्न')}</p>
                      {localFormConfig.customQuestions.map(q => (
                        <div key={q.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/50 border border-border/40">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{q.question}</p>
                            <p className="text-[10px] text-muted-foreground">{q.type === 'yesno' ? 'Yes/No' : 'Text'}</p>
                          </div>
                          <button onClick={() => removeCustomQuestion(q.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add custom question */}
                  {localFormConfig.customQuestions.length < 5 && (
                    showAddQ ? (
                      <div className="space-y-2 p-3 rounded-lg border border-border/50 bg-muted/30">
                        <Input value={newCustomQ} onChange={e => setNewCustomQ(e.target.value)} placeholder={t('Question (English)', 'प्रश्न (अंग्रेजी)')} className="text-sm h-8" />
                        <Input value={newCustomQHi} onChange={e => setNewCustomQHi(e.target.value)} placeholder={t('Question (Hindi, optional)', 'प्रश्न (हिंदी, वैकल्पिक)')} className="text-sm h-8 font-devanagari" />
                        <div className="flex gap-2">
                          <Select value={newCustomQType} onValueChange={(v: 'text' | 'yesno') => setNewCustomQType(v)}>
                            <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yesno">Yes / No</SelectItem>
                              <SelectItem value="text">Text Answer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="sm" onClick={addCustomQuestion} className="h-8 text-xs">{t('Add', 'जोड़ें')}</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowAddQ(false)} className="h-8 text-xs">{t('Cancel', 'रद्द')}</Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setShowAddQ(true)}>
                        <Plus className="w-3 h-3 mr-1" /> {t('Add Custom Question', 'कस्टम प्रश्न जोड़ें')}
                      </Button>
                    )
                  )}

                  {/* Suggestions */}
                  <div className="space-y-2">
                    <p className="text-xs flex items-center gap-1 text-muted-foreground font-semibold uppercase tracking-wide">
                      <Lightbulb className="w-3 h-3 text-warning" />{t('Suggestions', 'सुझाव')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {SUGGESTIONS.map(s => {
                        const alreadyAdded = localFormConfig.customQuestions.some(q => q.question === s.question);
                        return (
                          <button
                            key={s.question}
                            type="button"
                            disabled={alreadyAdded || localFormConfig.customQuestions.length >= 5}
                            onClick={() => addSuggestion(s)}
                            className={`text-[11px] px-2 py-1 rounded-full border transition-colors font-devanagari ${
                              alreadyAdded
                                ? 'bg-primary/10 border-primary/30 text-primary cursor-default'
                                : 'border-border hover:border-primary/50 hover:bg-primary/5 cursor-pointer'
                            } disabled:opacity-40`}
                          >
                            {alreadyAdded ? '✓ ' : '+ '}{t(s.question, s.questionHi)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>

              <Button type="submit" className="w-full">{t('Submit for Review', 'समीक्षा के लिए भेजें')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success alert after submission */}
      {submitted && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Alert className="border-green-500/40 bg-green-500/10">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <AlertDescription className="flex items-center justify-between">
              <span className="text-green-800 dark:text-green-300 text-sm font-devanagari">
                {t('Event submitted for Aayam review! It will appear in the list below.', 'कार्यक्रम आयाम समीक्षा के लिए भेजा गया! यह नीचे सूची में दिखाई देगा।')}
              </span>
              <button onClick={() => setSubmitted(false)} className="ml-4 text-muted-foreground hover:text-foreground transition-colors shrink-0" aria-label="Dismiss">
                <X className="w-4 h-4" />
              </button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Event List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {myEvents.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="glass-card hover-lift h-full">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-sm leading-snug flex-1 mr-2">{event.title}</h3>
                    <Badge className={`${statusBadge(event.status)} text-[10px] shrink-0`}>{statusLabel(event.status)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.unit}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{event.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" /> {event.submittedBy}
                  </div>
                  {/* Form link + Responses + Matdan */}
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    <Button
                      variant="ghost" size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => copyFormLink(event.id)}
                    >
                      {copiedId === event.id
                        ? <><CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />{t('Copied!', 'कॉपी!')}</>
                        : <><Link2 className="w-3 h-3 mr-1" />{t('Form Link', 'फॉर्म लिंक')}</>
                      }
                    </Button>
                    {(event.registrations?.length ?? 0) > 0 && (
                      <Button variant="ghost" size="sm"
                        className="h-7 px-2 text-xs text-primary hover:text-primary/80"
                        onClick={() => setResponseEvent(event)}
                      >
                        <ClipboardCheck className="w-3 h-3 mr-1" />
                        {t(`Responses (${event.registrations!.length})`, `प्रतिक्रियाएं (${event.registrations!.length})`)}
                      </Button>
                    )}
                    {/* Matdan buttons */}
                    {(event.polls?.length ?? 0) > 0 && (
                      <Button variant="ghost" size="sm"
                        className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700"
                        onClick={() => setPollResultsEvent(event)}
                      >
                        <Vote className="w-3 h-3 mr-1" />
                        {t(`Matdan (${event.polls!.reduce((s, p) => s + p.options.reduce((a, o) => a + o.votes, 0), 0)})`,
                           `मतदान (${event.polls!.reduce((s, p) => s + p.options.reduce((a, o) => a + o.votes, 0), 0)})`)}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setPollCreateEvent(event)}
                    >
                      <Vote className="w-3 h-3 mr-1" />{t('+ Poll', '+ मत')}
                    </Button>
                    {event.status === "Published" && (
                      <Link href="/feed">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary hover:text-primary/80">
                          {t('Feed', 'फ़ीड')} <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Poll Creation Dialog ── */}
      <Dialog open={!!pollCreateEvent} onOpenChange={open => !open && setPollCreateEvent(null)}>
        <DialogContent className="sm:max-w-md bg-popover">
          <DialogHeader>
            <DialogTitle className="font-devanagari flex items-center gap-2">
              <Vote className="w-4 h-4 text-amber-500" /> {t('Create Poll — Matdan', 'मतदान बनाएं')}
            </DialogTitle>
            {pollCreateEvent && <p className="text-xs text-muted-foreground mt-1">{pollCreateEvent.title}</p>}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">{t('Question (English)', 'प्रश्न (अंग्रेजी)')}</Label>
              <Input value={newPollQuestion} onChange={e => setNewPollQuestion(e.target.value)}
                placeholder={t('e.g. Which date works best?', 'जैसे: कौन सी तारीख उचित है?')} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-devanagari">{t('Question (Hindi)', 'प्रश्न (हिंदी)')}</Label>
              <Input value={newPollQuestionHi} onChange={e => setNewPollQuestionHi(e.target.value)}
                placeholder="जैसे: कार्यक्रम के लिए कौन सी तारीख उचित है?" className="font-devanagari" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">{t('Poll Type', 'मतदान प्रकार')}</Label>
              <Select value={newPollType} onValueChange={(v: 'date' | 'general') => setNewPollType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">📅 {t('Date Selection', 'तारीख चुनाव')}</SelectItem>
                  <SelectItem value="general">📋 {t('General / Options', 'सामान्य / विकल्प')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('Options (min 2)', 'विकल्प (न्यूनतम 2)')}</Label>
              {newPollOptions.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={opt}
                    onChange={e => setNewPollOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                    placeholder={newPollType === 'date' ? `${t('Date', 'तारीख')} ${i + 1}` : `${t('Option', 'विकल्प')} ${i + 1}`}
                    className="text-sm" />
                  {newPollOptions.length > 2 && (
                    <button onClick={() => setNewPollOptions(prev => prev.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {newPollOptions.length < 5 && (
                <Button variant="outline" size="sm" className="text-xs w-full"
                  onClick={() => setNewPollOptions(prev => [...prev, ''])}>
                  <Plus className="w-3 h-3 mr-1" /> {t('Add Option', 'विकल्प जोड़ें')}
                </Button>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreatePoll} className="flex-1"
                disabled={!newPollQuestion.trim() || newPollOptions.filter(o => o.trim()).length < 2}>
                <Vote className="w-4 h-4 mr-2" /> {t('Create Poll', 'मतदान बनाएं')}
              </Button>
              <Button variant="outline" onClick={() => setPollCreateEvent(null)}>{t('Cancel', 'रद्द')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Poll Results Sheet ── */}
      <Sheet open={!!pollResultsEvent} onOpenChange={open => !open && setPollResultsEvent(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {pollResultsEvent && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="text-base font-devanagari flex items-center gap-2">
                  <Vote className="w-4 h-4 text-amber-500" /> {t('Poll Results — Matdan', 'मतदान परिणाम')}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">{pollResultsEvent.title}</p>
              </SheetHeader>

              <div className="space-y-4">
                {/* Share vote link */}
                <Button variant="outline" size="sm" className="text-xs w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/vote/${pollResultsEvent.id}`);
                    addToast(t('Vote link copied!', 'वोट लिंक कॉपी हुआ!'), 'success');
                  }}>
                  <Link2 className="w-3 h-3 mr-1" />{t('Copy Vote Link for Members', 'सदस्यों के लिए वोट लिंक कॉपी करें')}
                </Button>

                {(pollResultsEvent.polls ?? []).map(poll => {
                  const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
                  const winner = poll.options.reduce((a, b) => b.votes > a.votes ? b : a, poll.options[0]);
                  return (
                    <div key={poll.id} className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{lang === 'hi' ? poll.questionHi : poll.question}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {poll.type === 'date' ? '📅' : '📋'} {totalVotes} {t('total votes', 'कुल वोट')}
                            {poll.isFinalized && <span className="ml-2 text-green-600 font-medium">✓ {t('Finalized', 'अंतिम')}</span>}
                          </p>
                        </div>
                      </div>
                      {/* Bar chart */}
                      <div className="space-y-2">
                        {poll.options.map(opt => {
                          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                          const isWinner = opt.id === winner?.id && opt.votes > 0;
                          const isFinWinner = opt.id === poll.winnerOptionId;
                          return (
                            <div key={opt.id} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className={`font-medium ${isFinWinner ? 'text-green-600' : ''}`}>
                                  {isFinWinner ? '✓ ' : ''}{opt.label}
                                </span>
                                <span className="text-muted-foreground">{opt.votes} ({pct}%)</span>
                              </div>
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full ${isWinner && !poll.isFinalized ? 'saffron-gradient' : isFinWinner ? 'bg-green-500' : 'bg-muted-foreground/40'}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Finalize button */}
                      {!poll.isFinalized && totalVotes > 0 && (
                        <Button size="sm" className="w-full text-xs"
                          onClick={() => {
                            finalizePoll(pollResultsEvent.id, poll.id, winner.id);
                            setPollResultsEvent(prev => prev ? {
                              ...prev,
                              polls: (prev.polls ?? []).map(p => p.id === poll.id
                                ? { ...p, isFinalized: true, winnerOptionId: winner.id } : p)
                            } : null);
                            addToast(t(`Finalized: ${winner.label}`, `अंतिम: ${winner.label}`), 'success',
                              poll.type === 'date' ? t('Event date updated!', 'कार्यक्रम की तारीख अद्यतन हुई!') : '');
                          }}>
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          {t(`Finalize with "${winner.label}"`, `"${winner.label}" से अंतिम करें`)}
                        </Button>
                      )}
                    </div>
                  );
                })}

                <Button variant="outline" size="sm" className="w-full text-xs"
                  onClick={() => { setPollResultsEvent(null); setPollCreateEvent(pollResultsEvent); }}>
                  <Plus className="w-3 h-3 mr-1" /> {t('Add Another Poll', 'और मतदान जोड़ें')}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Response Viewer Sheet ── */}
      <Sheet open={!!responseEvent} onOpenChange={open => !open && setResponseEvent(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {responseEvent && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="text-base leading-snug font-devanagari">
                  {t('Registrations', 'पंजीकरण')} — {responseEvent.title}
                </SheetTitle>
                <p className="text-xs text-muted-foreground">{responseEvent.date} · {responseEvent.unit}</p>
              </SheetHeader>

              {/* Summary stats */}
              {(() => {
                const regs = responseEvent.registrations ?? [];
                const totalPeople = regs.reduce((sum, r) => sum + r.attendingCount, 0);
                const specialCount = regs.filter(r => r.hasSpecialNeeds).length;
                const cities = new Set(regs.map(r => r.city)).size;
                return (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: t('Registrations', 'पंजीकरण'), value: regs.length, icon: ClipboardCheck, color: 'text-primary' },
                      { label: t('Total People', 'कुल लोग'), value: totalPeople, icon: Users, color: 'text-info' },
                      { label: t('Cities', 'शहर'), value: cities, icon: Building2, color: 'text-success' },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-xl border border-border/60 bg-card p-3 text-center">
                        <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                        <p className="text-xl font-bold">{stat.value}</p>
                        <p className="text-[10px] text-muted-foreground font-devanagari leading-tight">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Action row */}
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => copyFormLink(responseEvent.id)}
                >
                  {copiedId === responseEvent.id
                    ? <><CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />{t('Copied!', 'कॉपी!')}</>
                    : <><Link2 className="w-3 h-3 mr-1" />{t('Copy Form Link', 'फॉर्म लिंक कॉपी करें')}</>
                  }
                </Button>
              </div>

              {/* Registration list */}
              <div className="space-y-3">
                {(responseEvent.registrations ?? []).map((reg, i) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full saffron-gradient flex items-center justify-center shrink-0">
                          <span className="text-[10px] text-white font-bold">{reg.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-none">{reg.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{reg.submittedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          <Users className="w-2.5 h-2.5 mr-1" />{reg.attendingCount}
                        </Badge>
                        {reg.hasSpecialNeeds && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-warning/20 text-warning border-warning/30">
                            {t('Special', 'विशेष')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pl-9">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{reg.phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{reg.city}</span>
                    </div>
                    {reg.notes && (
                      <p className="text-xs text-foreground/70 pl-9 italic">"{reg.notes}"</p>
                    )}
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
