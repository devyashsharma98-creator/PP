"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, SkipForward, Play, Trash2, CalendarClock, X } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { useUpdateOutreach, useDeleteOutreach, type OutreachItem, type OutreachTypeConfig } from "@/hooks/api/use-outreach";
import { outreachColor, outreachIcon, OUTREACH_STATUS_STYLE } from "@/lib/app/outreach-style";
import type { OutreachStatus } from "@/lib/app/outreach-types";

function formatDue(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function OutreachCard({ item, typeDef, canAct }: {
  item: OutreachItem;
  typeDef: OutreachTypeConfig | undefined;
  canAct: boolean;
}) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const update = useUpdateOutreach();
  const remove = useDeleteOutreach();

  const [skipping, setSkipping] = useState(false);
  const [skipText, setSkipText] = useState("");

  const c = outreachColor(typeDef?.color);
  const Icon = outreachIcon(typeDef?.icon);
  const statusStyle = OUTREACH_STATUS_STYLE[item.status];
  const due = formatDue(item.dueDate);
  const overdue = item.dueDate && item.status !== "completed" && item.status !== "skipped" && new Date(item.dueDate) < new Date();

  const setStatus = async (status: OutreachStatus, skipReason?: string) => {
    try {
      await update.mutateAsync({ id: item.id, status, skipReason });
      setSkipping(false);
      setSkipText("");
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Update failed.", "अद्यतन विफल।"), "error");
    }
  };

  const onDelete = async () => {
    try {
      await remove.mutateAsync(item.id);
      addToast(t("Outreach removed.", "प्रसार हटाया गया।"), "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Delete failed.", "हटाना विफल।"), "error");
    }
  };

  // Render the type-specific metadata as small key/value chips.
  const metaEntries = typeDef?.fields
    .map((f) => ({ label: isHi ? f.labelHi : f.labelEn, value: item.metadata?.[f.key] }))
    .filter((e) => e.value != null && String(e.value).trim() !== "" && !(Array.isArray(e.value) && e.value.length === 0)) ?? [];

  const pending = update.isPending || remove.isPending;

  return (
    <Card className={cn("institution-panel overflow-hidden transition-all", c.border)}>
      <div className={cn("h-1", c.dot)} />
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start gap-3">
          <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", c.bg, c.border)}>
            <Icon className={cn("h-5 w-5", c.text)} />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn("text-[10px] font-medium", c.bg, c.border, c.text)}>
                {isHi ? typeDef?.labelHi : typeDef?.labelEn}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px]", statusStyle.className)}>
                {isHi ? statusStyle.labelHi : statusStyle.labelEn}
              </Badge>
              {overdue && (
                <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-[10px] text-destructive">
                  {t("Overdue", "विलंबित")}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold leading-tight text-foreground">{item.title}</h3>
            {item.description && <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</p>}
          </div>
          {canAct && (
            <button onClick={onDelete} disabled={pending} className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={t("Delete", "हटाएँ")}>
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {(metaEntries.length > 0 || due) && (
          <div className="flex flex-wrap gap-1.5">
            {due && (
              <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px]", overdue ? "border-destructive/30 text-destructive" : "border-border/50 text-muted-foreground")}>
                <CalendarClock className="h-3 w-3" /> {due}
              </span>
            )}
            {metaEntries.map((e, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                <span className="font-medium text-foreground/70">{e.label}:</span>{" "}
                {Array.isArray(e.value) ? e.value.join(", ") : String(e.value)}
              </span>
            ))}
          </div>
        )}

        {item.status === "skipped" && item.skipReason && (
          <p className="rounded-lg border border-border/50 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            <span className="font-semibold">{t("Skipped:", "छोड़ा गया:")}</span> {item.skipReason}
          </p>
        )}

        {/* Actions */}
        {canAct && (
          skipping ? (
            <div className="flex items-center gap-2 border-t border-border/50 pt-3">
              <Input
                value={skipText}
                onChange={(e) => setSkipText(e.target.value)}
                placeholder={t("Why skip this?", "इसे क्यों छोड़ा?")}
                className="h-8 text-xs"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") void setStatus("skipped", skipText.trim() || undefined); }}
              />
              <Button size="sm" className="h-8 shrink-0 text-xs" disabled={pending} onClick={() => void setStatus("skipped", skipText.trim() || undefined)}>
                {t("Save", "सहेजें")}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => { setSkipping(false); setSkipText(""); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 border-t border-border/50 pt-3">
              {item.status !== "completed" && (
                <Button size="sm" className="h-8 gap-1.5 text-xs" disabled={pending} onClick={() => void setStatus("completed")}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t("Mark complete", "पूर्ण करें")}
                </Button>
              )}
              {item.status === "pending" && (
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" disabled={pending} onClick={() => void setStatus("in_progress")}>
                  <Play className="h-3.5 w-3.5" /> {t("Start", "आरंभ")}
                </Button>
              )}
              {(item.status === "completed" || item.status === "skipped") && (
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" disabled={pending} onClick={() => void setStatus("pending")}>
                  <Clock3 className="h-3.5 w-3.5" /> {t("Reopen", "पुनः खोलें")}
                </Button>
              )}
              {item.status !== "skipped" && item.status !== "completed" && (
                <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-xs text-muted-foreground" disabled={pending} onClick={() => setSkipping(true)}>
                  <SkipForward className="h-3.5 w-3.5" /> {t("Skip", "छोड़ें")}
                </Button>
              )}
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
