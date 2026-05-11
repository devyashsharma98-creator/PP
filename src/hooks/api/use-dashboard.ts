"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { useAppContext, type GatividhiEvent, type FormConfig, type VrittStatus } from '@/context/AppContext';
import { dbToUiEventStatus } from '@/lib/app/status-maps';
import { repairBrokenHindi } from '@/lib/useT';

const API_BASE = '/api/v1';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || 'API request failed');
  return data.data as T;
}

function mapApiEventToGatividhi(row: Record<string, unknown>): GatividhiEvent {
  const startsAt = row.startsAt ?? row.starts_at;
  const dateStr =
    startsAt instanceof Date
      ? startsAt.toISOString()
      : typeof startsAt === 'string'
        ? startsAt
        : '';
  let dateFormatted = dateStr || 'Date not set';
  let dateIso = dateStr;
  try {
    const d = parseISO(dateStr);
    dateFormatted = format(d, 'dd MMM yyyy');
    dateIso = d.toISOString();
  } catch { /* keep raw */ }

  return {
    id: row.id as string,
    title: repairBrokenHindi(String(row.title ?? '') || ''),
    description: repairBrokenHindi(String(row.description ?? '') || ''),
    date: dateFormatted,
    dateIso,
    unit: repairBrokenHindi(
      String((row.unitName ?? row.unit_name ?? row.unitId ?? row.unit_id) as string) || 'Unknown',
    ),
    submittedBy: repairBrokenHindi(String(row.submittedByNameSnapshot ?? '') || 'API'),
    status: (dbToUiEventStatus[String(row.status ?? '')] ?? 'Draft') as GatividhiEvent['status'],
    checklist: {
      designing: Boolean((row.checklist as Record<string, unknown> | undefined)?.designing),
      food: Boolean((row.checklist as Record<string, unknown> | undefined)?.food),
      seating: Boolean((row.checklist as Record<string, unknown> | undefined)?.seating),
      transport: Boolean((row.checklist as Record<string, unknown> | undefined)?.transport),
      accommodation: Boolean((row.checklist as Record<string, unknown> | undefined)?.accommodation),
      soundMic: Boolean((row.checklist as Record<string, unknown> | undefined)?.soundMic),
      camera: Boolean((row.checklist as Record<string, unknown> | undefined)?.camera),
      screen: Boolean((row.checklist as Record<string, unknown> | undefined)?.screen),
      lights: Boolean((row.checklist as Record<string, unknown> | undefined)?.lights),
    },
    registrations: [],
    polls: [],
    vrittStatus: undefined,
    vrittContent: undefined,
    vrittAttendanceCount: undefined,
    vrittMediaUrls: undefined,
    vrittCheckedInCount: undefined,
    formConfig: { fields: { phone: true, city: true, attendingCount: true, specialNeeds: true }, customQuestions: [] } as FormConfig,
  };
}

export function useDashboardEvents() {
  return useQuery({
    queryKey: ['dashboard-events'],
    queryFn: async () => {
      const data = await fetchApi<Record<string, unknown>[]>('/events?limit=100');
      return data.map(mapApiEventToGatividhi);
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useCreateDashboardEvent() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async (input: { title: string; description: string; startsAt: string; unitId?: string; departmentId?: string }) => {
      return fetchApi<Record<string, unknown>>('/events', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
      await refreshWorkspace();
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async ({ id, toStatus, notes }: { id: string; toStatus: string; notes?: string }) => {
      return fetchApi<Record<string, unknown>>(`/events/${id}/workflow`, {
        method: 'POST',
        body: JSON.stringify({ toStatus, notes }),
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
      await refreshWorkspace();
    },
  });
}

export function useUpdateVritt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, content, attendanceCount, mediaUrls, status }: {
      eventId: string;
      content?: string;
      attendanceCount?: number;
      mediaUrls?: string[];
      status: VrittStatus;
    }) => {
      return fetchApi<Record<string, unknown>>(`/events/${eventId}/vritt`, {
        method: 'POST',
        body: JSON.stringify({ content, attendanceCount, mediaUrls, status }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
    },
  });
}

export function useAddPoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, question, questionHi, pollType, options }: {
      eventId: string;
      question: string;
      questionHi?: string;
      pollType: 'date' | 'general';
      options: Array<{ label: string; labelHi?: string; scheduledAtIso?: string | null }>;
    }) => {
      return fetchApi<Record<string, unknown>>(`/events/${eventId}/polls`, {
        method: 'POST',
        body: JSON.stringify({ question, questionHi, pollType, options }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
    },
  });
}

export function useFinalizePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, pollId, winnerOptionId }: { eventId: string; pollId: string; winnerOptionId: string }) => {
      return fetchApi<Record<string, unknown>>(`/events/${eventId}/polls/${pollId}/finalize`, {
        method: 'POST',
        body: JSON.stringify({ winnerOptionId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
    },
  });
}
