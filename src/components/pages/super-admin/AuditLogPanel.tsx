"use client";

import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Search, ShieldAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import { DataTable } from "@/components/ui/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/context/AppContext";
import { useAuditLogs } from "@/hooks/api/use-audit-logs";
import type { AuditLogEntry } from "@/lib/api/audit-logs";
import { useT } from "@/lib/useT";

const PAGE_SIZE = 50;

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

  const filters: Record<string, string> = actionFilter
    ? { action: actionFilter, page: String(page), limit: String(PAGE_SIZE) }
    : { page: String(page), limit: String(PAGE_SIZE) };
  const { data, isLoading } = useAuditLogs(filters);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const columns = useMemo<ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        accessorKey: "action",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("Action", "क्रिया")} />,
        cell: ({ row }) => {
          const action = row.original.action;
          return (
            <div className="min-w-36 space-y-1.5">
              <Badge className={`text-[10px] ${ACTION_COLORS[action] ?? "bg-muted text-muted-foreground"}`}>
                {ACTION_LABELS[action]?.[lang === "hi" ? "hi" : "en"] ?? action}
              </Badge>
              {row.original.changeSummary ? (
                <p className="max-w-64 leading-relaxed text-muted-foreground">{row.original.changeSummary}</p>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "actor",
        accessorFn: (row) => row.actorEmail ?? row.actorIp ?? t("System", "सिस्टम"),
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("Actor", "कर्ता")} />,
        cell: ({ getValue }) => <span className="whitespace-nowrap text-foreground/80">{getValue<string>()}</span>,
      },
      {
        accessorKey: "entityType",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("Record", "अभिलेख")} />,
        cell: ({ row }) =>
          row.original.entityType ? (
            <div className="min-w-28">
              <p className="font-medium capitalize text-foreground/80">{row.original.entityType}</p>
              {row.original.entityId ? (
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{row.original.entityId.slice(0, 8)}…</p>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => <DataTableColumnHeader column={column} title={t("Time", "समय")} />,
        cell: ({ getValue }) => (
          <time className="block min-w-36 whitespace-nowrap text-muted-foreground" dateTime={getValue<string>()}>
            {new Date(getValue<string>()).toLocaleString(lang === "hi" ? "hi-IN" : "en-IN")}
          </time>
        ),
      },
    ],
    [lang, t],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle className="text-lg font-semibold">{t("Audit Logs", "ऑडिट लॉग")}</CardTitle>
          <Badge variant="outline" className="text-xs">{total}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Select
            value={actionFilter || "all"}
            onValueChange={(value) => {
              setActionFilter(value === "all" ? "" : value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-64">
              <SelectValue placeholder={t("All actions", "सभी क्रियाएँ")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All actions", "सभी क्रियाएँ")}</SelectItem>
              {Object.entries(ACTION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{t(label.en, label.hi)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          pageIndex={page - 1}
          pageSize={PAGE_SIZE}
          pageCount={totalPages}
          totalRows={total}
          onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          labels={{
            page: t("Page", "पृष्ठ"),
            of: t("of", "का"),
            previousPage: t("Previous", "पिछला"),
            nextPage: t("Next", "अगला"),
          }}
          emptyState={(
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ShieldAlert className="h-8 w-8 opacity-45" aria-hidden="true" />
              <p className="text-sm">{t("No audit logs found.", "कोई ऑडिट लॉग नहीं मिला।")}</p>
            </div>
          )}
        />
      </CardContent>
    </Card>
  );
}
