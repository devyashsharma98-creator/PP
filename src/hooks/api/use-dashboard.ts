"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import type { GatividhiEvent, FormConfig } from '@/context/AppContext';

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
  const dateStr = row.starts_at as string;
  let dateFormatted = dateStr;
  let dateIso = dateStr;
  try {
    const d = parseISO(dateStr);
    dateFormatted = format(d, 'dd MMM yyyy');
    dateIso = d.toISOString();
  } catch { /* keep raw */ }

  return {
    id: row.id as string,
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    date: dateFormatted,
    dateIso,
    unit: (row.unit_id as string) || 'Unknown',
    submittedBy: 'API',
    status: ((row.status as string) || 'Draft') as GatividhiEvent['status'],
    checklist: { designing: false, food: false, seating: false, transport: false, accommodation: false, soundMic: false, camera: false, screen: false, lights: false },
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
  return useMutation({
    mutationFn: async (input: { title: string; description: string; starts_at: string; unit_id?: string; department_id?: string }) => {
      return fetchApi<Record<string, unknown>>('/events', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
    },
  });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      return fetchApi<Record<string, unknown>>(`/events/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
    },
  });
}
