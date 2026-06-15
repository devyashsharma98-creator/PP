"use client";

import { useMemo } from "react";
import type { Role } from "@/context/AppContext";

interface DashboardItem {
  id: string;
  title: string;
  status: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  type: "event" | "article";
  title: string;
  status: string;
  date: string;
  link: string;
}

const EVENT_PREDICATES: Partial<Record<Role, (status: string) => boolean>> = {
  aayam_pramukh: (s) => s === "Pending Aayam Review" || s === "Submitted by Unit",
  vibhag_pramukh: (s) => s === "Pending Vibhag Review" || s === "Pending Prant Authorization",
};

const ARTICLE_PREDICATES: Partial<Record<Role, (status: string) => boolean>> = {
  aayam_pramukh: (s) => s === "Pending Aayam Review",
  vibhag_pramukh: (s) => s === "Pending Vibhag Review" || s === "Pending Prant Authorization",
  unit_head: (s) => s === "Pending Unit Head Review",
};

/**
 * Build notification list from dashboard events/articles.
 * Time: O(e + a) — single pass over both arrays.
 * Space: O(n) — output array.
 */
export function useNavbarNotifications(
  role: Role,
  events: DashboardItem[],
  articles: DashboardItem[],
): NotificationItem[] {
  return useMemo(() => {
    const items: NotificationItem[] = [];
    const eventPred = EVENT_PREDICATES[role];
    const articlePred = ARTICLE_PREDICATES[role];

    if (eventPred) {
      for (const e of events) {
        if (eventPred(e.status)) {
          items.push({ id: e.id, type: "event", title: e.title, status: e.status, date: e.date, link: "/dashboard" });
        }
      }
    }

    if (articlePred) {
      for (const a of articles) {
        if (articlePred(a.status)) {
          items.push({ id: a.id, type: "article", title: a.title, status: a.status, date: a.date, link: "/aalekh" });
        }
      }
    }

    return items;
  }, [role, events, articles]);
}
