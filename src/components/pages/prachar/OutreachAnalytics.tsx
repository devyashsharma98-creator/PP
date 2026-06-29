"use client";

import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, Clock3, SkipForward } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useOutreachAnalytics } from "@/hooks/api/use-outreach";
import { outreachColor, outreachIcon } from "@/lib/app/outreach-style";

export function OutreachAnalytics() {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { data, isLoading } = useOutreachAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    { label: t("Completion rate", "पूर्णता दर"), value: `${data.completionRate}%`, icon: TrendingUp, tone: "text-primary" },
    { label: t("Completed", "पूर्ण"), value: data.completed, icon: CheckCircle2, tone: "text-emerald-600" },
    { label: t("Open", "खुले"), value: data.pending, icon: Clock3, tone: "text-amber-600" },
    { label: t("Skipped", "छोड़े"), value: data.skipped, icon: SkipForward, tone: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="institution-panel">
            <CardContent className="space-y-1.5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{k.label}</p>
                <k.icon className={cn("h-4 w-4", k.tone)} />
              </div>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="institution-panel">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="section-seal">{t("By Outreach Type", "प्रसार प्रकार अनुसार")}</p>
            <h3 className="dashboard-section-heading">{t("Completion by type", "प्रकार अनुसार पूर्णता")}</h3>
          </div>

          {data.perType.every((p) => p.total === 0) ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {t("No outreach recorded yet.", "अभी कोई प्रसार दर्ज नहीं।")}
            </p>
          ) : (
            <div className="space-y-4">
              {data.perType.map((p, i) => {
                const c = outreachColor(p.color);
                const Icon = outreachIcon(p.icon);
                return (
                  <motion.div
                    key={p.type}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-6 w-6 items-center justify-center rounded-md border", c.bg, c.border)}>
                          <Icon className={cn("h-3.5 w-3.5", c.text)} />
                        </span>
                        <span className="text-sm font-medium text-foreground">{isHi ? p.labelHi : p.labelEn}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {p.completed}/{p.total - p.skipped} {t("done", "पूर्ण")}
                        {p.total > 0 && <span className="ml-2 font-semibold text-foreground">{p.completionRate}%</span>}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div className={cn("h-full rounded-full transition-all", c.dot)} style={{ width: `${p.completionRate}%` }} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
