"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Building2, ChevronDown, ChevronRight, Crown, MapPin, Layers, User } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useOrg, useUpdateOrg } from "@/hooks/api/use-org";
import { useOrgStructure, type OrgStructureDepartment } from "@/hooks/api/use-org-structure";
import { useT } from "@/lib/useT";
import { useToast } from "@/components/ToastProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const UNIT_KIND_CONFIG: Record<string, { label: string; labelHi: string; color: string; bg: string; border: string }> = {
  kshetra: { label: "Kshetra", labelHi: "क्षेत्र", color: "text-amber-600", bg: "bg-amber-500/10", border: "border-amber-500/25" },
  vibhag:  { label: "Vibhag",  labelHi: "विभाग",   color: "text-primary",     bg: "bg-primary/10",     border: "border-primary/25" },
  prant:   { label: "Prant",   labelHi: "प्रांत",   color: "text-blue-600",    bg: "bg-blue-500/10",    border: "border-blue-500/25" },
  shakha:  { label: "Shakha",  labelHi: "शाखा",    color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  other:   { label: "Unit",    labelHi: "इकाई",    color: "text-muted-foreground", bg: "bg-muted/30", border: "border-border/60" },
};

const DEPT_KIND_CONFIG: Record<string, { color: string; bg: string }> = {
  vimarsh: { color: "text-violet-600", bg: "bg-violet-500/10" },
  shodh:   { color: "text-blue-600",   bg: "bg-blue-500/10" },
  prachar: { color: "text-emerald-600",bg: "bg-emerald-500/10" },
  yuva:    { color: "text-orange-600", bg: "bg-orange-500/10" },
  mahila:  { color: "text-rose-600",   bg: "bg-rose-500/10" },
  other:   { color: "text-muted-foreground", bg: "bg-muted/20" },
};

const UNIT_KIND_ORDER = ["kshetra", "vibhag", "prant", "shakha", "other"];

