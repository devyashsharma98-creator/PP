"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Plus, Target, CheckCircle2, User, ChevronRight } from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useAppContext } from "@/context/AppContext";
import { useResearchProjects, type ResearchProject, type ProjectStatus } from "@/hooks/api/use-research";
import { PROJECT_STATUS_STYLE } from "@/lib/app/research-style";
import { CreateProjectDialog } from "@/components/pages/shodh/CreateProjectDialog";
import { ProjectDetailDialog } from "@/components/pages/shodh/ProjectDetailDialog";

type Tab = "overview" | ProjectStatus;

export default function Shodh() {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { permissions } = useAppContext();
  const canManage = permissions.canCreateProject;

  const [tab, setTab] = useState<Tab>("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useResearchProjects();

  const stats = useMemo(() => ({
    active: projects.filter((p) => p.status === "active").length,
    proposed: projects.filter((p) => p.status === "proposed").length,
    completed: projects.filter((p) => p.status === "completed" || p.status === "published").length,
    milestones: projects.reduce((s, p) => s + p.milestoneCount, 0),
  }), [projects]);

  const visible = useMemo(
    () => (tab === "overview" ? projects : projects.filter((p) => p.status === tab)),
    [projects, tab],
  );

  const contexts = [
    {
      labelEn: "Active research", labelHi: "सक्रिय शोध",
      valueEn: `${stats.active} projects active`, valueHi: `${stats.active} परियोजनाएँ सक्रिय`,
      detailEn: "Civilisational studies, geopolitics, history, and Sanskrit sciences.",
      detailHi: "सभ्यतागत अध्ययन, भू-राजनीति, इतिहास एवं संस्कृत विज्ञान।",
    },
    {
      labelEn: "Pipeline", labelHi: "प्रवाह",
      valueEn: `${stats.proposed} proposed`, valueHi: `${stats.proposed} प्रस्तावित`,
      detailEn: "Proposals awaiting activation and resourcing.",
      detailHi: "सक्रियण एवं संसाधन की प्रतीक्षा में प्रस्ताव।",
    },
    {
      labelEn: "Your role", labelHi: "आपकी भूमिका",
      valueEn: canManage ? "Project lead" : "Researcher",
      valueHi: canManage ? "परियोजना प्रमुख" : "शोधकर्ता",
      detailEn: canManage ? "Create projects, manage milestones, track progress." : "Follow project progress and contribute.",
      detailHi: canManage ? "परियोजनाएँ बनाएँ, मील के पत्थर प्रबंधित करें।" : "परियोजना प्रगति देखें एवं योगदान दें।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
      <Masthead
        compact
        seal="Shodh — Research Projects"
        sealHi="शोध — शोध परियोजनाएँ"
        title="Inquiry that Builds the Civilisation"
        titleHi="सभ्यता का निर्माण करती जिज्ञासा"
        contexts={contexts}
        actions={canManage ? (
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> {t("New Project", "नई परियोजना")}
          </Button>
        ) : undefined}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList className="h-9 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/50 bg-muted/30 p-1">
          {([
            ["overview", t("All", "सभी")],
            ["active", t("Active", "सक्रिय")],
            ["proposed", t("Proposed", "प्रस्तावित")],
            ["under_review", t("Review", "समीक्षा")],
            ["completed", t("Completed", "पूर्ण")],
          ] as const).map(([v, label]) => (
            <TabsTrigger key={v} value={v} className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">{label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "overview" && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: t("Active projects", "सक्रिय परियोजनाएँ"), value: stats.active, icon: FlaskConical },
            { label: t("Proposed", "प्रस्तावित"), value: stats.proposed, icon: Target },
            { label: t("Completed", "पूर्ण"), value: stats.completed, icon: CheckCircle2 },
            { label: t("Total milestones", "कुल मील के पत्थर"), value: stats.milestones, icon: Target },
          ].map((k) => (
            <Card key={k.label} className="institution-panel">
              <CardContent className="space-y-1.5 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                  <k.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : visible.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((p) => <ProjectCard key={p.id} project={p} isHi={isHi} onOpen={() => setDetailId(p.id)} />)}
        </div>
      ) : (
        <Card className="institution-panel-muted">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50"><FlaskConical className="h-7 w-7 text-muted-foreground/40" /></span>
            <p className="text-sm font-medium text-muted-foreground">{t("No projects in this view.", "इस दृश्य में कोई परियोजना नहीं।")}</p>
            {canManage && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> {t("Propose a project", "परियोजना प्रस्तावित करें")}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProjectDetailDialog projectId={detailId} open={!!detailId} onOpenChange={(v) => !v && setDetailId(null)} canManage={permissions.canUpdateProject} />
    </motion.div>
  );
}

function ProjectCard({ project, isHi, onOpen }: { project: ResearchProject; isHi: boolean; onOpen: () => void }) {
  const t = useT();
  const s = PROJECT_STATUS_STYLE[project.status];
  return (
    <Card className="institution-panel group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md" onClick={onOpen}>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-bold leading-tight text-foreground group-hover:text-primary">{isHi ? (project.titleHi || project.title) : project.title}</h3>
          <Badge variant="outline" className={cn("shrink-0 text-[10px]", s.className)}>{isHi ? s.labelHi : s.labelEn}</Badge>
        </div>
        {project.objective && <p className="line-clamp-2 text-xs leading-5 text-muted-foreground">{project.objective}</p>}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">{project.milestoneCount} {t("milestones", "मील के पत्थर")}</span>
            <span className="font-semibold text-foreground">{project.progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progress}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            {project.leadName ? <><User className="h-3 w-3" /> {project.leadName}</> : t("No lead assigned", "कोई प्रमुख नहीं")}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </CardContent>
    </Card>
  );
}
