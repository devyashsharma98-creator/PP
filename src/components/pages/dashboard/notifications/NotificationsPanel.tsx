"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Eye, EyeOff, RefreshCw, ArrowLeft, ArrowRight, Clock, ChevronRight } from "lucide-react";

import { useNotifications, useUnreadCount, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/api/use-notifications";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { AppIcon } from "@/components/ui/AppIcon";
import { NOTIFICATION_KINDS, getNotificationKind } from "@/lib/app/icon-map";
import { resolveNotificationLink, type Notification } from "@/lib/api/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function timeAgo(dateStr: string, lang: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return lang === "hi" ? "अभी" : "Just now";
  if (mins < 60) return lang === "hi" ? `${mins} मिनट पहले` : `${mins}m ago`;
  if (hours < 24) return lang === "hi" ? `${hours} घंटे पहले` : `${hours}h ago`;
  if (days < 7) return lang === "hi" ? `${days} दिन पहले` : `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationsPanel() {
  const { lang } = useAppContext();
  const t = useT();
  const router = useRouter();

  const [tab, setTab] = useState("all");
  const [kindFilter, setKindFilter] = useState("all");
  const [page, setPage] = useState(1);

  const isUnread = tab === "unread";
  const filters = { is_read: isUnread ? false : undefined, kind: kindFilter !== "all" ? kindFilter : undefined, page, limit: 20 };

  const { data: notifications = [], isLoading, isError } = useNotifications(filters);
  const { data: unreadCount = 0 } = useUnreadCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = async (id: string) => {
    try { await markRead.mutateAsync(id); } catch { return; }
  };

  const handleMarkAllRead = async () => {
    try { await markAllRead.mutateAsync(); } catch { return; }
  };

  const handleOpen = (n: Notification) => {
    if (!n.isRead) handleMarkRead(n.id);
    const link = resolveNotificationLink(n);
    if (link) router.push(link);
  };

  return (
    <Card id="notifications" className="mt-6 scroll-mt-24">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">
            {t("Notifications", "सूचनाएं")}
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">{unreadCount} {t("new", "नई")}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {kindFilter !== "all" && (
            <Button variant="ghost" size="sm" onClick={() => { setKindFilter("all"); setPage(1); }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              {t("Clear filter", "फ़िल्टर हटाएं")}
            </Button>
          )}
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={markAllRead.isPending}>
              <CheckCheck className="h-4 w-4 mr-1" />
              {t("Mark all read", "सभी पढ़ी गई")}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="all" className="text-xs">
                {t("All", "सभी")}
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs relative">
                {t("Unread", "अपठित")}
                {unreadCount > 0 && (
                  <span className="ml-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-40">
            <Select value={kindFilter} onValueChange={(v) => { setKindFilter(v); setPage(1); }}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t("All kinds", "सभी प्रकार")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All kinds", "सभी प्रकार")}</SelectItem>
                {Object.entries(NOTIFICATION_KINDS).map(([k, cfg]) => (
                  <SelectItem key={k} value={k}>{t(cfg.label, cfg.labelHi)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("Failed to load notifications", "सूचनाएं लोड करने में विफल")}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {isUnread
                ? t("No unread notifications.", "कोई अपठित सूचना नहीं।")
                : t("No notifications yet.", "अभी तक कोई सूचना नहीं।")}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {notifications.map((n: Notification) => {
              const cfg = getNotificationKind(n.kind);
              const link = resolveNotificationLink(n);
              return (
                <button
                  key={n.id}
                  onClick={() => handleOpen(n)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/60 ${
                    n.isRead ? "opacity-60" : "bg-muted/30"
                  } ${link ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${n.isRead ? "bg-muted" : "bg-primary/10"}`}>
                    <AppIcon icon={cfg.icon} tone={cfg.tone} size="sm" label={t(cfg.label, cfg.labelHi)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm leading-snug ${n.isRead ? "" : "font-medium"}`}>
                        {n.title}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(n.createdAt, lang)}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {t(cfg.label, cfg.labelHi)}
                      </Badge>
                    </div>
                  </div>
                  {link ? (
                    <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-1" />
                  ) : n.isRead ? (
                    <EyeOff className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-primary/60 shrink-0 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("Previous", "पिछला")}
            </Button>
            <span className="text-xs text-muted-foreground">
              {t("Page", "पृष्ठ")} {page}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={notifications.length < 20}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("Next", "अगला")}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
