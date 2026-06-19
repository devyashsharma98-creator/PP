"use client";

import { useState, useCallback } from "react";
import { FileText, Plus, Trash2, ChevronDown, ChevronRight, CheckCircle2, Globe, Lock, Eye } from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useSurveys, useCreateSurvey, useDeleteSurvey, useSurvey, useUpdateSurvey, useSurveyResponses } from "@/hooks/api/use-surveys";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STATUS_LABELS: Record<string, { en: string; hi: string }> = {
  draft: { en: "Draft", hi: "प्रारूप" },
  published: { en: "Published", hi: "प्रकाशित" },
  closed: { en: "Closed", hi: "बंद" },
  archived: { en: "Archived", hi: "संग्रहीत" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  closed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  archived: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
};

interface SurveyRow {
  id: string; title: string; titleHi?: string | null; status: string;
  isPublic: boolean; questionCount: number; responseCount: number; createdAt: string;
}

export function SurveysPanel() {
  const { permissions, lang } = useAppContext();
  const t = useT();
  const { addToast } = useToast();

  const { data, isLoading, isError } = useSurveys();
  const surveys = (data?.rows ?? []) as SurveyRow[];
  const createMutation = useCreateSurvey();
  const deleteMutation = useDeleteSurvey();
  const updateMutation = useUpdateSurvey();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [newSurvey, setNewSurvey] = useState({
    title: "", titleHi: "", description: "", isPublic: false,
    questions: [] as Array<{ questionKey: string; label: string; labelHi: string; questionType: string; isRequired: boolean; displayOrder: number; options: string[] }>,
  });

  const { data: surveyDetail } = useSurvey(expandedId ?? "");
  const { data: responsesData } = useSurveyResponses(expandedId ?? "");
  const responses = responsesData?.rows ?? [];

  const handleCreate = useCallback(async () => {
    if (!newSurvey.title.trim() || createMutation.isPending) return;
    try {
      await createMutation.mutateAsync({
        title: newSurvey.title.trim(),
        titleHi: newSurvey.titleHi.trim() || undefined,
        description: newSurvey.description.trim() || undefined,
        isPublic: newSurvey.isPublic,
        questions: newSurvey.questions.map((q, i) => ({
          ...q,
          displayOrder: i,
          options: q.options.length > 0 ? q.options : undefined,
        })),
      });
      setShowCreate(false);
      setNewSurvey({ title: "", titleHi: "", description: "", isPublic: false, questions: [] });
      addToast(t("Survey created!", "सर्वेक्षण बनाया गया!"), "success");
    } catch { addToast(t("Failed to create survey", "सर्वेक्षण बनाने में विफल"), "error"); }
  }, [newSurvey, createMutation, t, addToast]);

  const handlePublish = useCallback(async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, input: { status: "published" } });
      addToast(t("Survey published!", "सर्वेक्षण प्रकाशित!"), "success");
    } catch { addToast(t("Failed to publish survey", "प्रकाशित करने में विफल"), "error"); }
  }, [updateMutation, addToast, t]);

  const handleClose = useCallback(async (id: string) => {
    try {
      await updateMutation.mutateAsync({ id, input: { status: "closed" } });
      addToast(t("Survey closed!", "सर्वेक्षण बंद!"), "success");
    } catch { addToast(t("Failed to close survey", "बंद करने में विफल"), "error"); }
  }, [updateMutation, addToast, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      if (expandedId === id) setExpandedId(null);
    } catch { addToast(t("Failed to delete survey", "हटाने में विफल"), "error"); }
  }, [deleteMutation, expandedId, addToast, t]);

  const addQuestion = () => {
    setNewSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, { questionKey: `q${prev.questions.length + 1}`, label: "", labelHi: "", questionType: "text", isRequired: false, displayOrder: prev.questions.length, options: [] }],
    }));
  };

  const updateQuestion = (index: number, field: string, value: unknown) => {
    setNewSurvey((prev) => {
      const qs = [...prev.questions];
      qs[index] = { ...qs[index], [field]: value };
      return { ...prev, questions: qs };
    });
  };

  const removeQuestion = (index: number) => {
    setNewSurvey((prev) => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }));
  };

  return (
    <Card id="surveys" className="mt-6 scroll-mt-24">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t("Forms & Surveys", "फ़ॉर्म और सर्वेक्षण")}
          </CardTitle>
          <Badge variant="outline" className="text-xs">{data?.total ?? 0}</Badge>
        </div>
        {permissions.canCreateSurvey && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            {t("New Survey", "नया सर्वेक्षण")}
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
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("Failed to load surveys", "सर्वेक्षण लोड करने में विफल")}</p>
          </div>
        ) : surveys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("No surveys yet.", "अभी तक कोई सर्वेक्षण नहीं।")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {surveys.map((s) => (
              <div key={s.id}>
                <div
                  onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedId(expandedId === s.id ? null : s.id); } }}
                  aria-expanded={expandedId === s.id}
                  className="w-full text-left p-3 rounded-lg border hover:border-primary/50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {expandedId === s.id ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">{s.questionCount} {t("questions", "प्रश्न")} · {s.responseCount} {t("responses", "प्रतिक्रियाएँ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    {s.isPublic ? <Globe className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-muted-foreground" />}
                    <Badge className={`text-[10px] ${STATUS_COLORS[s.status] ?? ""}`}>
                      {STATUS_LABELS[s.status]?.[lang === "hi" ? "hi" : "en"] ?? s.status}
                    </Badge>
                    {permissions.canManageSurvey && (
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="text-destructive/60 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                    </div>

                {expandedId === s.id && (
                  <div className="pl-6 mt-2 space-y-3">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList>
                        <TabsTrigger value="overview">{t("Overview", "अवलोकन")}</TabsTrigger>
                        <TabsTrigger value="responses">{t("Responses", "प्रतिक्रियाएँ")} ({s.responseCount})</TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="mt-3">
                        {surveyDetail && (
                          <div className="space-y-3">
                            {surveyDetail.description && (
                              <p className="text-sm text-muted-foreground">{surveyDetail.description}</p>
                            )}
                            <div className="space-y-1">
                              {surveyDetail.questions.map((q) => (
                                <div key={q.id} className="flex items-center gap-2 py-1 text-xs">
                                  {q.isRequired && <span className="text-destructive">*</span>}
                                  <span className="font-medium">{q.label}</span>
                                  <Badge variant="outline" className="text-[9px]">{q.questionType}</Badge>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2 pt-2">
                              {s.status === "draft" && (
                                <Button size="sm" onClick={() => handlePublish(s.id)}>
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                  {t("Publish", "प्रकाशित करें")}
                                </Button>
                              )}
                              {s.status === "published" && (
                                <Button size="sm" variant="outline" onClick={() => handleClose(s.id)}>
                                  {t("Close", "बंद करें")}
                                </Button>
                              )}
                              <Button size="sm" variant="outline" asChild>
                                <a href={`/form/${s.id}`} target="_blank">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  {t("Preview", "पूर्वावलोकन")}
                                </a>
                              </Button>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="responses" className="mt-3">
                        {responses.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">{t("No responses yet.", "अभी तक कोई प्रतिक्रिया नहीं।")}</p>
                        ) : (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {responses.map((r: { id: string; respondentName?: string | null; respondentEmail?: string | null; submittedAt: string; answers: Array<{ questionKey: string; value?: string | null }> }) => (
                              <div key={r.id} className="p-2 rounded bg-muted/30 text-xs space-y-1">
                                <div className="flex justify-between text-muted-foreground">
                                  <span>{r.respondentName ?? t("Anonymous", "अज्ञात")}</span>
                                  <span>{new Date(r.submittedAt).toLocaleDateString()}</span>
                                </div>
                                {r.answers.map((a) => (
                                  <div key={a.questionKey} className="flex gap-2">
                                    <span className="font-medium shrink-0">{a.questionKey}:</span>
                                    <span className="text-muted-foreground break-words">{a.value ?? "-"}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create Survey Dialog */}
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogContent className="max-h-[85dvh] overflow-y-auto max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("New Survey", "नया सर्वेक्षण")}</DialogTitle>
              <DialogDescription>{t("Create a form or survey to collect responses.", "प्रतिक्रिया एकत्र करने के लिए फ़ॉर्म या सर्वेक्षण बनाएं।")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Title (EN)", "शीर्षक (EN)")}</Label>
                  <Input value={newSurvey.title} onChange={(e) => setNewSurvey(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Title (HI)", "शीर्षक (HI)")}</Label>
                  <Input value={newSurvey.titleHi} onChange={(e) => setNewSurvey(p => ({ ...p, titleHi: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("Description", "विवरण")}</Label>
                <Textarea value={newSurvey.description} onChange={(e) => setNewSurvey(p => ({ ...p, description: e.target.value }))} rows={2} />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={newSurvey.isPublic} onCheckedChange={(v) => setNewSurvey(p => ({ ...p, isPublic: v }))} />
                <Label className="text-sm">{t("Public (accessible without login)", "सार्वजनिक (बिना लॉगिन के सुलभ)")}</Label>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{t("Questions", "प्रश्न")}</Label>
                  <Button size="sm" variant="outline" onClick={addQuestion} type="button">
                    <Plus className="h-3 w-3 mr-1" />{t("Add Question", "प्रश्न जोड़ें")}
                  </Button>
                </div>
                {newSurvey.questions.map((q, i) => (
                  <div key={i} className="p-3 rounded border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{t("Question", "प्रश्न")} {i + 1}</span>
                      <button onClick={() => removeQuestion(i)} className="text-destructive/60 hover:text-destructive text-xs">{t("Remove", "हटाएँ")}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder={t("Label (EN)", "लेबल (EN)")}
                        value={q.label} onChange={(e) => updateQuestion(i, "label", e.target.value)}
                        className="text-xs"
                      />
                      <Input
                        placeholder={t("Label (HI)", "लेबल (HI)")}
                        value={q.labelHi} onChange={(e) => updateQuestion(i, "labelHi", e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={q.questionType} onValueChange={(v) => updateQuestion(i, "questionType", v)}>
                        <SelectTrigger className="text-xs h-7"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">{t("Text", "पाठ")}</SelectItem>
                          <SelectItem value="textarea">{t("Long Text", "लंबा पाठ")}</SelectItem>
                          <SelectItem value="number">{t("Number", "संख्या")}</SelectItem>
                          <SelectItem value="email">{t("Email", "ईमेल")}</SelectItem>
                          <SelectItem value="yesno">{t("Yes/No", "हाँ/नहीं")}</SelectItem>
                          <SelectItem value="select">{t("Dropdown", "ड्रॉपडाउन")}</SelectItem>
                          <SelectItem value="multiselect">{t("Multi Select", "बहु विकल्प")}</SelectItem>
                          <SelectItem value="checkbox_group">{t("Checkboxes", "चेकबॉक्स")}</SelectItem>
                          <SelectItem value="radio_group">{t("Radio Buttons", "रेडियो बटन")}</SelectItem>
                          <SelectItem value="rating">{t("Rating", "रेटिंग")}</SelectItem>
                          <SelectItem value="date">{t("Date", "दिनांक")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <Label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={q.isRequired} onChange={(e) => updateQuestion(i, "isRequired", e.target.checked)} />
                        {t("Required", "आवश्यक")}
                      </Label>
                    </div>
                    {(q.questionType === "select" || q.questionType === "multiselect" || q.questionType === "checkbox_group" || q.questionType === "radio_group") && (
                      <Input
                        placeholder={t("Options (comma separated)", "विकल्प (अल्पविराम से अलग)")}
                        value={q.options.join(", ")}
                        onChange={(e) => updateQuestion(i, "options", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                        className="text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreate(false)}>{t("Cancel", "रद्द करें")}</Button>
                <Button onClick={handleCreate} disabled={!newSurvey.title.trim() || createMutation.isPending}>{t("Create", "बनाएं")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
