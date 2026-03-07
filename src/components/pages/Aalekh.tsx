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
    <Card className="glass-card overflow-hidden">
      <button className="w-full text-left" onClick={() => setOpen(o => !o)}>
        <CardContent className="py-3.5 px-4 flex items-start gap-3">
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
            <div className="border-t border-border/50 px-4 py-4 bg-muted/20 space-y-3">
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
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{article.content}</p>
              {/* Values checklist display */}
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
              {actions && <div className="pt-1">{actions}</div>}
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
          <div className="rounded-lg border border-border/60 p-3 space-y-2.5 bg-muted/30">
            <p className="text-xs font-semibold text-foreground/80 font-devanagari">
              {t('Organisational Values Compliance', 'संगठन मूल्य अनुपालन')} <span className="text-muted-foreground font-normal">({t('all required to submit', 'सभी अनिवार्य')})</span>
            </p>
            {valuesItems.map(v => (
              <div key={v.key} className="flex items-start gap-2.5">
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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{t("My Articles", "मेरे आलेख")}</h1>
            <p className="text-muted-foreground text-sm">{t("Write articles — submit for Unit Head review before publishing", "आलेख लिखें — प्रकाशन से पहले यूनिट प्रमुख की समीक्षा के लिए भेजें")}</p>
          </div>
          <WriteArticleDialog onSubmit={handleSubmit} />
        </div>

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
        <div>
          <h1 className="text-2xl font-bold">{t("Aalekh Review", "आलेख समीक्षा")}</h1>
          <p className="text-muted-foreground text-sm">{t("Review articles submitted by Karyakartas — edit if needed, then forward to Aayam Pramukh", "कार्यकर्ताओं के आलेखों की समीक्षा करें — जरूरत हो तो संपादित करें, फिर आयाम प्रमुख को भेजें")}</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-amber-500" /> {t(`Pending Your Review (${queue.length})`, `आपकी समीक्षा प्रतीक्षित (${queue.length})`)}
            </CardTitle>
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
        <div>
          <h1 className="text-2xl font-bold font-devanagari">{t('Final Aalekh Approval', 'अंतिम आलेख अनुमोदन')}</h1>
          <p className="text-muted-foreground text-sm">{t('Review forwarded articles — approve to publish in the feed', 'अग्रेषित आलेखों की समीक्षा करें — फ़ीड में प्रकाशित करने के लिए अनुमोदित करें')}</p>
        </div>

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
              <Clock className="w-4 h-4 text-blue-500" /> {t(`Awaiting Final Approval (${queue.length})`, `अंतिम अनुमोदन प्रतीक्षित (${queue.length})`)}
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

        {published.length > 0 && (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> {t(`Published (${published.length})`, `प्रकाशित (${published.length})`)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {published.map((a, i) => (
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
