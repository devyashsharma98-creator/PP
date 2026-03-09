"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useToast } from '@/components/ToastProvider';
import { useT } from '@/lib/useT';
import type { AalekhaArticle, ArticleStatus } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PenLine, CheckCircle2, Clock, ArrowRight, Eye, BarChart3,
  Users, BookOpen, ExternalLink, X, ChevronDown, ChevronRight,
  RotateCcw, Send, FileText, AlertTriangle,
} from "lucide-react";

const statusColors: Record<ArticleStatus, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  "Pending Unit Head Review": "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  "Pending Aayam Review": "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  Published: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
};

const statusHi: Record<ArticleStatus, string> = {
  Draft: "प्रारूप",
  "Pending Unit Head Review": "यूनिट समीक्षा प्रतीक्षित",
  "Pending Aayam Review": "आयाम समीक्षा प्रतीक्षित",
  Published: "प्रकाशित",
};

const categories = ["Shodh", "Vimarsh", "Yuva", "Mahila", "Prachar", "Aalekh"];

const valuesItems = [
  { key: "rashtraPratham" as const, label: "राष्ट्र प्रथम", sublabel: "Rashtra Pratham — Nation First", sublabelHi: "राष्ट्र सर्वोपरि" },
  { key: "culturallyGrounded" as const, label: "सांस्कृतिक आधार", sublabel: "Culturally Grounded in Indian tradition", sublabelHi: "भारतीय परंपरा में आधारित" },
  { key: "balancedTone" as const, label: "संतुलित स्वर", sublabel: "Balanced Tone — no extreme language", sublabelHi: "संतुलित भाषा — कोई चरम शब्द नहीं" },
  { key: "noDivisiveContent" as const, label: "अविभाजनकारी नहीं", sublabel: "No divisive or inflammatory content", sublabelHi: "कोई विभाजनकारी सामग्री नहीं" },
];

const emptyValues = { rashtraPratham: false, culturallyGrounded: false, balancedTone: false, noDivisiveContent: false };
const emptyForm = { title: "", content: "", summary: "", category: "Shodh", socialUrl: "", documentUrl: "", valuesChecklist: emptyValues };

type AalekhContextItem = {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
};

