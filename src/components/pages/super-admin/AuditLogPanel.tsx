"use client";

import { useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, FileClock, Search, ShieldAlert, UserCheck } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useAuditLogs } from "@/hooks/api/use-audit-logs";
import { useT } from "@/lib/useT";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ACTION_LABELS: Record<string, { en: string; hi: string }> = {
  "auth.login_success": { en: "Login", hi: "लॉगिन" },
  "auth.login_failed": { en: "Failed Login", hi: "असफल लॉगिन" },
  "user.created": { en: "User Created", hi: "उपयोगकर्ता बनाया" },
  "user.updated": { en: "User Updated", hi: "उपयोगकर्ता अपडेट" },
  "user.deleted": { en: "User Deleted", hi: "उपयोगकर्ता हटाया" },
  "user.role_assigned": { en: "Role Assigned", hi: "भूमिका निर्धारित" },
  "user.role_removed": { en: "Role Removed", hi: "भूमिका हटाई" },
  "event.created": { en: "Event Created", hi: "कार्यक्रम बनाया" },
  "event.status_changed": { en: "Status Changed", hi: "स्थिति बदली" },
  "article.created": { en: "Article Created", hi: "लेख बनाया" },
  "article.status_changed": { en: "Article Status Changed", hi: "लेख स्थिति बदली" },
  "org.updated": { en: "Org Updated", hi: "संगठन अपडेट" },
};

const ACTION_COLORS: Record<string, string> = {
  "auth.login_success": "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "auth.login_failed": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  "user.created": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "user.deleted": "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  "event.created": "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "org.updated": "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
};

export function AuditLogPanel() {
  const { lang } = useAppContext();
  const t = useT();
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");

  const { data, isLoading } = useAuditLogs(actionFilter ? { action: actionFilter, page: String(page), limit: "50" } : { page: String(page), limit: "50" });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);
  const failedLogins = rows.filter((row) => row.action === "auth.login_failed").length;
  const userChanges = rows.filter((row) => row.action.startsWith("user.")).length;
  const sensitiveChanges = rows.filter((row) => ["user.role_assigned", "user.role_removed", "user.deleted", "org.updated"].includes(row.action)).length;
  const recentActivity = rows.slice(0, 3);
  const summaryCards = [
    { icon: ShieldAlert, label: t("Recent logs", "हाल के अभिलेख"), value: total, detail: t("Total audit entries in this page.", "इस पृष्ठ में कुल ऑडिट प्रविष्टियाँ।") },
    { icon: AlertTriangle, label: t("Failed logins", "असफल लॉगिन"), value: failedLogins, detail: t("Watch repeated failed attempts.", "बार-बार असफल प्रयासों पर नज़र रखें।") },
    { icon: UserCheck, label: t("User changes", "उपयोगकर्ता बदलाव"), value: userChanges, detail: t("Created, updated, deleted, or role changes.", "बने, बदले, हटाए या भूमिका बदलाव।") },
    { icon: FileClock, label: t("Sensitive actions", "संवेदनशील क्रियाएँ"), value: sensitiveChanges, detail: t("Role, delete, and org-level changes.", "भूमिका, हटाना और संगठन स्तर के बदलाव।") },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">{t("Audit Logs", "ऑडिट लॉग")}</CardTitle>
          <Badge variant="outline" className="text-xs">{total}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{card.detail}</p>
              </div>
            );
          })}
        </div>

        {recentActivity.length > 0 && (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{t("Recent activity", "हाल की गतिविधि")}</p>
            <div className="mt-3 space-y-2">
              {recentActivity.map((row) => (
                <p key={row.id} className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{row.actorEmail ?? row.actorIp ?? t("System", "सिस्टम")}</span>{" "}
                  {ACTION_LABELS[row.action]?.[lang === "hi" ? "hi" : "en"] ?? row.action}
                </p>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className="w-56"><SelectValue placeholder={t("All actions", "सभी क्रियाएँ")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All actions", "सभी क्रियाएँ")}</SelectItem>
              {Object.entries(ACTION_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{t(v.en, v.hi)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("No audit logs found.", "कोई ऑडिट लॉग नहीं मिला।")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {rows.map((r) => (
                <div key={r.id} className="p-2.5 rounded border text-xs space-y-1 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] ${ACTION_COLORS[r.action] ?? "bg-muted text-muted-foreground"}`}>
                        {ACTION_LABELS[r.action]?.[lang === "hi" ? "hi" : "en"] ?? r.action}
                      </Badge>
                      <span className="text-muted-foreground">{r.actorEmail ?? r.actorIp ?? t("System", "सिस्टम")}</span>
                    </div>
                    <span className="text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</span>
                  </div>
                  {r.changeSummary && <p className="text-muted-foreground mt-1">{r.changeSummary}</p>}
                  {r.entityType && <p className="text-muted-foreground">{r.entityType}: {r.entityId?.slice(0, 8)}...</p>}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">{t("Page", "पृष्ठ")} {page} {t("of", "का")} {totalPages}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