export function OrgSettingsPanel() {
  const { lang } = useAppContext();
  const t = useT();
  const isHi = lang === "hi";
  const { addToast } = useToast();
  const { data: org, isLoading: orgLoading } = useOrg();
  const { data: structure, isLoading: structureLoading } = useOrgStructure();
  const updateMutation = useUpdateOrg();

  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (org) {
      setName(org.name ?? "");
      setNameHi(org.nameHi ?? "");
    }
  }, [org]);

  const handleSave = useCallback(async () => {
    if (updateMutation.isPending) return;
    try {
      await updateMutation.mutateAsync({
        name: name.trim() || undefined,
        nameHi: nameHi.trim() || undefined,
      });
      addToast(t("Org settings updated!", "संगठन सेटिंग अपडेट!"), "success");
    } catch {
      addToast(t("Failed to update org settings.", "संगठन सेटिंग अपडेट करने में विफल।"), "error");
    }
  }, [name, nameHi, updateMutation, t, addToast]);

  const toggleUnit = (id: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const unitsByKind = useMemo(() => {
    if (!structure) return [];
    const grouped: Record<string, typeof structure.units> = {};
    for (const unit of structure.units) {
      const kind = unit.unitKind ?? "other";
      (grouped[kind] ??= []).push(unit);
    }
    return UNIT_KIND_ORDER
      .filter((k) => grouped[k]?.length)
      .map((kind) => ({ kind, units: grouped[kind] }));
  }, [structure]);

  const deptsByUnit = useMemo(() => {
    if (!structure) return new Map<string | null, OrgStructureDepartment[]>();
    const map = new Map<string | null, OrgStructureDepartment[]>();
    for (const dept of structure.departments) {
      const key = dept.unitId ?? null;
      const list = map.get(key) ?? [];
      list.push(dept);
      map.set(key, list);
    }
    return map;
  }, [structure]);

  const totalUnits = structure?.units.length ?? 0;
  const totalDepts = structure?.departments.length ?? 0;

  return (
    <div className="space-y-6">
      {/* ── Org Identity ─────────────────────────────────────────────── */}
      <Card className="institution-panel">
        <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3 border-b border-border/60">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">{t("Organisation Identity", "संगठन पहचान")}</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          {orgLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" /><Skeleton className="h-10" />
              </div>
            </div>
          ) : org ? (
            <div className="space-y-4 max-w-lg">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">{t("Org Code", "संगठन कोड")}:</span>
                <span className="font-mono bg-muted/50 px-2 py-0.5 rounded-lg border border-border/50">{org.orgCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("Name (EN)", "नाम (EN)")}</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{t("Name (HI)", "नाम (HI)")}</Label>
                  <Input value={nameHi} onChange={(e) => setNameHi(e.target.value)} className="font-devanagari" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button onClick={handleSave} disabled={updateMutation.isPending} size="sm">
                  {t("Save", "सहेजें")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-sm text-muted-foreground">
              {t("Failed to load org settings.", "संगठन सेटिंग लोड करने में विफल।")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── Org Hierarchy Tree ───────────────────────────────────────── */}
      <Card className="institution-panel">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">{t("Organisational Hierarchy", "संगठन संरचना")}</CardTitle>
          </div>
          {!structureLoading && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{totalUnits} {t("units", "इकाइयाँ")}</span>
              <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{totalDepts} {t("aayams", "आयाम")}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="pt-5">
          {structureLoading ? (
            <div className="space-y-3">
              {[1,2,3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
            </div>
          ) : !structure ? (
            <p className="text-center py-8 text-sm text-muted-foreground">
              {t("Failed to load hierarchy.", "संरचना लोड करने में विफल।")}
            </p>
          ) : (
            <div className="space-y-6">
              {/* Org root node */}
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-primary/25 bg-primary/5">
                <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground">{isHi ? (structure.org.nameHi ?? structure.org.name) : structure.org.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{structure.org.orgCode}</p>
                </div>
                <Badge className="ml-auto text-[10px] bg-primary/10 text-primary border-0 font-bold uppercase tracking-widest">
                  {t("Root", "मूल")}
                </Badge>
              </div>

              {/* Aayams not tied to any unit */}
              {(deptsByUnit.get(null) ?? []).length > 0 && (
                <div className="space-y-2 pl-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t("Org-level Aayams", "संस्था-स्तरीय आयाम")}</p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {(deptsByUnit.get(null) ?? []).map((dept: OrgStructureDepartment) => {
                      const dcfg = DEPT_KIND_CONFIG[dept.departmentKind] ?? DEPT_KIND_CONFIG.other;
                      const head = structure?.heads[dept.id];
                      return (
                        <div key={dept.id} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/60", dcfg.bg)}>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-xs font-bold", dcfg.color)}>{isHi ? (dept.nameHi ?? dept.name) : dept.name}</p>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3" />
                              {head ?? t("No head assigned", "प्रमुख नियुक्त नहीं")}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Units grouped by kind */}
              {unitsByKind.map(({ kind, units }) => {
                const ucfg = UNIT_KIND_CONFIG[kind] ?? UNIT_KIND_CONFIG.other;
                return (
                  <div key={kind} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-px flex-1", "bg-border/50")} />
                      <Badge className={cn("text-[10px] font-bold uppercase tracking-widest border-0 px-2.5 py-0.5", ucfg.bg, ucfg.color)}>
                        {isHi ? ucfg.labelHi : ucfg.label} · {units.length}
                      </Badge>
                      <div className={cn("h-px flex-1", "bg-border/50")} />
                    </div>
                    <div className="space-y-2 pl-4">
                      {units.map((unit) => {
                        const aayams = deptsByUnit.get(unit.id) ?? [];
                        const isExpanded = expandedUnits.has(unit.id);
                        return (
                          <div key={unit.id} className={cn(
                            "rounded-2xl border transition-all duration-200 overflow-hidden",
                            isExpanded ? "border-primary/25 bg-background/60" : "border-border/60 bg-background/40 hover:border-primary/20"
                          )}>
                            <button
                              type="button"
                              className="w-full flex items-center gap-3 px-4 py-3 text-left"
                              onClick={() => toggleUnit(unit.id)}
                            >
                              <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0", ucfg.bg, ucfg.border, "border")}>
                                <MapPin className={cn("w-3.5 h-3.5", ucfg.color)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground/90 truncate">
                                  {isHi ? (unit.nameHi ?? unit.name) : unit.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground font-mono">{unit.code}</p>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {aayams.length > 0 && (
                                  <Badge variant="outline" className="text-[10px] gap-1 py-0">
                                    <Layers className="w-3 h-3" />{aayams.length}
                                  </Badge>
                                )}
                                {aayams.length > 0 ? (
                                  isExpanded
                                    ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                ) : null}
                              </div>
                            </button>

                            {isExpanded && aayams.length > 0 && (
                              <div className="border-t border-border/40 px-4 pb-4 pt-3 bg-muted/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                  {t("Aayams", "आयाम")}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {aayams.map((dept: OrgStructureDepartment) => {
                                    const dcfg = DEPT_KIND_CONFIG[dept.departmentKind] ?? DEPT_KIND_CONFIG.other;
                                    const head = structure?.heads[dept.id];
                                    return (
                                      <div key={dept.id} className={cn("flex items-center gap-3 px-3 py-2 rounded-xl border border-border/50", dcfg.bg)}>
                                        <div className="min-w-0 flex-1">
                                          <p className={cn("text-xs font-bold", dcfg.color)}>{isHi ? (dept.nameHi ?? dept.name) : dept.name}</p>
                                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <User className="w-3 h-3" />
                                            {head ?? t("No head assigned", "प्रमुख नियुक्त नहीं")}
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {isExpanded && aayams.length === 0 && (
                              <div className="border-t border-border/40 px-4 py-3 bg-muted/10 text-xs text-muted-foreground">
                                {t("No aayams assigned to this unit.", "इस इकाई में कोई आयाम नहीं है।")}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {unitsByKind.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {t("No units found in this organisation.", "इस संगठन में कोई इकाई नहीं मिली।")}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
