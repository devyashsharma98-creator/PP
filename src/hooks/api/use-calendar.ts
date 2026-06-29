"use client";

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/events';
import { queryKeys } from '@/lib/query-client';
import type { GatividhiEvent, EventStatus } from '@/lib/app/contracts';
import { dbToUiEventStatus } from '@/lib/app/status-maps';

export function mapApiEventToGatividhi(row: Record<string, unknown>): GatividhiEvent {
  const status = (dbToUiEventStatus[row.status as string] ?? "Draft") as EventStatus;
  const startsAt = row.startsAt ?? row.starts_at;
  const metadata = (row.metadata ?? null) as Record<string, unknown> | null;
  return {
    id: row.id as string,
    eventType: (metadata?.eventType as string | undefined) ?? null,
    title: row.title as string,
    description: (row.description as string) ?? "",
    date: "",
    dateIso: startsAt instanceof Date ? startsAt.toISOString() : startsAt as string | undefined,
    unitId: (row.unitId ?? row.unit_id) as string | undefined,
    departmentId: (row.departmentId ?? row.department_id) as string | undefined,
    departmentCode: (row.departmentCode ?? row.department_code) as string | undefined,
    unit: (row.unitName ?? row.unit_name ?? "") as string,
    submittedBy: (row.submittedByNameSnapshot ?? row.created_by_name ?? "") as string,
    status,
    checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
  };
}

export function buildCalendarEventsPath(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  params.set("limit", "100");
  if (fromDate) params.set("fromDate", fromDate);
  if (toDate) params.set("toDate", toDate);
  return `/events?${params.toString()}`;
}

export function useCalendarEvents(fromDate?: string, toDate?: string) {
  const path = buildCalendarEventsPath(fromDate, toDate);

  return useQuery({
    queryKey: queryKeys.calendarEvents({ fromDate, toDate }),
    queryFn: async () => {
      const data = await fetchApi<Record<string, unknown>[]>(path);
      return data.map(mapApiEventToGatividhi).filter((e) => {
        if (!e.dateIso) return false;
        const d = new Date(e.dateIso);
        return !Number.isNaN(d.getTime());
      });
    },
    staleTime: 30000,
  });
}
