"use client";

import { useState, useCallback } from "react";
import { Calendar, Plus, Trash2, ChevronDown, ChevronRight, Users, Mic, MapPin, Pencil } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useConferences, useCreateConference, useUpdateConference, useDeleteConference, useSessions, useCreateSession, useUpdateSession, useDeleteSession, useSpeakers, useCreateSpeaker, useUpdateSpeaker, useDeleteSpeaker, useRegistrations, useCreateRegistration, useMarkAttendance } from "@/hooks/api/use-conferences";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface Conference {
  id: string; title: string; titleHi?: string | null; theme?: string | null;
  venue?: string | null; startsAt?: string | null; endsAt?: string | null;
  status: string; registrationEnabled: boolean; sessionCount: number; registrationCount: number;
}

interface Session {
  id: string; title: string; titleHi?: string | null; sessionType: string;
  startsAt?: string | null; endsAt?: string | null; venue?: string | null;
  chairpersonName?: string | null; speakerCount: number;
}

interface Speaker {
  id: string; name: string; nameHi?: string | null; topic?: string | null;
  affiliation?: string | null; photoUrl?: string | null; bio?: string | null;
}

interface Registration {
  id: string; name: string; email?: string | null; organization?: string | null;
  category: string; isAttended: boolean; submittedAt: string;
}

const STATUS_LABELS: Record<string, { en: string; hi: string }> = {
  draft: { en: "Draft", hi: "प्रारूप" },
  planning: { en: "Planning", hi: "योजना" },
  registration_open: { en: "Registration Open", hi: "पंजीकरण खुला" },
  ongoing: { en: "Ongoing", hi: "चालू" },
  completed: { en: "Completed", hi: "पूर्ण" },
  cancelled: { en: "Cancelled", hi: "रद्द" },
};

const SESSION_TYPE_LABELS: Record<string, { en: string; hi: string }> = {
  keynote: { en: "Keynote", hi: "मुख्य भाषण" },
  panel: { en: "Panel", hi: "पैनल" },
  paper_presentation: { en: "Paper Presentation", hi: "पेपर प्रस्तुति" },
  workshop: { en: "Workshop", hi: "कार्यशाला" },
  cultural: { en: "Cultural", hi: "सांस्कृतिक" },
  other: { en: "Other", hi: "अन्य" },
};

