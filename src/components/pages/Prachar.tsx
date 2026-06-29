"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Megaphone, Inbox } from "lucide-react";

import { Masthead } from "@/components/Masthead";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useAppContext } from "@/context/AppContext";
import { useOutreachItems, useOutreachTypes, useOutreachAnalytics } from "@/hooks/api/use-outreach";
import { outreachColor, outreachIcon } from "@/lib/app/outreach-style";
import { OutreachCard } from "@/components/pages/prachar/OutreachCard";
import { CreateOutreachDialog } from "@/components/pages/prachar/CreateOutreachDialog";
import { OutreachAnalytics } from "@/components/pages/prachar/OutreachAnalytics";

type StatusTab = "open" | "completed" | "all" | "analytics";

export default function Prachar() {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { permissions } = useAppContext();
  const canAct = permissions.canUpdatePrachar;

  const [tab, setTab] = useState<StatusTab>("open");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: types = [] } = useOutreachTypes();
  const { data: items = [], isLoading } = useOutreachItems(typeFilter ? { type: typeFilter } : {});
  const { data: analytics } = useOutreachAnalytics();

  const typeByKey = useMemo(() => new Map(types.map((ty) => [ty.type, ty])), [types]);

  const visible = useMemo(() => {
    if (tab === "completed") return items.filter((i) => i.status === "completed");
    if (tab === "open") return items.filter((i) => i.status === "pending" || i.status === "in_progress");
    return items; // "all"
  }, [items, tab]);

  const contexts = [
    {
      labelEn: "Outreach in motion", labelHi: "गतिमान प्रसार",
      valueEn: `${analytics?.pending ?? 0} open items`, valueHi: `${analytics?.pending ?? 0} खुले कार्य`,
      detailEn: "Journals, conferences, campus programmes, and circulars awaiting action.",
      detailHi: "पत्रिकाएँ, सम्मेलन, परिसर कार्यक्रम एवं परिपत्र कार्रवाई की प्रतीक्षा में।",
    },
    {
      labelEn: "Completion", labelHi: "पूर्णता",
      valueEn: `${analytics?.completionRate ?? 0}% completed`, valueHi: `${analytics?.completionRate ?? 0}% पूर्ण`,
      detailEn: "Share of actionable outreach that has been carried through.",
      detailHi: "क्रियाशील प्रसार का वह अंश जो पूर्ण किया जा चुका है।",
    },
    {
      labelEn: "Action rights", labelHi: "कार्य अधिकार",
      valueEn: canAct ? "Create and close outreach" : "View-only oversight",
      valueHi: canAct ? "प्रसार बनाएँ एवं पूर्ण करें" : "केवल अवलोकन",
      detailEn: canAct ? "Track each outreach to completion or note why it was skipped." : "Final closure stays with the responsible desk.",
      detailHi: canAct ? "प्रत्येक प्रसार को पूर्णता तक ले जाएँ या स्किप का कारण दर्ज करें।" : "अंतिम समापन जिम्मेदार कक्ष करेगा।",
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-10">
      <Masthead
        compact
        seal="Prachar — Academic Outreach"
        sealHi="प्रचार — शैक्षिक प्रसार"
        title="Carry the Work into the World"
        titleHi="कार्य को जगत तक पहुँचाएँ"
        contexts={contexts}
        actions={canAct ? (
          <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> {t("New Outreach", "नया प्रसार")}
          </Button>
        ) : undefined}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as StatusTab)}>
        <TabsList className="h-9 w-full justify-start gap-1 overflow-x-auto rounded-xl border border-border/50 bg-muted/30 p-1">
          {([
            ["open", t("Open", "खुले")],
            ["completed", t("Completed", "पूर्ण")],
            ["all", t("All", "सभी")],
            ["analytics", t("Analytics", "विश्लेषण")],
          ] as const).map(([v, label]) => (
            <TabsTrigger key={v} value={v} className="h-7 rounded-lg px-3 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "analytics" ? (
        <OutreachAnalytics />
      ) : (
        <>
          {/* Type filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTypeFilter(null)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                !typeFilter ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {t("All types", "सभी प्रकार")}
            </button>
            {types.map((ty) => {
              const c = outreachColor(ty.color);
              const Icon = outreachIcon(ty.icon);
              const active = typeFilter === ty.type;
              return (
                <button
                  key={ty.type}
                  onClick={() => setTypeFilter(active ? null : ty.type)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    active ? cn(c.bg, c.border, c.text) : "border-border/60 text-muted-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" /> {isHi ? ty.labelHi : ty.labelEn}
                </button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
            </div>
          ) : visible.length > 0 ? (
            <div className="space-y-3">
              {visible.map((item) => (
                <OutreachCard key={item.id} item={item} typeDef={typeByKey.get(item.outreachType)} canAct={canAct} />
              ))}
            </div>
          ) : (
            <Card className="institution-panel-muted">
              <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                  {tab === "completed" ? <Megaphone className="h-7 w-7 text-muted-foreground/40" /> : <Inbox className="h-7 w-7 text-muted-foreground/40" />}
                </span>
                <p className="text-sm font-medium text-muted-foreground">
                  {tab === "completed"
                    ? t("No completed outreach yet.", "अभी कोई पूर्ण प्रसार नहीं।")
                    : t("No outreach in this view.", "इस दृश्य में कोई प्रसार नहीं।")}
                </p>
                {canAct && tab !== "completed" && (
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-3.5 w-3.5" /> {t("Create the first outreach", "पहला प्रसार बनाएँ")}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <CreateOutreachDialog open={createOpen} onOpenChange={setCreateOpen} />
    </motion.div>
  );
}
