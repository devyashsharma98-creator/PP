"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { useSurvey, useSubmitSurvey } from "@/hooks/api/use-surveys";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

interface Question {
  id: string;
  questionKey: string;
  label: string;
  labelHi?: string | null;
  questionType: string;
  isRequired: boolean;
  displayOrder: number;
  options?: string[] | null;
}

export function SurveyFillForm({ surveyId }: { surveyId: string }) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();

  const { data: survey, isLoading, isError } = useSurvey(surveyId);
  const submitMutation = useSubmitSurvey(surveyId);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const setAnswer = useCallback((key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleMulti = useCallback((key: string, option: string) => {
    setAnswers((prev) => {
      const current = prev[key] ? prev[key].split(",").map((s) => s.trim()).filter(Boolean) : [];
      const next = current.includes(option) ? current.filter((v) => v !== option) : [...current, option];
      return { ...prev, [key]: next.join(", ") };
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!survey || submitMutation.isPending) return;
    const missingRequired = (survey.questions as Question[]).filter(
      (q) => q.isRequired && !answers[q.questionKey]?.trim()
    );
    if (missingRequired.length > 0) {
      addToast(
        t("Please answer all required questions.", "कृपया सभी आवश्यक प्रश्नों के उत्तर दें।"),
        "error"
      );
      return;
    }
    try {
      await submitMutation.mutateAsync({
        respondentName: respondentName.trim() || undefined,
        respondentEmail: respondentEmail.trim() || undefined,
        answers: Object.entries(answers).map(([questionKey, value]) => ({ questionKey, value })),
      });
      setSubmitted(true);
    } catch {
      addToast(t("Failed to submit response.", "प्रतिक्रिया सबमिट करने में विफल।"), "error");
    }
  }, [survey, answers, respondentName, respondentEmail, submitMutation, addToast, t]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError || !survey) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center text-destructive">
        <FileText className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">{t("Survey not found or unavailable.", "सर्वेक्षण नहीं मिला या उपलब्ध नहीं।")}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/surveys"><ArrowLeft className="h-4 w-4 mr-1" />{t("Back to surveys", "सर्वेक्षण सूची")}</Link>
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold">{t("Response submitted!", "प्रतिक्रिया सबमिट हो गई!")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("Thank you for completing this survey.", "इस सर्वेक्षण को पूरा करने के लिए धन्यवाद।")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/surveys"><ArrowLeft className="h-4 w-4 mr-1" />{t("Back to surveys", "सर्वेक्षण सूची")}</Link>
        </Button>
      </div>
    );
  }

  const questions = (survey.questions ?? []) as Question[];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="px-0 text-muted-foreground">
            <Link href="/surveys"><ArrowLeft className="h-4 w-4 mr-1" />{t("Surveys", "सर्वेक्षण")}</Link>
          </Button>
        </div>
        <h1 className="text-2xl font-bold">
          {isHi && survey.titleHi ? survey.titleHi : survey.title}
        </h1>
        {survey.description && (
          <p className="text-sm text-muted-foreground">{survey.description}</p>
        )}
        <Badge variant={survey.status === "published" ? "default" : "secondary"} className="text-xs">
          {survey.status}
        </Badge>
      </div>

      {survey.status !== "published" && (
        <Card className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-3 px-4 text-sm text-amber-700 dark:text-amber-400">
            {t("This survey is not currently accepting responses.", "यह सर्वेक्षण अभी प्रतिक्रियाएँ स्वीकार नहीं कर रहा है।")}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("Your details (optional)", "आपकी जानकारी (वैकल्पिक)")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Name", "नाम")}</Label>
            <Input
              value={respondentName}
              onChange={(e) => setRespondentName(e.target.value)}
              placeholder={t("Your name", "आपका नाम")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("Email", "ईमेल")}</Label>
            <Input
              type="email"
              value={respondentEmail}
              onChange={(e) => setRespondentEmail(e.target.value)}
              placeholder={t("Your email", "आपका ईमेल")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const label = isHi && q.labelHi ? q.labelHi : q.label;
          const val = answers[q.questionKey] ?? "";
          const opts = q.options ?? [];
          const selectedMulti = val ? val.split(",").map((s) => s.trim()).filter(Boolean) : [];

          return (
            <Card key={q.id}>
              <CardContent className="pt-4 pb-5 space-y-2">
                <Label className="text-sm font-medium">
                  {idx + 1}. {label}
                  {q.isRequired && <span className="text-destructive ml-1">*</span>}
                </Label>

                {(q.questionType === "text" || q.questionType === "email" || q.questionType === "number" || q.questionType === "date") && (
                  <Input
                    type={q.questionType === "number" ? "number" : q.questionType === "date" ? "date" : q.questionType === "email" ? "email" : "text"}
                    value={val}
                    onChange={(e) => setAnswer(q.questionKey, e.target.value)}
                    placeholder={t("Your answer", "आपका उत्तर")}
                  />
                )}

                {q.questionType === "textarea" && (
                  <Textarea
                    value={val}
                    onChange={(e) => setAnswer(q.questionKey, e.target.value)}
                    rows={3}
                    placeholder={t("Your answer", "आपका उत्तर")}
                  />
                )}

                {q.questionType === "yesno" && (
                  <div className="flex gap-3">
                    {["Yes", "No"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswer(q.questionKey, opt)}
                        className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          val === opt ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted border-border"
                        }`}
                      >
                        {opt === "Yes" ? t("Yes", "हाँ") : t("No", "नहीं")}
                      </button>
                    ))}
                  </div>
                )}

                {(q.questionType === "select") && (
                  <div className="flex flex-wrap gap-2">
                    {opts.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAnswer(q.questionKey, opt)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          val === opt ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted border-border"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {(q.questionType === "multiselect" || q.questionType === "checkbox_group") && (
                  <div className="flex flex-wrap gap-2">
                    {opts.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => toggleMulti(q.questionKey, opt)}
                        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                          selectedMulti.includes(opt) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted border-border"
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {q.questionType === "radio_group" && (
                  <div className="space-y-2">
                    {opts.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name={q.questionKey}
                          checked={val === opt}
                          onChange={() => setAnswer(q.questionKey, opt)}
                          className="accent-primary"
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}

                {q.questionType === "rating" && (
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setAnswer(q.questionKey, String(n))}
                        className={`w-10 h-10 rounded-lg border text-sm font-bold transition-colors ${
                          val === String(n) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted border-border"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {survey.status === "published" && (
        <div className="flex justify-end pt-2">
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {submitMutation.isPending ? t("Submitting…", "सबमिट हो रहा है…") : t("Submit Response", "प्रतिक्रिया सबमिट करें")}
          </Button>
        </div>
      )}
    </div>
  );
}
