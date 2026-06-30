"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Search, MessagesSquare, MessageSquare, Pin, Lock, Plus,
  ArrowLeft, Send, Trash2, Clock, User, Filter, X,
  MessageCircle, ThumbsUp, AlertCircle, PenLine,
} from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { useT } from '@/lib/useT';
import { cn } from '@/lib/utils';
import { Masthead } from '@/components/Masthead';
import { useVimarshTopics } from '@/hooks/api/use-vimarsh-topics';
import { buildWorkflowHref } from '@/lib/app/workflow-actions';

// Map vimarsh topic groups → charcha categories
const GROUP_TO_CATEGORY: Record<string, string> = {
  atma_bodh: "Philosophy",
  forces_of_division: "Governance",
  targeted_groups: "Social Development",
  other: "General",
};

// ── Types ────────────────────────────────────────────────────────────────

interface ThreadSummary {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  category: string;
  isPinned: boolean;
  isClosed: boolean;
  replyCount: number;
  createdAt: string;
  updatedAt: string;
  authorUserId: string | null;
  authorName: string | null;
  authorNameHi: string | null;
}

interface Reply {
  id: string;
  threadId: string;
  body: string;
  createdAt: string;
  authorUserId: string | null;
  authorName: string | null;
  authorNameHi: string | null;
}

interface ThreadDetail {
  thread: ThreadSummary & { body: string; bodyHi: string };
  replies: Reply[];
}

const CATEGORIES = ["General", "Education", "Social Development", "Science & Culture", "Youth", "Governance", "History", "Philosophy"];

function getInitials(name: string | null) {
  if (!name) return "??";
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function formatDate(ts: string, t: (en: string, hi: string) => string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return t("Just now", "अभी");
  if (mins < 60) return t(`${mins}m ago`, `${mins} मिनट पहले`);
  if (hours < 24) return t(`${hours}h ago`, `${hours} घंटे पहले`);
  if (days < 7) return t(`${days}d ago`, `${days} दिन पहले`);
  return d.toLocaleDateString();
}

function categoryColor(cat: string): string {
  const colors: Record<string, string> = {
    "General": "bg-sky-500/10 text-sky-600 border-sky-500/30",
    "Education": "bg-blue-500/10 text-blue-600 border-blue-500/30",
    "Social Development": "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    "Science & Culture": "bg-violet-500/10 text-violet-600 border-violet-500/30",
    "Youth": "bg-amber-500/10 text-amber-600 border-amber-500/30",
    "Governance": "bg-rose-500/10 text-rose-600 border-rose-500/30",
    "History": "bg-orange-500/10 text-orange-600 border-orange-500/30",
    "Philosophy": "bg-indigo-500/10 text-indigo-600 border-indigo-500/30",
  };
  return colors[cat] ?? "bg-muted/60 text-muted-foreground border-border/60";
}

// ── Loading Skeleton ──────────────────────────────────────────────────────

function ThreadListSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-muted/30 border border-border/50" />
      ))}
    </div>
  );
}

function ThreadDetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-48 rounded-2xl bg-muted/30 border border-border/50" />
      <div className="h-32 rounded-2xl bg-muted/20 border border-border/50" />
      <div className="h-32 rounded-2xl bg-muted/20 border border-border/50" />
    </div>
  );
}

// ── Create Thread Form ────────────────────────────────────────────────────