const CATEGORY_LABELS: Record<string, { en: string; hi: string }> = {
  delegate: { en: "Delegate", hi: "प्रतिनिधि" },
  student: { en: "Student", hi: "छात्र" },
  speaker: { en: "Speaker", hi: "वक्ता" },
  vip: { en: "VIP", hi: "विशिष्ट अतिथि" },
  media: { en: "Media", hi: "मीडिया" },
  other: { en: "Other", hi: "अन्य" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  planning: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  registration_open: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ongoing: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  completed: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export function ConferencesPanel() {
  const { permissions, lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();

  const { data: conferences = [], isLoading, isError } = useConferences();
  const typedConferences = conferences as Conference[];
  const createConferenceMutation = useCreateConference();
  const updateConferenceMutation = useUpdateConference();
  const deleteConferenceMutation = useDeleteConference();

  const [expandedConf, setExpandedConf] = useState<string | null>(null);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showCreateConf, setShowCreateConf] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateSpeaker, setShowCreateSpeaker] = useState(false);
  const [showCreateRegistration, setShowCreateRegistration] = useState(false);
  const [showEditConf, setShowEditConf] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [showEditSpeaker, setShowEditSpeaker] = useState(false);

  // Edit forms
  const [editConf, setEditConf] = useState<Conference & { themeHi?: string; description?: string; descriptionHi?: string | null; registrationEnabled?: boolean; maxRegistrations?: number | null; locationId?: string | null }>({ id: "", title: "", titleHi: "", theme: "", themeHi: "", description: "", descriptionHi: "", venue: "", startsAt: "", endsAt: "", status: "draft", registrationEnabled: false, sessionCount: 0, registrationCount: 0 });
  const [editSession, setEditSession] = useState<Session & { description?: string; descriptionHi?: string | null; chairpersonNameHi?: string | null; venueHi?: string | null }>({ id: "", title: "", titleHi: "", sessionType: "panel", startsAt: "", endsAt: "", venue: "", chairpersonName: "", speakerCount: 0, description: "" });
  const [editSpeaker, setEditSpeaker] = useState<Speaker & { bio?: string | null; nameHi?: string | null; topicHi?: string | null; affiliationHi?: string | null; photoUrl?: string | null }>({ id: "", name: "", nameHi: "", topic: "", affiliation: "", bio: "" });

  // New conference form
  const [newConf, setNewConf] = useState({
    title: "", titleHi: "", theme: "", venue: "", startsAt: "", endsAt: "",
  });

  // New session form
  const [newSession, setNewSession] = useState({
    title: "", titleHi: "", sessionType: "panel", venue: "",
    startsAt: "", endsAt: "", chairpersonName: "",
  });

  // New speaker form
  const [newSpeaker, setNewSpeaker] = useState({
    name: "", nameHi: "", bio: "", topic: "", affiliation: "",
  });

  // New registration form
  const [newReg, setNewReg] = useState({
    name: "", email: "", phone: "", organization: "", category: "delegate", notes: "",
  });

  const { data: sessions = [] } = useSessions(expandedConf ?? "");
  const typedSessions = sessions as Session[];

  const { data: speakers = [] } = useSpeakers(expandedConf ?? "", expandedSession ?? "");
  const typedSpeakers = speakers as Speaker[];

  const { data: registrations = [] } = useRegistrations(expandedConf ?? "");
  const typedRegistrations = registrations as Registration[];

  const createSessionMutation = useCreateSession(expandedConf ?? "");
  const updateSessionMutation = useUpdateSession(expandedConf ?? "");
  const deleteSessionMutation = useDeleteSession(expandedConf ?? "");
  const createSpeakerMutation = useCreateSpeaker(expandedConf ?? "", expandedSession ?? "");
  const updateSpeakerMutation = useUpdateSpeaker(expandedConf ?? "", expandedSession ?? "");
  const deleteSpeakerMutation = useDeleteSpeaker(expandedConf ?? "", expandedSession ?? "");
  const createRegMutation = useCreateRegistration(expandedConf ?? "");
  const markAttendanceMutation = useMarkAttendance(expandedConf ?? "");

  const handleCreateConf = useCallback(async () => {
    if (!newConf.title || createConferenceMutation.isPending) return;
    try {
      await createConferenceMutation.mutateAsync({
        title: newConf.title, titleHi: newConf.titleHi || undefined,
        theme: newConf.theme || undefined, venue: newConf.venue || undefined,
        startsAt: newConf.startsAt ? new Date(newConf.startsAt).toISOString() : undefined,
        endsAt: newConf.endsAt ? new Date(newConf.endsAt).toISOString() : undefined,
      });
      setShowCreateConf(false);
      setNewConf({ title: "", titleHi: "", theme: "", venue: "", startsAt: "", endsAt: "" });
      addToast(t("Conference created!", "सम्मेलन बनाया गया!"), "success");
    } catch { addToast(t("Failed to create conference", "सम्मेलन बनाने में विफल"), "error"); }
  }, [newConf, createConferenceMutation, t, addToast]);

  const handleCreateSession = useCallback(async () => {
    if (!newSession.title || !expandedConf || createSessionMutation.isPending) return;
    try {
      await createSessionMutation.mutateAsync({
        title: newSession.title, titleHi: newSession.titleHi || undefined,
        sessionType: newSession.sessionType, venue: newSession.venue || undefined,
        startsAt: newSession.startsAt ? new Date(newSession.startsAt).toISOString() : undefined,
        endsAt: newSession.endsAt ? new Date(newSession.endsAt).toISOString() : undefined,
        chairpersonName: newSession.chairpersonName || undefined,
      });
      setShowCreateSession(false);
      setNewSession({ title: "", titleHi: "", sessionType: "panel", venue: "", startsAt: "", endsAt: "", chairpersonName: "" });
      addToast(t("Session created!", "सत्र बनाया गया!"), "success");
    } catch { addToast(t("Failed to create session", "सत्र बनाने में विफल"), "error"); }
  }, [newSession, expandedConf, createSessionMutation, t, addToast]);

  const handleCreateSpeaker = useCallback(async () => {
    if (!newSpeaker.name || !expandedConf || !expandedSession || createSpeakerMutation.isPending) return;
    try {
      await createSpeakerMutation.mutateAsync({
        name: newSpeaker.name, nameHi: newSpeaker.nameHi || undefined,
        bio: newSpeaker.bio || undefined, topic: newSpeaker.topic || undefined,
        affiliation: newSpeaker.affiliation || undefined,
      });
      setShowCreateSpeaker(false);
      setNewSpeaker({ name: "", nameHi: "", bio: "", topic: "", affiliation: "" });
      addToast(t("Speaker added!", "वक्ता जोड़ा गया!"), "success");
    } catch { addToast(t("Failed to add speaker", "वक्ता जोड़ने में विफल"), "error"); }
  }, [newSpeaker, expandedConf, expandedSession, createSpeakerMutation, t, addToast]);

  const handleCreateReg = useCallback(async () => {
    if (!newReg.name || !expandedConf || createRegMutation.isPending) return;
    try {
      await createRegMutation.mutateAsync({
        name: newReg.name, email: newReg.email || undefined,
        phone: newReg.phone || undefined, organization: newReg.organization || undefined,
        category: newReg.category, notes: newReg.notes || undefined,
      });
      setShowCreateRegistration(false);
      setNewReg({ name: "", email: "", phone: "", organization: "", category: "delegate", notes: "" });
      addToast(t("Registration added!", "पंजीकरण जोड़ा गया!"), "success");
    } catch { addToast(t("Failed to add registration", "पंजीकरण जोड़ने में विफल"), "error"); }
  }, [newReg, expandedConf, createRegMutation, t, addToast]);

  const handleToggleAttendance = useCallback(async (regId: string, current: boolean) => {
    try {
      await markAttendanceMutation.mutateAsync({ registrationId: regId, isAttended: !current });
    } catch { addToast(t("Failed to update attendance", "उपस्थिति अपडेट करने में विफल"), "error"); }
  }, [markAttendanceMutation, addToast, t]);

  const handleEditConf = useCallback(async () => {
    if (!editConf.id || updateConferenceMutation.isPending) return;
    try {
      await updateConferenceMutation.mutateAsync({
        id: editConf.id,
        input: {
          title: editConf.title, titleHi: editConf.titleHi || undefined,
          theme: editConf.theme || undefined,
          venue: editConf.venue || undefined, status: editConf.status,
          startsAt: editConf.startsAt ? new Date(editConf.startsAt).toISOString() : null,
          endsAt: editConf.endsAt ? new Date(editConf.endsAt).toISOString() : null,
        },
      });
      setShowEditConf(false);
      addToast(t("Conference updated!", "सम्मेलन अपडेट किया गया!"), "success");
    } catch { addToast(t("Failed to update conference", "सम्मेलन अपडेट करने में विफल"), "error"); }
  }, [editConf, updateConferenceMutation, t, addToast]);

  const handleEditSession = useCallback(async () => {
    if (!editSession.id || !expandedConf || updateSessionMutation.isPending) return;
    try {
      await updateSessionMutation.mutateAsync({
        sessionId: editSession.id,
        input: {
          title: editSession.title, titleHi: editSession.titleHi || undefined,
          sessionType: editSession.sessionType, venue: editSession.venue || undefined,
          chairpersonName: editSession.chairpersonName || undefined,
          startsAt: editSession.startsAt ? new Date(editSession.startsAt).toISOString() : null,
          endsAt: editSession.endsAt ? new Date(editSession.endsAt).toISOString() : null,
        },
      });
      setShowEditSession(false);
      addToast(t("Session updated!", "सत्र अपडेट किया गया!"), "success");
    } catch { addToast(t("Failed to update session", "सत्र अपडेट करने में विफल"), "error"); }
  }, [editSession, expandedConf, updateSessionMutation, t, addToast]);

  const handleEditSpeaker = useCallback(async () => {
    if (!editSpeaker.id || !expandedConf || !expandedSession || updateSpeakerMutation.isPending) return;
    try {
      await updateSpeakerMutation.mutateAsync({
        speakerId: editSpeaker.id,
        input: {
          name: editSpeaker.name, nameHi: editSpeaker.nameHi || undefined,
          topic: editSpeaker.topic || undefined,
          affiliation: editSpeaker.affiliation || undefined,
        },
      });
      setShowEditSpeaker(false);
      addToast(t("Speaker updated!", "वक्ता अपडेट किया गया!"), "success");
    } catch { addToast(t("Failed to update speaker", "वक्ता अपडेट करने में विफल"), "error"); }
  }, [editSpeaker, expandedConf, expandedSession, updateSpeakerMutation, t, addToast]);

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t("Conferences", "सम्मेलन")}
          </CardTitle>
          <Badge variant="outline" className="text-xs">{typedConferences.length}</Badge>
        </div>
        {permissions.canCreateConference && (
          <Button size="sm" onClick={() => setShowCreateConf(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("New Conference", "नया सम्मेलन")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("Failed to load conferences", "सम्मेलन लोड करने में विफल")}</p>
          </div>
        ) : typedConferences.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("No conferences yet.", "अभी तक कोई सम्मेलन नहीं।")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {typedConferences.map((conf) => (
              <div key={conf.id}>
                <button
                  onClick={() => setExpandedConf(expandedConf === conf.id ? null : conf.id)}
                  aria-expanded={expandedConf === conf.id}
                  className="w-full text-left p-3 rounded-lg border hover:border-primary/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedConf === conf.id ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{conf.title}</p>
                      {conf.venue && <p className="text-xs text-muted-foreground truncate flex items-center gap-1"><MapPin className="h-3 w-3" />{conf.venue}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge className={`text-[10px] ${STATUS_COLORS[conf.status] ?? ""}`}>
                      {STATUS_LABELS[conf.status]?.[lang === "hi" ? "hi" : "en"] ?? conf.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="h-3 w-3" />{conf.registrationCount}</span>
                    <span className="text-xs text-muted-foreground">{conf.sessionCount} {t("sessions", "सत्र")}</span>
                    {permissions.canManageConference && (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setEditConf({ ...conf, themeHi: "", description: "", descriptionHi: "" }); setShowEditConf(true); }} className="text-muted-foreground/60 hover:text-muted-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deleteConferenceMutation.mutate(conf.id); }} className="text-destructive/60 hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </button>

                {expandedConf === conf.id && (
                  <div className="pl-6 mt-2 space-y-3">
                    {/* Sessions */}
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("Sessions", "सत्र")}
                      </h4>
                      {permissions.canManageConferenceSessions && (
                        <Button size="sm" variant="outline" onClick={() => setShowCreateSession(true)}>
                          <Plus className="h-3 w-3 mr-1" />{t("Add Session", "सत्र जोड़ें")}
                        </Button>
                      )}
                    </div>

                    {(sessions as Session[]).length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("No sessions yet.", "अभी तक कोई सत्र नहीं।")}</p>
                    ) : (
                      <div className="space-y-1">
                        {(sessions as Session[]).map((s) => (
                          <div key={s.id}>
                            <button
                              onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                              aria-expanded={expandedSession === s.id}
                              className="w-full text-left p-2 rounded border border-dashed hover:border-primary/40 transition-colors flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {expandedSession === s.id ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                                <div className="min-w-0">
                                  <p className="text-xs font-medium">{s.title}</p>
                                  <p className="text-[10px] text-muted-foreground">{SESSION_TYPE_LABELS[s.sessionType]?.[lang === "hi" ? "hi" : "en"] ?? s.sessionType}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-muted-foreground"><Mic className="h-3 w-3 inline mr-0.5" />{s.speakerCount}</span>
                                {permissions.canManageConferenceSessions && (
                                  <>
                                    <button onClick={(e) => { e.stopPropagation(); setEditSession({ ...s, description: "", descriptionHi: "", chairpersonNameHi: "", venueHi: "" }); setShowEditSession(true); }} className="text-muted-foreground/60 hover:text-muted-foreground">
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteSessionMutation.mutate(s.id); }} className="text-destructive/60 hover:text-destructive">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </button>

                            {expandedSession === s.id && (
                              <div className="pl-4 mt-1 space-y-1">
                                {permissions.canManageConferenceSpeakers && (
                                  <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowCreateSpeaker(true)}>
                                    <Plus className="h-3 w-3 mr-1" />{t("Add Speaker", "वक्ता जोड़ें")}
                                  </Button>
                                )}
                                {(speakers as Speaker[]).length === 0 ? (
                                  <p className="text-[10px] text-muted-foreground">{t("No speakers assigned.", "कोई वक्ता निर्धारित नहीं।")}</p>
                                ) : (
                                  (speakers as Speaker[]).map((sp) => (
                                    <div key={sp.id} className="flex items-center justify-between py-1 px-2 rounded bg-muted/30 text-xs">
                                      <div>
                                        <span className="font-medium">{sp.name}</span>
                                        {sp.topic && <span className="text-muted-foreground ml-2">— {sp.topic}</span>}
                                        {sp.affiliation && <span className="text-muted-foreground ml-1">({sp.affiliation})</span>}
                                      </div>
                                      {permissions.canManageConferenceSpeakers && (
                                        <>
                                          <button onClick={() => { setEditSpeaker({ ...sp, nameHi: sp.nameHi ?? "", topicHi: "", affiliationHi: "", bio: sp.bio ?? "" }); setShowEditSpeaker(true); }} className="text-muted-foreground/60 hover:text-muted-foreground">
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button onClick={() => deleteSpeakerMutation.mutate(sp.id)} className="text-destructive/60 hover:text-destructive">
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Registrations */}
                    <div className="flex items-center justify-between mt-3">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t("Registrations", "पंजीकरण")} ({conf.registrationCount})
                      </h4>
                      {permissions.canCreateConference && (
                        <Button size="sm" variant="outline" onClick={() => setShowCreateRegistration(true)}>
                          <Plus className="h-3 w-3 mr-1" />{t("Register", "पंजीकरण")}
                        </Button>
                      )}
                    </div>

                    {(registrations as Registration[]).length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("No registrations yet.", "अभी तक कोई पंजीकरण नहीं।")}</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {(registrations as Registration[]).map((r) => (
                          <div key={r.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-xs">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={r.isAttended}
                                onCheckedChange={() => handleToggleAttendance(r.id, r.isAttended)}
                                className="h-3.5 w-3.5"
                              />
                              <span className="font-medium">{r.name}</span>
                              {r.organization && <span className="text-muted-foreground">({r.organization})</span>}
                              <Badge variant="outline" className="text-[9px]">
                                {CATEGORY_LABELS[r.category]?.[lang === "hi" ? "hi" : "en"] ?? r.category}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Conference Dialog */}
        <Dialog open={showCreateConf} onOpenChange={setShowCreateConf}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("New Conference", "नया सम्मेलन")}</DialogTitle>
              <DialogDescription>{t("Create a new conference, seminar, or symposium.", "नया सम्मेलन, संगोष्ठी या सं Symposium बनाएं।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Title (EN)", "शीर्षक (EN)")}</Label>
                  <Input value={newConf.title} onChange={(e) => setNewConf(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Title (HI)", "शीर्षक (HI)")}</Label>
                  <Input value={newConf.titleHi} onChange={(e) => setNewConf(p => ({ ...p, titleHi: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Theme", "विषय")}</Label>
                <Textarea value={newConf.theme} onChange={(e) => setNewConf(p => ({ ...p, theme: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t("Venue", "स्थान")}</Label>
                <Input value={newConf.venue} onChange={(e) => setNewConf(p => ({ ...p, venue: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Start", "आरंभ")}</Label>
                  <Input type="datetime-local" value={newConf.startsAt} onChange={(e) => setNewConf(p => ({ ...p, startsAt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("End", "समाप्ति")}</Label>
                  <Input type="datetime-local" value={newConf.endsAt} onChange={(e) => setNewConf(p => ({ ...p, endsAt: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateConf(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleCreateConf} disabled={createConferenceMutation.isPending}>{t("Create", "बनाएं")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Session Dialog */}
        <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("New Session", "नया सत्र")}</DialogTitle>
              <DialogDescription>{t("Add a session to the conference schedule.", "सम्मेलन अनुसूची में सत्र जोड़ें।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Title (EN)", "शीर्षक (EN)")}</Label>
                  <Input value={newSession.title} onChange={(e) => setNewSession(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Title (HI)", "शीर्षक (HI)")}</Label>
                  <Input value={newSession.titleHi} onChange={(e) => setNewSession(p => ({ ...p, titleHi: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Session Type", "सत्र प्रकार")}</Label>
                <Select value={newSession.sessionType} onValueChange={(v) => setNewSession(p => ({ ...p, sessionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SESSION_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{t(v.en, v.hi)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Venue", "स्थान")}</Label>
                  <Input value={newSession.venue} onChange={(e) => setNewSession(p => ({ ...p, venue: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Chairperson", "अध्यक्ष")}</Label>
                  <Input value={newSession.chairpersonName} onChange={(e) => setNewSession(p => ({ ...p, chairpersonName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Start", "आरंभ")}</Label>
                  <Input type="datetime-local" value={newSession.startsAt} onChange={(e) => setNewSession(p => ({ ...p, startsAt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("End", "समाप्ति")}</Label>
                  <Input type="datetime-local" value={newSession.endsAt} onChange={(e) => setNewSession(p => ({ ...p, endsAt: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateSession(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleCreateSession} disabled={createSessionMutation.isPending}>{t("Create", "बनाएं")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Speaker Dialog */}
        <Dialog open={showCreateSpeaker} onOpenChange={setShowCreateSpeaker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Add Speaker", "वक्ता जोड़ें")}</DialogTitle>
              <DialogDescription>{t("Add a speaker to this session.", "इस सत्र में वक्ता जोड़ें।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Name (EN)", "नाम (EN)")}</Label>
                  <Input value={newSpeaker.name} onChange={(e) => setNewSpeaker(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Name (HI)", "नाम (HI)")}</Label>
                  <Input value={newSpeaker.nameHi} onChange={(e) => setNewSpeaker(p => ({ ...p, nameHi: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Topic", "विषय")}</Label>
                <Input value={newSpeaker.topic} onChange={(e) => setNewSpeaker(p => ({ ...p, topic: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Affiliation", "संबद्धता")}</Label>
                <Input value={newSpeaker.affiliation} onChange={(e) => setNewSpeaker(p => ({ ...p, affiliation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Bio", "जीवनी")}</Label>
                <Textarea value={newSpeaker.bio} onChange={(e) => setNewSpeaker(p => ({ ...p, bio: e.target.value }))} rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateSpeaker(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleCreateSpeaker} disabled={createSpeakerMutation.isPending}>{t("Add", "जोड़ें")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Registration Dialog */}
        <Dialog open={showCreateRegistration} onOpenChange={setShowCreateRegistration}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("New Registration", "नया पंजीकरण")}</DialogTitle>
              <DialogDescription>{t("Register a participant for this conference.", "इस सम्मेलन में प्रतिभागी पंजीकृत करें।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("Name", "नाम")}</Label>
                <Input value={newReg.name} onChange={(e) => setNewReg(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Email", "ईमेल")}</Label>
                  <Input value={newReg.email} onChange={(e) => setNewReg(p => ({ ...p, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Phone", "फ़ोन")}</Label>
                  <Input value={newReg.phone} onChange={(e) => setNewReg(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Organization", "संगठन")}</Label>
                  <Input value={newReg.organization} onChange={(e) => setNewReg(p => ({ ...p, organization: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Category", "श्रेणी")}</Label>
                  <Select value={newReg.category} onValueChange={(v) => setNewReg(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{t(v.en, v.hi)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateRegistration(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleCreateReg} disabled={createRegMutation.isPending}>{t("Register", "पंजीकरण")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Conference Dialog */}
        <Dialog open={showEditConf} onOpenChange={setShowEditConf}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Edit Conference", "सम्मेलन संपादित करें")}</DialogTitle>
              <DialogDescription>{t("Update conference details and status.", "सम्मेलन विवरण और स्थिति अपडेट करें।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Title (EN)", "शीर्षक (EN)")}</Label>
                  <Input value={editConf.title} onChange={(e) => setEditConf(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Title (HI)", "शीर्षक (HI)")}</Label>
                  <Input value={editConf.titleHi ?? ""} onChange={(e) => setEditConf(p => ({ ...p, titleHi: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Theme", "विषय")}</Label>
                <Textarea value={editConf.theme ?? ""} onChange={(e) => setEditConf(p => ({ ...p, theme: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>{t("Venue", "स्थान")}</Label>
                <Input value={editConf.venue ?? ""} onChange={(e) => setEditConf(p => ({ ...p, venue: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Status", "स्थिति")}</Label>
                <Select value={editConf.status} onValueChange={(v) => setEditConf(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{t(v.en, v.hi)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Start", "आरंभ")}</Label>
                  <Input type="datetime-local" value={editConf.startsAt?.slice(0, 16) ?? ""} onChange={(e) => setEditConf(p => ({ ...p, startsAt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("End", "समाप्ति")}</Label>
                  <Input type="datetime-local" value={editConf.endsAt?.slice(0, 16) ?? ""} onChange={(e) => setEditConf(p => ({ ...p, endsAt: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditConf(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleEditConf} disabled={updateConferenceMutation.isPending}>{t("Save", "सहेजें")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Session Dialog */}
        <Dialog open={showEditSession} onOpenChange={setShowEditSession}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Edit Session", "सत्र संपादित करें")}</DialogTitle>
              <DialogDescription>{t("Update session details.", "सत्र विवरण अपडेट करें।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Title (EN)", "शीर्षक (EN)")}</Label>
                  <Input value={editSession.title} onChange={(e) => setEditSession(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Title (HI)", "शीर्षक (HI)")}</Label>
                  <Input value={editSession.titleHi ?? ""} onChange={(e) => setEditSession(p => ({ ...p, titleHi: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Session Type", "सत्र प्रकार")}</Label>
                <Select value={editSession.sessionType} onValueChange={(v) => setEditSession(p => ({ ...p, sessionType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SESSION_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{t(v.en, v.hi)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Venue", "स्थान")}</Label>
                  <Input value={editSession.venue ?? ""} onChange={(e) => setEditSession(p => ({ ...p, venue: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Chairperson", "अध्यक्ष")}</Label>
                  <Input value={editSession.chairpersonName ?? ""} onChange={(e) => setEditSession(p => ({ ...p, chairpersonName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Start", "आरंभ")}</Label>
                  <Input type="datetime-local" value={editSession.startsAt?.slice(0, 16) ?? ""} onChange={(e) => setEditSession(p => ({ ...p, startsAt: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("End", "समाप्ति")}</Label>
                  <Input type="datetime-local" value={editSession.endsAt?.slice(0, 16) ?? ""} onChange={(e) => setEditSession(p => ({ ...p, endsAt: e.target.value }))} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditSession(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleEditSession} disabled={updateSessionMutation.isPending}>{t("Save", "सहेजें")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Speaker Dialog */}
        <Dialog open={showEditSpeaker} onOpenChange={setShowEditSpeaker}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Edit Speaker", "वक्ता संपादित करें")}</DialogTitle>
              <DialogDescription>{t("Update speaker details.", "वक्ता विवरण अपडेट करें।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Name (EN)", "नाम (EN)")}</Label>
                  <Input value={editSpeaker.name} onChange={(e) => setEditSpeaker(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Name (HI)", "नाम (HI)")}</Label>
                  <Input value={editSpeaker.nameHi ?? ""} onChange={(e) => setEditSpeaker(p => ({ ...p, nameHi: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Topic", "विषय")}</Label>
                <Input value={editSpeaker.topic ?? ""} onChange={(e) => setEditSpeaker(p => ({ ...p, topic: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Affiliation", "संबद्धता")}</Label>
                <Input value={editSpeaker.affiliation ?? ""} onChange={(e) => setEditSpeaker(p => ({ ...p, affiliation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>{t("Bio", "जीवनी")}</Label>
                <Textarea value={editSpeaker.bio ?? ""} onChange={(e) => setEditSpeaker(p => ({ ...p, bio: e.target.value }))} rows={2} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditSpeaker(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleEditSpeaker} disabled={updateSpeakerMutation.isPending}>{t("Save", "सहेजें")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
