"use client";

import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api/events';
import { queryKeys } from '@/lib/query-client';
import type { GatividhiEvent, EventStatus } from '@/lib/app/contracts';
import { dbToUiEventStatus } from '@/lib/app/status-maps';

function mapApiEventToGatividhi(row: Record<string, unknown>): GatividhiEvent {
  const status = (dbToUiEventStatus[row.status as string] ?? "Draft") as EventStatus;
  return {
    id: row.id as string,
    title: row.title as string,
    description: (row.description as string) ?? "",
    date: "",
    dateIso: row.starts_at as string | undefined,
    unitId: row.unit_id as string | undefined,
    departmentId: row.department_id as string | undefined,
    departmentCode: row.department_code as string | undefined,
    unit: row.unit_name as string ?? "",
    submittedBy: row.created_by_name as string ?? "",
    status,
    checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
  };
}

export function useCalendarEvents(fromDate?: string, toDate?: string) {
  const params = new URLSearchParams();
  params.set("limit", "200");
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.calendarEvents(qs ? { fromDate, toDate } : undefined),
    queryFn: async () => {
      const data = await fetchApi<Record<string, unknown>[]>(`/events?${qs}`);
      return data.map(mapApiEventToGatividhi).filter((e) => {
        if (!e.dateIso) return false;
        const d = new Date(e.dateIso);
        return !Number.isNaN(d.getTime());
      });
    },
    staleTime: 30000,
  });
}
