"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Megaphone, CheckCircle2, X, ArrowRight, Plus, FileText, CalendarDays, ListTodo } from "lucide-react";

import { useReminders } from "@/hooks/api/use-reminders";
import { useUnreadCirculars } from "@/hooks/api/use-circulars";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

/**
 * Above-the-fold morning briefing strip.
 * Shows: overdue count (red), due-today count (amber), unread circulars (blue).
 * Resolves the user's first question — "Is everything OK?" — in under 5 seconds.
 * Also provides one-tap quick-action shortcuts for the 3 most common daily operations.
 */
export function DashboardBriefingStrip({ onQuickCreate }: { onQuickCreate?: (what: "event" | "article" | "task") => void }) {
  const t = useT();
  const { viewer, lang } = useAppContext();
  const [dismissed, setDismissed] = useState(false);

  const { data: reminders } = useReminders();
  const { data: unread } = useUnreadCirculars();

  const overdue = reminders?.counts.overdue ?? 0;
  const dueThisWeek = reminders?.counts.dueThisWeek ?? 0;
  const unreadCount = unread?.count ?? 0;

  const name = viewer?.displayName?.split(" ")[0] ?? t("there", "आप");
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t(`Suprabhat, ${name}`, `सुप्रभात, ${name}`)
      : hour < 17
        ? t(`Namaskar, ${name}`, `नमस्कार, ${name}`)
        : t(`Pranam, ${name}`, `प्रणाम, ${name}`);

  const allClear = overdue === 0 && dueThisWeek === 0 && unreadCount === 0;

  if (dismissed) return null;

  return (
    <div className="space-y-3 mb-5">
      {/* ── Greeting + status bar ── */}
      <div className={cn(
        "relative flex flex-wrap items-center gap-2 rounded-xl border px-4 py-3 text-sm",
        overdue > 0
          ? "border-destructive/30 bg-destructive/5"
          : dueThisWeek > 0
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-green-500/30 bg-green-500/5"
      )}>
        <span className={cn(
          "font-semibold",
          lang === "hi" && "font-devanagari",
          overdue > 0 ? "text-destructive" : dueThisWeek > 0 ? "text-amber-700 dark:text-amber-400" : "text-green-700 dark:text-green-400"
        )}>
          {greeting}
        </span>

        <span className="text-muted-foreground mx-1">·</span>

        {allClear ? (
          <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400 font-medium">
            <CheckCircle2 className="h-4 w-4" />
            {t("You're all caught up!", "सब ठीक है!")}
          </span>
        ) : (
          <span className="flex flex-wrap items-center gap-3">
            {overdue > 0 && (
              <Link href="/smaran" className="flex items-center gap-1 text-destructive font-semibold hover:underline">
                <AlertTriangle className="h-3.5 w-3.5" />
                {overdue} {t("overdue", "विलंबित")}
              </Link>
            )}
            {dueThisWeek > 0 && (
              <Link href="/smaran" className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium hover:underline">
                <Clock className="h-3.5 w-3.5" />
                {dueThisWeek} {t("due this week", "इस सप्ताह")}
              </Link>
            )}
            {unreadCount > 0 && (
              <Link href="/dashboard?section=circulars" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                <Megaphone className="h-3.5 w-3.5" />
                {unreadCount} {t("unread circular", "अपठित परिपत्र")}{unreadCount !== 1 ? "s" : ""}
              </Link>
            )}
          </span>
        )}

        {!allClear && (
          <Link href="/smaran" className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t("Full view", "पूरा देखें")} <ArrowRight className="h-3 w-3" />
          </Link>
        )}

        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 p-1 rounded hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Quick-action shortcuts ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {t("Quick add", "शीघ्र जोड़ें")}
        </span>
        <QuickBtn
          icon={CalendarDays}
          label={t("Event", "कार्यक्रम")}
          onClick={() => onQuickCreate?.("event")}
          color="text-primary"
        />
        <QuickBtn
          icon={FileText}
          label={t("Article", "लेख")}
          href="/aalekh"
          color="text-violet-600"
        />
        <QuickBtn
          icon={ListTodo}
          label={t("Task", "कार्य")}
          onClick={() => onQuickCreate?.("task")}
          color="text-blue-600"
        />
      </div>
    </div>
  );
}

function QuickBtn({
  icon: Icon,
  label,
  href,
  onClick,
  color,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  color: string;
}) {
  const cls = cn(
    "flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-3 py-1.5",
    "text-xs font-medium hover:border-primary/40 hover:bg-muted/50 transition-colors"
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        <Icon className={cn("h-3.5 w-3.5", color)} />
        <Plus className="h-3 w-3 text-muted-foreground" />
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={cls}>
      <Icon className={cn("h-3.5 w-3.5", color)} />
      <Plus className="h-3 w-3 text-muted-foreground" />
      {label}
    </button>
  );
}
