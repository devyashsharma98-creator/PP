"use client";

import { useQuery } from "@tanstack/react-query";

interface ReminderItem {
  type: "task" | "event";
  id: string;
  title: string;
  titleHi: string | null;
  date: string;
  status: string;
  href: string;
}

export interface ReminderData {
  overdue: ReminderItem[];
  dueThisWeek: ReminderItem[];
  upcoming: ReminderItem[];
  counts: { overdue: number; dueThisWeek: number; upcoming: number };
}

async function fetchReminders(): Promise<ReminderData> {
  const res = await fetch("/api/v1/reminders");
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Failed to load reminders");
  return json.data as ReminderData;
}

export function useReminders() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: fetchReminders,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
