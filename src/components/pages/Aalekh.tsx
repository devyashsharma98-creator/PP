"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
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
  RotateCcw, Send,
} from "lucide-react";

const statusColors: Record<ArticleStatus, string> = {
  Draft: "bg-muted text-muted-foreground border-border",
  "Pending Unit Head Review": "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400",
  "Pending Aayam Review": "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-400",
  Published: "bg-green-500/15 text-green-700 border-green-500/30 dark:text-green-400",
};

const categories = ["Shodh", "Vimarsh", "Yuva", "Mahila", "Prachar", "Aalekh"];

const valuesItems = [
  { key: "rashtraPratham" as const, label: "राष्ट्र प्रथम", sublabel: "Rashtra Pratham — Nation First" },
  { key: "culturallyGrounded" as const, label: "सांस्कृतिक आधार", sublabel: "Culturally Grounded in Indian tradition" },
  { key: "balancedTone" as const, label: "संतुलित स्वर", sublabel: "Balanced Tone — no extreme language" },
  { key: "noDivisiveContent" as const, label: "अविभाजनकारी नहीं", sublabel: "No divisive or inflammatory content" },
];

const emptyValues = { rashtraPratham: false, culturallyGrounded: false, balancedTone: false, noDivisiveContent: false };
const emptyForm = { title: "", content: "", summary: "", category: "Shodh", socialUrl: "", valuesChecklist: emptyValues };