function AalekhMasthead({
  t,
  sealEn,
  sealHi,
  titleEn,
  titleHi,
  descriptionEn,
  descriptionHi,
  contexts,
  action,
}: {
  t: (en: string, hi: string) => string;
  sealEn: string;
  sealHi: string;
  titleEn: string;
  titleHi: string;
  descriptionEn: string;
  descriptionHi: string;
  contexts: AalekhContextItem[];
  action?: React.ReactNode;
}) {
  return (
    <div className="aalekh-masthead space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="section-seal">{t(sealEn, sealHi)}</p>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{t(titleEn, titleHi)}</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {t(descriptionEn, descriptionHi)}
            </p>
          </div>
        </div>
        {action ? <div className="lg:pb-1">{action}</div> : null}
      </div>

      <div className="aalekh-context-grid">
        {contexts.map((context) => (
          <div key={context.labelEn} className="aalekh-context-card">
            <p className="shell-copy">{t(context.labelEn, context.labelHi)}</p>
            <p className="aalekh-context-value">{t(context.valueEn, context.valueHi ?? context.valueEn)}</p>
            <p className="aalekh-context-detail">{t(context.detailEn, context.detailHi)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Article Card (expandable) ───────────────────────────────────────────────
function ArticleCard({
  article,
  actions,
}: {
  article: AalekhaArticle;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { lang } = useAppContext();
  const t = useT();

  return (
    <Card className="aalekh-article-card overflow-hidden">
      <button className="w-full text-left" onClick={() => setOpen(o => !o)}>
        <CardContent className="py-4 px-4 flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] border ${statusColors[article.status]}`}>
                {lang === 'hi' ? statusHi[article.status] : article.status}
              </Badge>
              <Badge variant="outline" className="text-[10px]">{article.category}</Badge>
            </div>
            <h3 className="font-medium text-sm leading-snug">{article.title}</h3>
            <p className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
              <BookOpen className="w-3 h-3 shrink-0" />{article.author}
              <span className="opacity-50">·</span>{article.date}
              {article.socialUrl && (
                <a
                  href={article.socialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-0.5 text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> {t('Source', 'स्रोत')}
                </a>
              )}
              {article.documentUrl && (
                <a
                  href={article.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-0.5 text-primary hover:underline"
                >
                  <FileText className="w-3 h-3" /> {t('Document', 'दस्तावेज़')}
                </a>
              )}
            </p>
            <p className="aalekh-article-summary">{article.summary}</p>
          </div>
          {open
            ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
            : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />}
        </CardContent>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="aalekh-article-detail-surface">
              {/* Reviewer feedback callout */}
              {article.status === "Draft" && article.latestReviewNotes && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 font-devanagari">{t('Reviewer Notes', 'समीक्षक टिप्पणी')}</p>
                    <p className="text-xs text-amber-800 dark:text-amber-200 mt-0.5 whitespace-pre-wrap">{article.latestReviewNotes}</p>
                  </div>
                </div>
              )}
              <p className="shell-copy">{t("Article body", "आलेख पाठ")}</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{article.content}</p>
              {/* Values checklist display */}
              <div className="space-y-2">
                <p className="shell-copy">{t("Editorial values", "संपादकीय मूल्य")}</p>
                <div className="flex flex-wrap gap-2">
                  {valuesItems.map(v => (
                    <span
                      key={v.key}
                      className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-devanagari ${article.valuesChecklist[v.key] ? "border-green-500/40 text-green-700 dark:text-green-400 bg-green-500/10" : "border-red-500/40 text-red-600 bg-red-500/10"}`}
                    >
                      {article.valuesChecklist[v.key] ? "✓" : "✗"} {v.label}
                    </span>
                  ))}
                </div>
              </div>
              {actions && <div className="border-t border-border/50 pt-3">{actions}</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Write Article Form ───────────────────────────────────────────────────────
function WriteArticleDialog({ onSubmit }: { onSubmit: (form: typeof emptyForm) => Promise<boolean> }) {
  const t = useT();
  const { lang } = useAppContext();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const allValuesChecked = Object.values(form.valuesChecklist).every(Boolean);

  // O(n) word count — split on whitespace, filter empty
  const contentStats = useMemo(() => {
    const text = form.content.trim();
    const chars = text.length;
    const words = chars === 0 ? 0 : text.split(/\s+/).length;
    const readMin = Math.max(1, Math.ceil(words / 200));
    return { chars, words, readMin };
  }, [form.content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || !allValuesChecked) return;
    const ok = await onSubmit(form);
    if (!ok) return;
    setForm(emptyForm);
    setOpen(false);
  };

  const toggleValue = (key: keyof typeof emptyValues) =>
    setForm(p => ({ ...p, valuesChecklist: { ...p.valuesChecklist, [key]: !p.valuesChecklist[key] } }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PenLine className="w-4 h-4 mr-2" /> {t("Write New Article", "नया आलेख लिखें")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-popover max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("New Aalekh", "नया आलेख")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{t("Title", "शीर्षक")}</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder={t("Article title (Hindi or English)", "आलेख का शीर्षक (हिन्दी या अंग्रेज़ी)")} required />
          </div>
          <div>
            <Label>{t("Category", "श्रेणी")}</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("Content (Full Article)", "सामग्री (पूर्ण आलेख)")}</Label>
            <Textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value, summary: e.target.value.slice(0, 150) }))}
              placeholder={t("Write your full article here...", "यहाँ अपना पूर्ण आलेख लिखें...")}
              rows={6}
              required
            />
            {/* Live writing stats — O(n) */}
            <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="font-mono font-semibold text-foreground/70">{contentStats.words}</span> {t('words', 'शब्द')}
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                <span className="font-mono font-semibold text-foreground/70">{contentStats.chars}</span> {t('chars', 'अक्षर')}
              </span>
              <span className="opacity-40">·</span>
              <span className="flex items-center gap-1">
                ~<span className="font-mono font-semibold text-foreground/70">{contentStats.readMin}</span> {t('min read', 'मिनट पठन')}
              </span>
            </div>
          </div>
          <div>
            <Label>{t("Summary", "सारांश")} <span className="text-muted-foreground text-xs">({t("auto-filled, editable", "स्वतः भरा, संपादन योग्य")})</span></Label>
            <Textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={2} placeholder={t("Short excerpt for the feed...", "फ़ीड के लिए संक्षिप्त विवरण...")} />
          </div>
          <div>
            <Label>{t("Social Media URL", "सोशल मीडिया लिंक")} <span className="text-muted-foreground text-xs">({t("optional", "वैकल्पिक")})</span></Label>
            <Input value={form.socialUrl} onChange={e => setForm(p => ({ ...p, socialUrl: e.target.value }))} placeholder="https://facebook.com/..." type="url" />
          </div>
          <div>
            <Label>{t("Document URL", "दस्तावेज़ लिंक")} <span className="text-muted-foreground text-xs">({t("optional — Google Doc, PDF etc.", "वैकल्पिक — Google Doc, PDF आदि")})</span></Label>
            <Input value={form.documentUrl} onChange={e => setForm(p => ({ ...p, documentUrl: e.target.value }))} placeholder="https://docs.google.com/..." type="url" />
          </div>

          {/* Values Checklist */}
          <div className="aalekh-values-panel">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground/80 font-devanagari">
                {t('Editorial Maryada Check', 'संपादकीय मर्यादा जांच')} <span className="text-muted-foreground font-normal">({t('all required to submit', 'सभी अनिवार्य')})</span>
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {t('Affirm the institutional values before this aalekh enters the review pipeline.', 'इस आलेख को समीक्षा पंक्ति में भेजने से पहले संस्थागत मूल्यों की पुष्टि करें।')}
              </p>
            </div>
            {valuesItems.map(v => (
              <div key={v.key} className="aalekh-values-item">
                <Checkbox
                  id={v.key}
                  checked={form.valuesChecklist[v.key]}
                  onCheckedChange={() => toggleValue(v.key)}
                  className="mt-0.5"
                />
                <Label htmlFor={v.key} className="text-sm cursor-pointer leading-snug">
                  <span className="font-medium font-devanagari">{v.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{lang === 'hi' ? v.sublabelHi : v.sublabel}</span>
                </Label>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={!allValuesChecked}>
            <Send className="w-4 h-4 mr-2" />
            {allValuesChecked ? t("Submit for Unit Head Review", "यूनिट प्रमुख समीक्षा के लिए भेजें") : t("Check all values to submit", "सभी मूल्यों की जांच करें")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit & Forward Dialog ────────────────────────────────────────────────────
function EditForwardDialog({
  article,
  targetStatus,
  actionLabel,
  showReviewNotes,
  onDone,
}: {
  article: AalekhaArticle;
  targetStatus: ArticleStatus;
  actionLabel: string;
  showReviewNotes?: boolean;
  onDone: (edits: Partial<Pick<AalekhaArticle, "title" | "content" | "summary">>, reviewNotes?: string) => Promise<boolean>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [summary, setSummary] = useState(article.summary);
  const [reviewNotes, setReviewNotes] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 text-xs">
          <CheckCircle2 className="w-3 h-3 mr-1" /> {actionLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-popover max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground font-devanagari">{t('Review and optionally edit before forwarding.', 'आगे भेजने से पहले समीक्षा करें और आवश्यकतानुसार संपादित करें।')}</p>
          <div>
            <Label>{t('Title', 'शीर्षक')}</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>{t('Summary', 'सारांश')}</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>{t('Content', 'सामग्री')}</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} />
          </div>
          {showReviewNotes && (
            <div>
              <Label className="font-devanagari">{t('Review Notes for Writer', 'लेखक के लिए समीक्षा टिप्पणी')} <span className="text-muted-foreground text-xs font-normal">({t('optional', 'वैकल्पिक')})</span></Label>
              <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={2} placeholder={t('Add feedback for the writer...', 'लेखक के लिए सुझाव लिखें...')} />
            </div>
          )}
          <Button
            className="w-full"
            onClick={async () => {
              const ok = await onDone({ title, content, summary }, reviewNotes.trim() || undefined);
              if (!ok) return;
              setOpen(false);
            }}
          >
            <ArrowRight className="w-4 h-4 mr-2" /> {t('Confirm & Forward', 'पुष्टि करें और आगे भेजें')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Return with Review Notes Dialog ──────────────────────────────────────────
function ReturnWithNotesDialog({
  articleId,
  onReturn,
}: {
  articleId: string;
  onReturn: (reviewNotes?: string) => Promise<void>;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
        >
          <RotateCcw className="w-3 h-3 mr-1" /> {t('Return to Writer', 'लेखक को वापस करें')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-popover">
        <DialogHeader>
          <DialogTitle className="font-devanagari">{t('Return Article for Revision', 'आलेख संशोधन के लिए वापस करें')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="font-devanagari">{t('Review Notes', 'समीक्षा टिप्पणी')} <span className="text-muted-foreground text-xs font-normal">({t('recommended', 'अनुशंसित')})</span></Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder={t('Tell the writer what to improve...', 'लेखक को बताएं कि क्या सुधारना है...')}
              autoFocus
            />
          </div>
          <Button
            className="w-full"
            variant="destructive"
            onClick={async () => {
              await onReturn(notes.trim() || undefined);
              setOpen(false);
              setNotes('');
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> {t('Confirm Return', 'वापसी की पुष्टि करें')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Aalekh() {
  const { role, articles, addArticle, updateArticleStatus } = useAppContext();
  const { addToast } = useToast();
  const t = useT();
  const [lastPublished, setLastPublished] = useState<string | null>(null);

  const handleSubmit = async (form: typeof emptyForm) => {
    const ok = await addArticle({
      title: form.title,
      content: form.content,
      summary: form.summary || form.content.slice(0, 150),
      author: "Current User",
      date: new Date().toISOString().split("T")[0],
      category: form.category,
      socialUrl: form.socialUrl || undefined,
      documentUrl: form.documentUrl || null,
      valuesChecklist: form.valuesChecklist,
    });
    if (!ok) return false;
    addToast(t('Article submitted!', 'आलेख भेजा गया!'), 'success', t('Sent for Unit Head review', 'यूनिट प्रमुख समीक्षा के लिए भेजा गया'));
    return true;
  };

  // ── Karyakarta View ──────────────────────────────────────────────────────
  if (role === "karyakarta") {
    const mine = articles.filter(a => a.author === "Current User");
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <AalekhMasthead
          t={t}
          sealEn="Aalekh Writing Desk"
          sealHi="आलेख लेखन कक्ष"
          titleEn="Draft and Submit Aalekh"
          titleHi="आलेख लिखें और समीक्षा हेतु भेजें"
          descriptionEn="Shape your article with clarity, keep revision notes close, and submit each draft into the publication pipeline with confidence."
          descriptionHi="अपने आलेख को स्पष्टता के साथ तैयार करें, संशोधन टिप्पणियों को साथ रखें, और प्रत्येक प्रारूप को प्रकाशन प्रक्रिया में विश्वास के साथ भेजें।"
          action={<WriteArticleDialog onSubmit={handleSubmit} />}
          contexts={[
            {
              labelEn: "Current lane",
              labelHi: "वर्तमान चरण",
              valueEn: "Writing and revision lane",
              valueHi: "लेखन और संशोधन चरण",
              detailEn: "Draft your aalekh, revise returned articles, and prepare them for unit review.",
              detailHi: "अपना आलेख लिखें, लौटे हुए मसौदों को सुधारें, और उन्हें यूनिट समीक्षा के लिए तैयार करें।",
            },
            {
              labelEn: "Next movement",
              labelHi: "अगला प्रवाह",
              valueEn: "Submit for Unit Head review",
              valueHi: "यूनिट प्रमुख समीक्षा हेतु भेजें",
              detailEn: "Every completed draft moves first through the unit editorial gate before publication.",
              detailHi: "प्रकाशन से पहले हर पूरा मसौदा पहले यूनिट संपादकीय चरण से गुजरता है।",
            },
            {
              labelEn: "Published intent",
              labelHi: "प्रकाशन उद्देश्य",
              valueEn: "Ideas shaped for institutional publication",
              valueHi: "संस्थागत प्रकाशन हेतु तैयार विचार",
              detailEn: "Strong writing here becomes reviewed, approved, and published aalekh for the wider feed.",
              detailHi: "यहाँ की मजबूत लेखनी समीक्षा और अनुमोदन के बाद व्यापक फ़ीड में प्रकाशित आलेख बनती है।",
            },
          ]}
        />

        {mine.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-10 text-center text-muted-foreground text-sm space-y-3">
              <PenLine className="w-8 h-8 mx-auto opacity-40" />
              <p>{t("No articles yet. Write your first article!", "अभी कोई आलेख नहीं। अपना पहला आलेख लिखें!")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {mine.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ArticleCard article={a} />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    );
  }

  // ── Unit Head View ───────────────────────────────────────────────────────
  if (role === "unit_head") {
    const queue = articles.filter(a => a.status === "Pending Unit Head Review");
    const rest = articles.filter(a => a.status !== "Pending Unit Head Review");

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <AalekhMasthead
          t={t}
          sealEn="First Editorial Review Desk"
          sealHi="प्रथम संपादकीय समीक्षा कक्ष"
          titleEn="Review and Route Aalekh"
          titleHi="आलेख की समीक्षा करें और आगे बढ़ाएँ"
          descriptionEn="This desk receives writer submissions first. Review each draft carefully, return what needs work, and forward the ready pieces into the aayam lane."
          descriptionHi="यह कक्ष लेखक के मसौदे सबसे पहले प्राप्त करता है। प्रत्येक आलेख की सावधानी से समीक्षा करें, आवश्यक होने पर वापस भेजें, और तैयार सामग्री को आयाम चरण में अग्रेषित करें।"
          contexts={[
            {
              labelEn: "Current lane",
              labelHi: "वर्तमान चरण",
              valueEn: "Pending first-review queue",
              valueHi: "प्रथम समीक्षा प्रतीक्षारत पंक्ति",
              detailEn: "Return with notes or forward to aayam once the draft is ready for thematic approval.",
              detailHi: "जब मसौदा तैयार हो जाए तो टिप्पणियों सहित वापस भेजें या आयाम चरण में अग्रेषित करें।",
            },
            {
              labelEn: "Editorial responsibility",
              labelHi: "संपादकीय दायित्व",
              valueEn: "Strengthen clarity before escalation",
              valueHi: "अगले चरण से पहले स्पष्टता सुदृढ़ करें",
              detailEn: "This is the quality gate between initial writing and final publication review.",
              detailHi: "यह प्रारंभिक लेखन और अंतिम प्रकाशन समीक्षा के बीच की गुणवत्ता-परीक्षा है।",
            },
            {
              labelEn: "Next movement",
              labelHi: "अगला प्रवाह",
              valueEn: "Forward to Aayam Pramukh",
              valueHi: "आयाम प्रमुख को भेजें",
              detailEn: "Approved drafts move onward for thematic scrutiny and publication approval.",
              detailHi: "स्वीकृत मसौदे आगे विषयगत समीक्षा और प्रकाशन अनुमोदन के लिए जाते हैं।",
            },
          ]}
        />

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-amber-500" /> {t(`Pending First-Review Queue (${queue.length})`, `प्रथम समीक्षा प्रतीक्षारत (${queue.length})`)}
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("Return with notes or forward to aayam", "टिप्पणियों सहित वापस भेजें या आयाम को अग्रेषित करें")}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">{t('All clear! No articles pending review.', 'सब ठीक है! कोई आलेख समीक्षा प्रतीक्षित नहीं।')}</p>
            ) : (
              queue.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <ArticleCard
                    article={a}
                    actions={
                      <div className="flex items-center gap-2 flex-wrap">
                        <EditForwardDialog
                          article={a}
                          targetStatus="Pending Aayam Review"
                          actionLabel={t("Edit & Forward to Aayam Pramukh", "संपादित करें और आयाम प्रमुख को भेजें")}
                          onDone={async (edits) => {
                            const ok = await updateArticleStatus(a.id, "Pending Aayam Review", edits);
                            if (!ok) return false;
                            addToast(t('Article forwarded!', 'आलेख आगे भेजा!'), 'info', t('Sent for Aayam Pramukh review', 'आयाम प्रमुख की समीक्षा के लिए'));
                            return true;
                          }}
                        />
                        <ReturnWithNotesDialog
                          articleId={a.id}
                          onReturn={async (reviewNotes) => {
                            const ok = await updateArticleStatus(a.id, "Draft", undefined, { reviewNotes: reviewNotes ?? null });
                            if (!ok) return;
                            addToast(t('Returned to writer', 'लेखक को वापस भेजा'), 'warning', t('Sent back for revision', 'संशोधन के लिए वापस भेजा'));
                          }}
                        />
                      </div>
                    }
                  />
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {rest.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" /> {t(`All Articles (${rest.length})`, `सभी आलेख (${rest.length})`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {rest.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ArticleCard article={a} />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  // ── Aayam Pramukh View ───────────────────────────────────────────────────
  if (role === "aayam_pramukh") {
    const queue = articles.filter(a => a.status === "Pending Aayam Review");
    const published = articles.filter(a => a.status === "Published");

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <AalekhMasthead
          t={t}
          sealEn="Aalekh Publication Desk"
          sealHi="आलेख प्रकाशन कक्ष"
          titleEn="Approve and Publish Aalekh"
          titleHi="आलेख अनुमोदित करें और प्रकाशित करें"
          descriptionEn="This publication desk receives reviewed drafts, makes the final editorial call, and moves approved pieces into the institutional archive and feed."
          descriptionHi="यह प्रकाशन कक्ष समीक्षित मसौदे प्राप्त करता है, अंतिम संपादकीय निर्णय लेता है, और स्वीकृत सामग्री को संस्थागत अभिलेख तथा फ़ीड में प्रकाशित करता है।"
          contexts={[
            {
              labelEn: "Current lane",
              labelHi: "वर्तमान चरण",
              valueEn: "Final approval and publication lane",
              valueHi: "अंतिम अनुमोदन और प्रकाशन चरण",
              detailEn: "Review forwarded aalekh, approve the ready ones, and return the rest with clear notes.",
              detailHi: "अग्रेषित आलेखों की समीक्षा करें, तैयार सामग्री को अनुमोदित करें, और शेष को स्पष्ट टिप्पणियों सहित वापस भेजें।",
            },
            {
              labelEn: "Published record",
              labelHi: "प्रकाशित अभिलेख",
              valueEn: "Institutional archive in motion",
              valueHi: "गतिशील संस्थागत अभिलेख",
              detailEn: "Every published aalekh becomes part of the visible intellectual record of the organisation.",
              detailHi: "प्रत्येक प्रकाशित आलेख संगठन के दृश्य बौद्धिक अभिलेख का हिस्सा बनता है।",
            },
            {
              labelEn: "Editorial standard",
              labelHi: "संपादकीय मानक",
              valueEn: "Final thematic scrutiny",
              valueHi: "अंतिम विषयगत समीक्षा",
              detailEn: "Use this desk to preserve tone, clarity, and mission alignment before publication.",
              detailHi: "प्रकाशन से पहले स्वर, स्पष्टता और मिशन-संगति बनाए रखने के लिए इस कक्ष का उपयोग करें।",
            },
          ]}
        />

        {lastPublished && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="border-green-500/40 bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-green-800 dark:text-green-300 text-sm font-devanagari">
                  <strong>{lastPublished}</strong> {t('published to feed!', 'फ़ीड में प्रकाशित!')}
                </span>
                <div className="flex items-center gap-2 ml-3">
                  <Link href="/feed">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-700 dark:text-green-400">
                      {t('View in Feed', 'फ़ीड में देखें')} <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                  <button onClick={() => setLastPublished(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-blue-500" /> {t(`Final Approval Queue (${queue.length})`, `अंतिम अनुमोदन पंक्ति (${queue.length})`)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">{t('No articles pending approval.', 'अनुमोदन प्रतीक्षित कोई आलेख नहीं।')}</p>
            ) : (
              queue.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <ArticleCard
                    article={a}
                    actions={
                      <div className="flex items-center gap-2 flex-wrap">
                        <EditForwardDialog
                          article={a}
                          targetStatus="Published"
                          actionLabel={t("Edit & Approve to Publish", "संपादित करें और प्रकाशित करें")}
                          onDone={async (edits) => {
                            const ok = await updateArticleStatus(a.id, "Published", edits);
                            if (!ok) return false;
                            setLastPublished(edits.title ?? a.title);
                            addToast(t('Article Published!', 'आलेख प्रकाशित!'), 'success', t('Available in Feed', 'फ़ीड में उपलब्ध'));
                            return true;
                          }}
                        />
                        <Button size="sm" className="h-7 text-xs"
                          onClick={async () => {
                            const ok = await updateArticleStatus(a.id, "Published");
                            if (!ok) return;
                            setLastPublished(a.title);
                            addToast(t('Article Published!', 'आलेख प्रकाशित!'), 'success', t('Available in Feed', 'फ़ीड में उपलब्ध'));
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> {t('Approve & Publish', 'अनुमोदित करें और प्रकाशित करें')}
                        </Button>
                        <ReturnWithNotesDialog
                          articleId={a.id}
                          onReturn={async (reviewNotes) => {
                            const ok = await updateArticleStatus(a.id, "Draft", undefined, { reviewNotes: reviewNotes ?? null });
                            if (!ok) return;
                            addToast(t('Returned for revision', 'संशोधन के लिए वापस भेजा'), 'warning', t('Sent back for revision', 'संशोधन के लिए वापस भेजा गया'));
                          }}
                        />
                      </div>
                    }
                  />
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" /> {t(`Published Aalekh Archive (${published.length})`, `प्रकाशित आलेख अभिलेख (${published.length})`)}
            </CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">
              {t("Institutional publication record and approved aalekh archive.", "संस्थागत प्रकाशन अभिलेख और अनुमोदित आलेख संग्रह।")}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {published.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {t("No aalekh published yet. Approved work will appear here.", "अभी कोई आलेख प्रकाशित नहीं है। अनुमोदित सामग्री यहाँ दिखाई देगी।")}
              </p>
            ) : (
              published.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ArticleCard article={a} />
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Vibhag Pramukh View ──────────────────────────────────────────────────
  const total = articles.length;
  const published = articles.filter(a => a.status === "Published").length;
  const pending = articles.filter(a => a.status === "Pending Unit Head Review" || a.status === "Pending Aayam Review").length;
  const publishedList = articles.filter(a => a.status === "Published");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-devanagari">{t('Aalekh Overview', 'आलेख अवलोकन')}</h1>
        <p className="text-muted-foreground text-sm">{t('Published articles across all aayams — Bhopal Vibhag', 'सभी आयामों के प्रकाशित आलेख — भोपाल विभाग')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("Total Articles", "कुल आलेख"), value: total, icon: BarChart3, color: "text-primary" },
          { label: t("Published", "प्रकाशित"), value: published, icon: CheckCircle2, color: "text-green-600" },
          { label: t("In Review", "समीक्षाधीन"), value: pending, icon: Clock, color: "text-amber-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="glass-card hover-lift">
              <CardContent className="pt-5">
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
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> {t('Published Articles', 'प्रकाशित आलेख')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {publishedList.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">{t('No published articles yet.', 'अभी कोई प्रकाशित आलेख नहीं।')}</p>
          ) : (
            publishedList.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ArticleCard article={a} />
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
