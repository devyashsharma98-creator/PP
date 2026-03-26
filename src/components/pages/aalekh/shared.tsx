"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useT } from '@/lib/useT';
import type { AalekhArticle, ArticleStatus } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PenLine, CheckCircle2, ArrowRight,
  ExternalLink, ChevronDown, ChevronRight,
  RotateCcw, Send, FileText, AlertTriangle, User, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";

export const statusColors: Record<ArticleStatus, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  "Pending Unit Head Review": "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  "Pending Aayam Review": "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  "Pending Vibhag Review": "bg-indigo-500/15 text-indigo-700 border-indigo-500/30 dark:text-indigo-400",
  "Pending Prant Authorization": "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-400",
  Published: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
  "Escalated to Kshetra": "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-400",
  "Returned for Revision": "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-400",
  Rejected: "bg-destructive/15 text-destructive border-destructive/30",
  Archived: "bg-muted text-muted-foreground border-border opacity-60",
};

export const statusHi: Record<ArticleStatus, string> = {
  Draft: "प्रारूप",
  "Pending Unit Head Review": "इकाई समीक्षा",
  "Pending Aayam Review": "आयाम समीक्षा",
  "Pending Vibhag Review": "विभाग समीक्षा",
  "Pending Prant Authorization": "प्रांत अनुमोदन",
  Published: "प्रकाशित",
  "Escalated to Kshetra": "क्षेत्र अग्रेषित",
  "Returned for Revision": "संशोधन हेतु",
  Rejected: "अस्वीकृत",
  Archived: "अभिलेख",
};

export const categories = ["Shodh", "Vimarsh", "Yuva", "Mahila", "Prachar", "Aalekh"];

export const valuesItems = [
  { key: "rashtraPratham" as const, label: "राष्ट्र प्रथम", sublabel: "Rashtra Pratham — Nation First", sublabelHi: "राष्ट्र सर्वोपरि" },
  { key: "culturallyGrounded" as const, label: "सांस्कृतिक आधार", sublabel: "Culturally Grounded in Indian tradition", sublabelHi: "भारतीय परंपरा में आधारित" },
  { key: "balancedTone" as const, label: "संतुलित स्वर", sublabel: "Balanced Tone — no extreme language", sublabelHi: "संतुलित भाषा — कोई चरम शब्द नहीं" },
  { key: "noDivisiveContent" as const, label: "अविभाजनकारी नहीं", sublabel: "No divisive or inflammatory content", sublabelHi: "कोई विभाजनकारी सामग्री नहीं" },
];

export const emptyValues = { rashtraPratham: false, culturallyGrounded: false, balancedTone: false, noDivisiveContent: false };
export const emptyForm = { title: "", content: "", summary: "", category: "Shodh", socialUrl: "", documentUrl: "", valuesChecklist: emptyValues };

// ─── Article Card (expandable) ───────────────────────────────────────────────
export function ArticleCard({
  article,
  actions,
}: {
  article: AalekhArticle;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { lang } = useAppContext();
  const t = useT();

  return (
    <Card className="aalekh-article-card overflow-hidden hover:border-primary/30 transition-all duration-300">
      <button className="w-full text-left" onClick={() => setOpen(o => !o)}>
        <CardContent className="py-4 px-5 flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-wider", statusColors[article.status])}>
                {lang === 'hi' ? statusHi[article.status] : article.status}
              </Badge>
              <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-muted/30">{article.category}</Badge>
            </div>
            <h3 className="font-bold text-sm md:text-base leading-tight text-foreground/90">{article.title}</h3>
            <div className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-3 flex-wrap font-medium">
              <span className="flex items-center gap-1.5"><User className="w-3 h-3 opacity-60" />{article.author}</span>
              <span className="opacity-40">•</span>
              <span className="flex items-center gap-1.5"><CalendarDays className="w-3 h-3 opacity-60" />{article.date}</span>

              <div className="flex items-center gap-3 ml-auto sm:ml-0">
                {article.socialUrl && (
                  <a
                    href={article.socialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-primary hover:underline"
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
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    <FileText className="w-3 h-3" /> {t('Document', 'दस्तावेज़')}
                  </a>
                )}
              </div>
            </div>
            <p className="aalekh-article-summary line-clamp-1">{article.summary}</p>
          </div>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors self-end sm:self-start",
            open ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
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
export function WriteArticleDialog({ onSubmit }: { onSubmit: (form: typeof emptyForm) => Promise<boolean> }) {
  const t = useT();
  const { lang } = useAppContext();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const allValuesChecked = Object.values(form.valuesChecklist).every(Boolean);

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

          <div className="aalekh-values-panel">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground/80 font-devanagari">
                {t('Editorial Maryada Check', 'संपादकीय मर्यादा जांच')} <span className="text-muted-foreground font-normal">({t('all required to submit', 'सभी अनिवार्य')})</span>
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {t('Confirm these basics before sending the aalekh forward.', 'आलेख आगे भेजने से पहले इन बिंदुओं की पुष्टि करें।')}
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
            {allValuesChecked ? t("Send to Unit Head Review", "यूनिट प्रमुख समीक्षा को भेजें") : t("Check all values to send", "भेजने से पहले सभी बिंदु जांचें")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit & Forward Dialog ────────────────────────────────────────────────────
export function EditForwardDialog({
  article,
  targetStatus,
  actionLabel,
  showReviewNotes,
  onDone,
}: {
  article: AalekhArticle;
  targetStatus: ArticleStatus;
  actionLabel: string;
  showReviewNotes?: boolean;
  onDone: (edits: Partial<Pick<AalekhArticle, "title" | "content" | "summary">>, reviewNotes?: string) => Promise<boolean>;
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
          <p className="text-xs text-muted-foreground font-devanagari">{t('Review it here and edit if needed before sending ahead.', 'यहां समीक्षा करें और जरूरत हो तो सुधारकर आगे भेजें।')}</p>
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
              <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={2} placeholder={t('Add a short note for the writer...', 'लेखक के लिए छोटा-सा नोट लिखें...')} />
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
export function ReturnWithNotesDialog({
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
              placeholder={t('Tell the writer what to improve next...', 'लेखक को बताएं अगला सुधार क्या है...')}
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