// ─── Article Card (expandable) ───────────────────────────────────────────────
function ArticleCard({
  article,
  actions,
}: {
  article: AalekhaArticle;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="glass-card overflow-hidden">
      <button className="w-full text-left" onClick={() => setOpen(o => !o)}>
        <CardContent className="py-3.5 px-4 flex items-start gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`text-[10px] border ${statusColors[article.status]}`}>
                {article.status}
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
                  <ExternalLink className="w-3 h-3" /> Source
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
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{article.content}</p>
              {/* Values checklist display */}
              <div className="flex flex-wrap gap-2">
                {valuesItems.map(v => (
                  <span
                    key={v.key}
                    className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${article.valuesChecklist[v.key] ? "border-green-500/40 text-green-700 dark:text-green-400 bg-green-500/10" : "border-red-500/40 text-red-600 bg-red-500/10"}`}
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
function WriteArticleDialog({ onSubmit }: { onSubmit: (form: typeof emptyForm) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const allValuesChecked = Object.values(form.valuesChecklist).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content || !allValuesChecked) return;
    onSubmit(form);
    setForm(emptyForm);
    setOpen(false);
  };

  const toggleValue = (key: keyof typeof emptyValues) =>
    setForm(p => ({ ...p, valuesChecklist: { ...p.valuesChecklist, [key]: !p.valuesChecklist[key] } }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PenLine className="w-4 h-4 mr-2" /> Write New Article</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-popover max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Aalekh (आलेख)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Article title (Hindi or English)" required />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="bg-popover">
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Content (Full Article)</Label>
            <Textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value, summary: e.target.value.slice(0, 150) }))}
              placeholder="Write your full article here..."
              rows={6}
              required
            />
          </div>
          <div>
            <Label>Summary <span className="text-muted-foreground text-xs">(auto-filled, editable)</span></Label>
            <Textarea value={form.summary} onChange={e => setForm(p => ({ ...p, summary: e.target.value }))} rows={2} placeholder="Short excerpt for the feed..." />
          </div>
          <div>
            <Label>Social Media URL <span className="text-muted-foreground text-xs">(optional — paste FB/WhatsApp/Instagram link)</span></Label>
            <Input value={form.socialUrl} onChange={e => setForm(p => ({ ...p, socialUrl: e.target.value }))} placeholder="https://facebook.com/..." type="url" />
          </div>

          {/* Values Checklist */}
          <div className="rounded-lg border border-border/60 p-3 space-y-2.5 bg-muted/30">
            <p className="text-xs font-semibold text-foreground/80">
              संगठन मूल्य अनुपालन <span className="text-muted-foreground font-normal">(all required to submit)</span>
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
                  <span className="block text-[10px] text-muted-foreground">{v.sublabel}</span>
                </Label>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full" disabled={!allValuesChecked}>
            <Send className="w-4 h-4 mr-2" />
            {allValuesChecked ? "Submit for Unit Head Review" : "Check all values to submit"}
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
  onDone,
}: {
  article: AalekhaArticle;
  targetStatus: ArticleStatus;
  actionLabel: string;
  onDone: (edits: Partial<Pick<AalekhaArticle, "title" | "content" | "summary">>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [summary, setSummary] = useState(article.summary);

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
          <p className="text-xs text-muted-foreground">Review and optionally edit before forwarding.</p>
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={summary} onChange={e => setSummary(e.target.value)} rows={2} />
          </div>
          <div>
            <Label>Content</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={6} />
          </div>
          <Button
            className="w-full"
            onClick={() => { onDone({ title, content, summary }); setOpen(false); }}
          >
            <ArrowRight className="w-4 h-4 mr-2" /> Confirm &amp; Forward
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Aalekh() {
  const { role, articles, addArticle, updateArticleStatus } = useAppContext();
  const [lastPublished, setLastPublished] = useState<string | null>(null);

  const handleSubmit = (form: typeof emptyForm) => {
    addArticle({
      title: form.title,
      content: form.content,
      summary: form.summary || form.content.slice(0, 150),
      author: "Current User",
      date: new Date().toISOString().split("T")[0],
      category: form.category,
      socialUrl: form.socialUrl || undefined,
      valuesChecklist: form.valuesChecklist,
    });
  };

  // ── Karyakarta View ──────────────────────────────────────────────────────
  if (role === "karyakarta") {
    const mine = articles.filter(a => a.author === "Current User");
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">My Articles <span className="font-devanagari text-muted-foreground text-lg">मेरे आलेख</span></h1>
            <p className="text-muted-foreground text-sm">Write articles — submit for Unit Head review before publishing</p>
          </div>
          <WriteArticleDialog onSubmit={handleSubmit} />
        </div>

        {mine.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-10 text-center text-muted-foreground text-sm space-y-3">
              <PenLine className="w-8 h-8 mx-auto opacity-40" />
              <p>No articles yet. Write your first article!</p>
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
          <h1 className="text-2xl font-bold">Aalekh Review <span className="font-devanagari text-muted-foreground text-lg">आलेख समीक्षा</span></h1>
          <p className="text-muted-foreground text-sm">Review articles submitted by Karyakartas — edit if needed, then forward to Aayam Pramukh</p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-amber-500" /> Pending Your Review ({queue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">All clear! No articles pending review.</p>
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
                          actionLabel="Edit & Forward to Aayam Pramukh"
                          onDone={(edits) => updateArticleStatus(a.id, "Pending Aayam Review", edits)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => updateArticleStatus(a.id, "Draft")}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Return to Writer
                        </Button>
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
                <Eye className="w-4 h-4 text-muted-foreground" /> All Articles ({rest.length})
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
          <h1 className="text-2xl font-bold">Final Aalekh Approval <span className="font-devanagari text-muted-foreground text-lg">अंतिम अनुमोदन</span></h1>
          <p className="text-muted-foreground text-sm">Review forwarded articles — approve to publish in the feed</p>
        </div>

        {lastPublished && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <Alert className="border-green-500/40 bg-green-500/10">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-green-800 dark:text-green-300 text-sm">
                  <strong>{lastPublished}</strong> published to feed!
                </span>
                <div className="flex items-center gap-2 ml-3">
                  <Link href="/feed">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-green-700 dark:text-green-400">
                      View in Feed <ArrowRight className="w-3 h-3 ml-1" />
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
              <Clock className="w-4 h-4 text-blue-500" /> Awaiting Final Approval ({queue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">No articles pending approval.</p>
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
                          actionLabel="Edit & Approve to Publish"
                          onDone={(edits) => {
                            updateArticleStatus(a.id, "Published", edits);
                            setLastPublished(edits.title ?? a.title);
                          }}
                        />
                        <Button size="sm" className="h-7 text-xs"
                          onClick={() => {
                            updateArticleStatus(a.id, "Published");
                            setLastPublished(a.title);
                          }}
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approve & Publish
                        </Button>
                        <Button
                          variant="outline" size="sm"
                          className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                          onClick={() => updateArticleStatus(a.id, "Draft")}
                        >
                          <RotateCcw className="w-3 h-3 mr-1" /> Return for Revision
                        </Button>
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
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Published ({published.length})
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
        <h1 className="text-2xl font-bold">Aalekh Overview <span className="font-devanagari text-muted-foreground text-lg">आलेख अवलोकन</span></h1>
        <p className="text-muted-foreground text-sm">Published articles across all aayams — Bhopal Vibhag</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Articles", value: total, icon: BarChart3, color: "text-primary" },
          { label: "Published", value: published, icon: CheckCircle2, color: "text-green-600" },
          { label: "In Review", value: pending, icon: Clock, color: "text-amber-500" },
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
            <Users className="w-4 h-4 text-primary" /> Published Articles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {publishedList.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No published articles yet.</p>
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