function CreateThreadForm({
  onSave, onCancel, t, isHi, initialTitle, initialBody, initialCategory,
}: {
  onSave: (data: { title: string; titleHi: string; body: string; bodyHi: string; category: string }) => Promise<void>;
  onCancel: () => void;
  t: (en: string, hi: string) => string;
  isHi: boolean;
  initialTitle?: string;
  initialBody?: string;
  initialCategory?: string;
}) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [titleHi, setTitleHi] = useState('');
  const [body, setBody] = useState(initialBody ?? '');
  const [bodyHi, setBodyHi] = useState('');
  const [category, setCategory] = useState(initialCategory ?? 'General');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !titleHi.trim()) {
      setError(t("Title and Hindi title are required.", "शीर्षक और हिंदी शीर्षक आवश्यक है।"));
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ title: title.trim(), titleHi: titleHi.trim(), body, bodyHi, category });
    } catch {
      setError(t("Failed to create thread.", "सूत्र बनाने में विफल।"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="institution-panel border-primary/20">
      <CardContent className="py-6 px-6">
        <div className="flex items-center justify-between mb-6">
          <p className="section-seal">{t("Start a New Discussion", "नई चर्चा शुरू करें")}</p>
          <Button variant="ghost" size="sm" onClick={onCancel} className="min-h-[44px] min-w-[44px]">
            <X className="w-5 h-5" />
          </Button>
        </div>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-[11px] font-bold">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="shell-copy text-[10px] mb-1.5 block">{t("Title (English)", "शीर्षक (अंग्रेज़ी)")}</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("Enter title...", "शीर्षक दर्ज करें...")} className="min-h-[44px]" />
          </div>
          <div>
            <label className="shell-copy text-[10px] mb-1.5 block">{t("Title (Hindi)", "शीर्षक (हिंदी)")}</label>
            <Input value={titleHi} onChange={e => setTitleHi(e.target.value)} placeholder={t("हिंदी शीर्षक दर्ज करें...", "हिंदी शीर्षक दर्ज करें...")} className="min-h-[44px] font-devanagari" dir="auto" />
          </div>
          <div>
            <label className="shell-copy text-[10px] mb-1.5 block">{t("Category", "श्रेणी")}</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="shell-copy text-[10px] mb-1.5 block">{t("Body (English)", "विवरण (अंग्रेज़ी)")}</label>
            <Textarea value={body} onChange={e => setBody(e.target.value)} rows={4} placeholder={t("Write your discussion...", "अपनी चर्चा लिखें...")} className="min-h-[100px]" />
          </div>
          <div>
            <label className="shell-copy text-[10px] mb-1.5 block">{t("Body (Hindi)", "विवरण (हिंदी)")}</label>
            <Textarea value={bodyHi} onChange={e => setBodyHi(e.target.value)} rows={4} placeholder={t("हिंदी में विवरण लिखें...", "हिंदी में विवरण लिखें...")} className="min-h-[100px] font-devanagari" dir="auto" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} className="min-h-[44px] text-[11px] font-bold uppercase tracking-widest">
              {t("Cancel", "रद्द करें")}
            </Button>
            <Button type="submit" disabled={saving} className="min-h-[44px] text-[11px] font-bold uppercase tracking-widest">
              {saving ? t("Creating...", "बन रहा...") : t("Create Thread", "सूत्र बनाएँ")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Reply Composer ────────────────────────────────────────────────────────

function ReplyComposer({
  threadId, threadClosed, onReply, t,
}: {
  threadId: string; threadClosed: boolean; onReply: (body: string) => Promise<void>; t: (en: string, hi: string) => string;
}) {
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  if (threadClosed) {
    return (
      <div className="px-6 py-5 rounded-2xl bg-muted/20 border border-dashed border-border/60 text-center">
        <Lock className="w-6 h-6 mx-auto mb-2 text-muted-foreground/40" />
        <p className="text-[11px] font-bold text-muted-foreground/60">{t("This thread is closed for new replies.", "यह सूत्र नई टिप्पणियों के लिए बंद है।")}</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    try {
      await onReply(body.trim());
      setBody('');
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <Textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={2}
        placeholder={t("Write a reply...", "उत्तर लिखें...")}
        className="min-h-[44px] flex-1"
      />
      <Button type="submit" disabled={sending || !body.trim()} className="min-h-[44px] min-w-[44px] shrink-0 self-end">
        <Send className="w-4 h-4" />
      </Button>
    </form>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

type ViewState = "list" | "detail" | "create";

export default function VimarshCharcha() {
  const { lang, role } = useAppContext();
  const t = useT();
  const isHi = lang === 'hi';
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');
  const topicId = searchParams.get('topicId');
  const seededRef = useRef(false);

  const { data: topicGroups } = useVimarshTopics();

  const vimarshTopic = useMemo(() => {
    if (!topicId || !topicGroups) return null;
    for (const g of topicGroups) {
      const found = g.topics.find((t) => t.id === topicId);
      if (found) return found;
    }
    return null;
  }, [topicId, topicGroups]);

  const initialThreadData = useMemo(() => {
    if (!vimarshTopic) return { title: topic ?? '', body: '', category: 'General' };
    const desc = vimarshTopic.description ?? '';
    const resourceList = vimarshTopic.resources.length > 0
      ? '\n\nResources:\n' + vimarshTopic.resources.map((r) => `- ${r.title}: ${r.url}`).join('\n')
      : '';
    return {
      title: vimarshTopic.title,
      body: desc + resourceList,
      category: GROUP_TO_CATEGORY[vimarshTopic.group] ?? 'General',
    };
  }, [vimarshTopic, topic]);

  const [view, setView] = useState<ViewState>("list");
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [threadDetail, setThreadDetail] = useState<ThreadDetail | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const r = await fetch("/api/v1/vimarsh/threads");
      const json = await r.json();
      if (json.success) setThreads(json.data as ThreadSummary[]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  useEffect(() => {
    if ((topic || topicId) && !seededRef.current) {
      seededRef.current = true;
      setView("create");
    }
  }, [topic, topicId]);

  const filteredThreads = useMemo(() => {
    let result = threads;
    if (categoryFilter) {
      result = result.filter(t => t.category === categoryFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.titleHi.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [threads, categoryFilter, search]);

  const activeCategories = useMemo(() => {
    const cats = new Set(threads.map(t => t.category));
    return CATEGORIES.filter(c => cats.has(c));
  }, [threads]);

  const totalReplies = useMemo(() => threads.reduce((s, t) => s + t.replyCount, 0), [threads]);

  async function openThread(id: string) {
    setSelectedId(id);
    setDetailLoading(true);
    setView("detail");
    try {
      const r = await fetch(`/api/v1/vimarsh/threads/${id}`);
      const json = await r.json();
      if (json.success) setThreadDetail(json.data as ThreadDetail);
    } catch {
      setThreadDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function createThread(data: { title: string; titleHi: string; body: string; bodyHi: string; category: string }) {
    const r = await fetch("/api/v1/vimarsh/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await r.json();
    if (!json.success) throw new Error(json.error?.message ?? "Failed");
    setView("list");
    fetchThreads();
  }

  async function addReply(body: string) {
    if (!selectedId) return;
    const r = await fetch(`/api/v1/vimarsh/threads/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const json = await r.json();
    if (json.success) {
      openThread(selectedId);
      fetchThreads();
    }
  }

  async function deleteThread(id: string) {
    if (!confirm(t("Delete this thread? This cannot be undone.", "यह सूत्र हटाएँ? यह वापस नहीं किया जा सकता।"))) return;
    const r = await fetch(`/api/v1/vimarsh/threads/${id}`, { method: "DELETE" });
    const json = await r.json();
    if (json.success) {
      setView("list");
      setSelectedId(null);
      setThreadDetail(null);
      fetchThreads();
    }
  }

  async function togglePin(id: string, current: boolean) {
    await fetch(`/api/v1/vimarsh/threads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !current }),
    });
    if (selectedId === id && threadDetail) {
      threadDetail.thread.isPinned = !current;
    }
    fetchThreads();
  }

  async function toggleClose(id: string, current: boolean) {
    await fetch(`/api/v1/vimarsh/threads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isClosed: !current }),
    });
    if (selectedId === id && threadDetail) {
      threadDetail.thread.isClosed = !current;
    }
    fetchThreads();
  }

  function contexts() {
    return [
      {
        icon: <MessagesSquare className="w-5 h-5 text-primary" />,
        labelEn: "Total Threads",
        labelHi: "कुल सूत्र",
        valueEn: `${threads.length}`,
        valueHi: `${threads.length}`,
        detailEn: "Active discussions",
        detailHi: "सक्रिय चर्चाएँ",
      },
      {
        icon: <MessageCircle className="w-5 h-5 text-primary" />,
        labelEn: "Total Replies",
        labelHi: "कुल उत्तर",
        valueEn: `${totalReplies}`,
        valueHi: `${totalReplies}`,
        detailEn: "Across all threads",
        detailHi: "सभी सूत्रों में",
      },
      {
        icon: <Filter className="w-5 h-5 text-primary" />,
        labelEn: "Categories",
        labelHi: "श्रेणियाँ",
        valueEn: `${activeCategories.length}`,
        valueHi: `${activeCategories.length}`,
        detailEn: "Active discussion categories",
        detailHi: "सक्रिय चर्चा श्रेणियाँ",
      },
    ];
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10 pb-10">
      <Masthead
        title="Vimarsh Charcha"
        titleHi="विमर्श चर्चा"
        seal="Discussion & Debate"
        sealHi="चर्चा एवं विमर्श"
        subtitle="An internal space for karyakartas to discuss ideas, share perspectives, and debate topics that matter to our work and vision."
        subtitleHi="कार्यकर्ताओं के लिए विचारों पर चर्चा, दृष्टिकोण साझा करने और हमारे कार्य एवं दृष्टि से जुड़े विषयों पर बहस करने का आंतरिक स्थान।"
        icon={<MessagesSquare className="w-7 h-7 text-primary" />}
        contexts={!loading && !error ? contexts() : undefined}
      />

      {error && !loading ? (
        <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
            <AlertCircle className="w-10 h-10 text-muted-foreground/20" />
          </div>
          <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
            {t('Unable to load discussions.', 'चर्चाएँ लोड करने में असमर्थ।')}
          </p>
          <Button variant="link" onClick={fetchThreads} className="mt-2 text-primary font-bold uppercase tracking-widest text-[10px]">
            {t('Retry', 'पुनः प्रयास करें')}
          </Button>
        </div>
      ) : view === "detail" && selectedId ? (
        <AnimatePresence mode="wait">
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Back button */}
            <button
              onClick={() => { setView("list"); setSelectedId(null); setThreadDetail(null); }}
              className="flex items-center gap-2 min-h-[44px] text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("Back to Discussions", "चर्चाओं पर वापस")}
            </button>

            {detailLoading ? <ThreadDetailSkeleton /> : threadDetail ? (
              <>
                {/* Thread Post */}
                <Card className="institution-panel border-border/50 overflow-hidden">
                  <div className={cn("h-1.5", threadDetail.thread.isPinned ? "bg-amber-500" : "bg-primary/30")} />
                  <CardContent className="py-6 px-6 md:px-8">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {getInitials(isHi ? threadDetail.thread.authorNameHi : threadDetail.thread.authorName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold text-foreground/90 font-devanagari">
                          {isHi ? threadDetail.thread.titleHi : threadDetail.thread.title}
                        </h2>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {isHi && threadDetail.thread.authorNameHi ? threadDetail.thread.authorNameHi : threadDetail.thread.authorName ?? t("Unknown", "अज्ञात")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(threadDetail.thread.createdAt, t)}
                          </span>
                          <Badge className={cn("text-[8px] font-bold uppercase tracking-widest", categoryColor(threadDetail.thread.category))}>
                            {threadDetail.thread.category}
                          </Badge>
                          {threadDetail.thread.isPinned && (
                            <Badge className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-400/30 font-bold uppercase tracking-widest">
                              <Pin className="w-3 h-3 mr-1" /> {t("Pinned", "पिन")}
                            </Badge>
                          )}
                          {threadDetail.thread.isClosed && (
                            <Badge className="text-[8px] bg-rose-500/10 text-rose-600 border-rose-500/30 font-bold uppercase tracking-widest">
                              <Lock className="w-3 h-3 mr-1" /> {t("Closed", "बंद")}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* Admin controls */}
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => togglePin(selectedId, threadDetail.thread.isPinned)}
                          className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]", threadDetail.thread.isPinned ? "bg-amber-500/10 border-amber-400/30 text-amber-600" : "bg-background border-border/60 text-muted-foreground hover:text-foreground")}
                          title={t("Toggle pin", "पिन टॉगल")}
                        >
                          <Pin className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleClose(selectedId, threadDetail.thread.isClosed)}
                          className={cn("w-9 h-9 rounded-xl border flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]", threadDetail.thread.isClosed ? "bg-rose-500/10 border-rose-500/30 text-rose-600" : "bg-background border-border/60 text-muted-foreground hover:text-foreground")}
                          title={t("Toggle close", "बंद टॉगल")}
                        >
                          <Lock className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteThread(selectedId)}
                          className="w-9 h-9 rounded-xl border border-border/60 bg-background flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors min-h-[44px] min-w-[44px]"
                          title={t("Delete", "हटाएँ")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Body */}
                    {(isHi && threadDetail.thread.bodyHi ? threadDetail.thread.bodyHi : threadDetail.thread.body) ? (
                      <div className="mt-4 text-sm text-foreground/70 leading-relaxed whitespace-pre-wrap font-devanagari">
                        {isHi && threadDetail.thread.bodyHi ? threadDetail.thread.bodyHi : threadDetail.thread.body}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground/40 italic">{t("No body content.", "कोई विवरण नहीं।")}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Replies */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="section-seal">{t("Replies", "उत्तर")} ({threadDetail.replies.length})</span>
                  </div>

                  {threadDetail.replies.length === 0 ? (
                    <div className="text-center py-16 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
                      <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                      <p className="text-sm font-bold text-muted-foreground/60">
                        {t("No replies yet. Be the first to respond!", "अभी कोई उत्तर नहीं। पहले उत्तर देने वाले बनें!")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {threadDetail.replies.map((reply) => (
                        <div key={reply.id} className="flex gap-3 px-5 py-4 rounded-2xl bg-background/40 border border-border/50 hover:border-primary/20 transition-all">
                          <div className="w-9 h-9 rounded-xl bg-primary/5 border border-primary/15 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
                            {getInitials(isHi ? reply.authorNameHi : reply.authorName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-1.5">
                              <span className="font-bold text-foreground/70">
                                {isHi && reply.authorNameHi ? reply.authorNameHi : reply.authorName ?? t("Unknown", "अज्ञात")}
                              </span>
                              <span>{formatDate(reply.createdAt, t)}</span>
                            </div>
                            <p className="text-sm text-foreground/70 leading-relaxed font-devanagari">{reply.body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Composer */}
                <ReplyComposer
                  threadId={selectedId}
                  threadClosed={threadDetail.thread.isClosed}
                  onReply={addReply}
                  t={t}
                />

                {/* Next step: draft an Aalekh from this discussion — karyakarta only
                    (only they have the write desk that consumes the prefill). */}
                {role === "karyakarta" && (
                  <div className="flex flex-col items-start gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs leading-5 text-muted-foreground">
                      {t("Take this discussion further — turn it into a draft article.", "इस चर्चा को आगे ले जाएँ — इसे आलेख मसौदे में बदलें।")}
                    </p>
                    <Link href={buildWorkflowHref("/aalekh", { threadId: selectedId })} className="shrink-0">
                      <Button variant="outline" className="min-h-[44px] gap-2 text-[11px] font-bold uppercase tracking-widest" title={t("Draft an article from this discussion", "इस चर्चा से आलेख का मसौदा बनाएँ")}>
                        <PenLine className="w-4 h-4" />
                        {t("Draft Aalekh from discussion", "चर्चा से आलेख मसौदा")}
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-muted-foreground">{t("Thread not found.", "सूत्र नहीं मिला।")}</div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* New Discussion button */}
            {view !== "create" && (
              <div className="flex items-center justify-between gap-3">
                <Link
                  href="/vimarsh"
                  className="flex items-center gap-2 min-h-[44px] text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("Back to Vimarsh", "विमर्श पर वापस")}
                </Link>
                <Button onClick={() => setView("create")} className="min-h-[44px] text-[11px] font-bold uppercase tracking-widest">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("New Discussion", "नई चर्चा")}
                </Button>
              </div>
            )}

            {/* Create Form */}
            {view === "create" && (
              <CreateThreadForm
                onSave={createThread}
                onCancel={() => setView("list")}
                t={t}
                isHi={isHi}
                initialTitle={initialThreadData.title}
                initialBody={initialThreadData.body}
                initialCategory={initialThreadData.category}
              />
            )}

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t("Search discussions...", "चर्चाएँ खोजें...")}
                  className="min-h-[44px] pl-11"
                />
              </div>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter(null)}
                className={cn(
                  "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all min-h-[44px]",
                  categoryFilter === null
                    ? "bg-primary/10 text-primary border-primary/20"
                    : "bg-background/40 text-muted-foreground border-border/60 hover:text-foreground"
                )}
              >
                {t("All", "सभी")}
              </button>
              {CATEGORIES.map(cat => {
                const count = threads.filter(t => t.category === cat).length;
                if (count === 0) return null;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all min-h-[44px]",
                      categoryFilter === cat
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-background/40 text-muted-foreground border-border/60 hover:text-foreground"
                    )}
                  >
                    {cat}
                    <span className="ml-1.5 opacity-60">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Thread list */}
            {loading ? (
              <ThreadListSkeleton />
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-32 bg-muted/20 rounded-[3rem] border border-dashed border-border/60">
                <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 border border-border/40">
                  <MessagesSquare className="w-10 h-10 text-muted-foreground/20" />
                </div>
                <p className="text-lg font-bold text-muted-foreground/60 font-devanagari">
                  {search || categoryFilter
                    ? t("No matching discussions found.", "कोई मेल खाती चर्चा नहीं मिली।")
                    : t("No discussions yet.", "अभी कोई चर्चा नहीं।")}
                </p>
                <p className="text-sm text-muted-foreground/40 mt-2">
                  {t("Start a new discussion to begin the conversation.", "बातचीत शुरू करने के लिए एक नई चर्चा शुरू करें।")}
                </p>
                {!search && !categoryFilter && (
                  <Button onClick={() => setView("create")} variant="outline" className="mt-6 min-h-[44px] text-[11px] font-bold uppercase tracking-widest">
                    <Plus className="w-4 h-4 mr-2" />
                    {t("Start Discussion", "चर्चा शुरू करें")}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => openThread(thread.id)}
                    className="w-full text-left group"
                  >
                    <div className={cn(
                      "flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all",
                      thread.isPinned
                        ? "bg-amber-500/[0.03] border-amber-500/20 hover:border-amber-500/40"
                        : "bg-background/40 border-border/50 hover:border-primary/20"
                    )}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                        {getInitials(isHi ? thread.authorNameHi : thread.authorName)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-foreground/90 truncate font-devanagari">
                            {isHi ? thread.titleHi : thread.title}
                          </h3>
                          {thread.isPinned && <Pin className="w-3 h-3 text-amber-500 shrink-0" />}
                          {thread.isClosed && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[9px] text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {isHi && thread.authorNameHi ? thread.authorNameHi : thread.authorName ?? t("Unknown", "अज्ञात")}
                          </span>
                          <span>{formatDate(thread.createdAt, t)}</span>
                          <Badge className={cn("text-[7px] font-bold uppercase tracking-widest px-1.5 py-0", categoryColor(thread.category))}>
                            {thread.category}
                          </Badge>
                        </div>
                      </div>

                      {/* Reply count */}
                      <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">{thread.replyCount}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
