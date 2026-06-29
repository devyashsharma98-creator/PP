"use client";

import { useState } from "react";
import { Plus, Trash2, Check, Circle, CircleDot, Loader2, X } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import {
  useResearchProject, useAddMilestone, useUpdateMilestone, useDeleteMilestone,
  type MilestoneStatus, type DeliverableType,
} from "@/hooks/api/use-research";
import { PROJECT_STATUS_STYLE, MILESTONE_STATUS_STYLE, DELIVERABLE_META } from "@/lib/app/research-style";
import { VishayChips } from "@/components/vishay/VishayChips";

const NEXT_STATUS: Record<MilestoneStatus, MilestoneStatus> = {
  pending: "in_progress",
  in_progress: "completed",
  completed: "pending",
};
const STATUS_ICON: Record<MilestoneStatus, typeof Circle> = {
  pending: Circle,
  in_progress: CircleDot,
  completed: Check,
};

export function ProjectDetailDialog({ projectId, open, onOpenChange, canManage }: {
  projectId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  canManage: boolean;
}) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { addToast } = useToast();
  const { data: project, isLoading } = useResearchProject(open ? projectId : null);
  const addMilestone = useAddMilestone();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [adding, setAdding] = useState(false);
  const [mTitle, setMTitle] = useState("");
  const [mWeight, setMWeight] = useState("10");
  const [mDeliverable, setMDeliverable] = useState<DeliverableType>("report");

  if (!projectId) return null;

  const cycleStatus = async (id: string, current: MilestoneStatus) => {
    if (!canManage) return;
    try {
      await updateMilestone.mutateAsync({ id, projectId, status: NEXT_STATUS[current] });
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Update failed.", "अद्यतन विफल।"), "error");
    }
  };

  const submitMilestone = async () => {
    if (!mTitle.trim()) return;
    try {
      await addMilestone.mutateAsync({
        projectId,
        title: mTitle.trim(),
        weight: Number(mWeight) || 0,
        deliverableType: mDeliverable,
      });
      setMTitle(""); setMWeight("10"); setMDeliverable("report"); setAdding(false);
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Could not add milestone.", "मील का पत्थर नहीं जोड़ा गया।"), "error");
    }
  };

  const onDeleteMilestone = async (id: string) => {
    try {
      await deleteMilestone.mutateAsync({ id, projectId });
    } catch (err) {
      addToast(err instanceof Error ? err.message : t("Delete failed.", "हटाना विफल।"), "error");
    }
  };

  const status = project ? PROJECT_STATUS_STYLE[project.status] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {isLoading || !project ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-7 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="pr-6 leading-snug">{isHi ? (project.titleHi || project.title) : project.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {status && <Badge variant="outline" className={cn("text-[10px]", status.className)}>{isHi ? status.labelHi : status.labelEn}</Badge>}
                {project.leadName && <span className="text-[11px] text-muted-foreground">{t("Lead:", "प्रमुख:")} {project.leadName}</span>}
              </div>

              {project.objective && <p className="text-sm leading-relaxed text-foreground/85">{project.objective}</p>}

              <VishayChips contentType="project" contentId={project.id} />

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-muted-foreground">{t("Progress", "प्रगति")}</span>
                  <span className="font-semibold text-foreground">{project.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("Milestones", "मील के पत्थर")}</p>
                  {canManage && !adding && (
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setAdding(true)}>
                      <Plus className="h-3.5 w-3.5" /> {t("Add", "जोड़ें")}
                    </Button>
                  )}
                </div>

                {project.milestones.length === 0 && !adding && (
                  <p className="py-4 text-center text-xs text-muted-foreground">{t("No milestones yet.", "अभी कोई मील का पत्थर नहीं।")}</p>
                )}

                {project.milestones.map((m) => {
                  const ms = MILESTONE_STATUS_STYLE[m.status];
                  const Icon = STATUS_ICON[m.status];
                  const deliverable = m.deliverableType ? DELIVERABLE_META[m.deliverableType] : null;
                  return (
                    <div key={m.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-3 py-2.5">
                      <button
                        onClick={() => cycleStatus(m.id, m.status)}
                        disabled={!canManage || updateMilestone.isPending}
                        className={cn("shrink-0 transition-colors", m.status === "completed" ? "text-emerald-600" : m.status === "in_progress" ? "text-blue-600" : "text-muted-foreground hover:text-foreground")}
                        title={t("Cycle status", "स्थिति बदलें")}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm", m.status === "completed" && "text-muted-foreground line-through")}>{m.title}</p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className={cn("text-[9px]", ms.className)}>{isHi ? ms.labelHi : ms.labelEn}</Badge>
                          <span className="text-[10px] text-muted-foreground">{m.weight}%</span>
                          {deliverable && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                              <deliverable.icon className="h-3 w-3" /> {isHi ? deliverable.labelHi : deliverable.labelEn}
                            </span>
                          )}
                        </div>
                      </div>
                      {canManage && (
                        <button onClick={() => onDeleteMilestone(m.id)} className="shrink-0 rounded-md p-1 text-muted-foreground/60 hover:bg-destructive/10 hover:text-destructive" aria-label={t("Delete", "हटाएँ")}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {adding && (
                  <div className="space-y-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <Input value={mTitle} onChange={(e) => setMTitle(e.target.value)} placeholder={t("Milestone title", "मील के पत्थर का शीर्षक")} className="h-8 text-sm" autoFocus />
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <Input type="number" value={mWeight} onChange={(e) => setMWeight(e.target.value)} className="h-8 w-16 text-sm" min={0} max={100} />
                        <span className="text-xs text-muted-foreground">%</span>
                      </div>
                      <Select value={mDeliverable} onValueChange={(v) => setMDeliverable(v as DeliverableType)}>
                        <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(Object.keys(DELIVERABLE_META) as DeliverableType[]).map((d) => (
                            <SelectItem key={d} value={d}>{DELIVERABLE_META[d].labelEn}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-8 shrink-0 gap-1 text-xs" disabled={addMilestone.isPending || !mTitle.trim()} onClick={submitMilestone}>
                        {addMilestone.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 shrink-0 px-2" onClick={() => { setAdding(false); setMTitle(""); }}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
