"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarDays, PenLine, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useUnreadCount } from "@/hooks/api/use-notifications";
import type { NotificationItem } from "./useNavbarNotifications";

interface NotificationBellProps {
  isAuthenticated: boolean;
  notifications: NotificationItem[];
  lang: string;
}

export function NotificationBell({ isAuthenticated, notifications, lang }: NotificationBellProps) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [bounce, setBounce] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const prevCount = useRef(0);
  const { data: unreadCount = 0 } = useUnreadCount(isAuthenticated);
  const total = Math.max(unreadCount, notifications.length);

  useEffect(() => {
    if (total > prevCount.current) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 600);
      return () => clearTimeout(timer);
    }
    prevCount.current = total;
  }, [total]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => total > 0 && setOpen((o) => !o)}
        aria-label={t("Open notifications", "सूचनाएँ खोलें")}
        className={cn("relative rounded-full p-2 transition-colors hover:bg-muted", total > 0 ? "cursor-pointer" : "cursor-default", bounce && "animate-badge-bounce")}
      >
        <Bell className="w-5 h-5 text-muted-foreground" />
        {total > 0 && (
          <>
            <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
              <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1 shadow-md shadow-primary/30">
              {total}
            </span>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-popover shadow-xl z-50"
          >
            <div className="sticky top-0 bg-popover border-b border-border/60 px-4 py-3 flex items-center justify-between">
              <h3 className={cn("text-sm font-semibold", lang === "hi" && "font-devanagari")}>{t("Notifications", "सूचनाएं")}</h3>
              <Badge variant="outline" className="text-[10px]">{total}</Badge>
            </div>
            <div className="p-2 space-y-1">
              {notifications.map((n) => (
                <Link key={n.id} href={n.link} prefetch={false} onClick={() => setOpen(false)} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors group">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", n.type === "event" ? "bg-primary/10" : "bg-blue-500/10")}>
                    {n.type === "event" ? <CalendarDays className="w-3.5 h-3.5 text-primary" /> : <PenLine className="w-3.5 h-3.5 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate group-hover:text-foreground">{n.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {lang === "hi"
                        ? (n.type === "event" ? "कार्यक्रम — समीक्षा प्रतीक्षित" : "आलेख — समीक्षा प्रतीक्षित")
                        : (n.type === "event" ? "Event — Review pending" : "Article — Review pending")}
                    </p>
                  </div>
                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                </Link>
              ))}
            </div>
            <div className="border-t border-border/60 px-4 py-2.5">
              <Link href="/dashboard" prefetch={false} onClick={() => setOpen(false)} className={cn("text-xs text-primary hover:underline", lang === "hi" && "font-devanagari")}>
                {t("View all in Dashboard →", "डैशबोर्ड में सब देखें →")}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
