"use client";

import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { useAppContext, type GatividhiEvent, type FormConfig, type VrittStatus } from '@/context/AppContext';
import { dbToUiEventStatus } from '@/lib/app/status-maps';
import { filterOperationalEventRecords } from '@/lib/app/operational-record-filter';
import type { VrittAction, VrittActions } from '@/lib/app/vritt-access';
import {
  buildVrittRequest, EMPTY_VRITT_FORM, isVrittFormDirty, vrittFormFromStored,
  type StoredVritt, type VrittFormState,
} from '@/lib/app/vritt-payload';
import { repairBrokenHindi, useT } from '@/lib/useT';
import { useToast } from '@/components/ToastProvider';
import type {
  VrittActionErrorView, VrittSheetCommand, VrittSheetView,
} from '@/components/pages/dashboard/DashboardReviewOverlays';

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
    eventType: ((row.metadata as Record<string, unknown> | undefined)?.eventType as string | undefined) ?? null,
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
    // The list carries the report's status so cards and lanes are accurate; the
    // report itself is loaded by useVritt() when the sheet opens.
    vrittStatus: (['draft', 'submitted', 'reviewed'] as const).includes(
      (row.vrittStatus ?? row.vritt_status) as VrittStatus,
    )
      ? ((row.vrittStatus ?? row.vritt_status) as VrittStatus)
      : undefined,
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
      return filterOperationalEventRecords(data.map(mapApiEventToGatividhi));
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function useCreateDashboardEvent() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async (input: { title: string; description: string; startsAt: string; unitId?: string; departmentId?: string; checklist?: Record<string, boolean>; metadata?: Record<string, unknown> }) => {
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

/**
 * Error from the vritt endpoint, carrying the HTTP status so the sheet can tell
 * "somebody else changed this" (409) from "you may not" (403) from "invalid"
 * (400), and show the server's own explanation.
 */
export class VrittApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'VrittApiError';
  }
}

async function vrittRequest<T>(eventId: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/events/${eventId}/vritt`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new VrittApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new VrittApiError(body?.error?.message ?? 'The vritt request failed.', res.status);
  }
  return body.data as T;
}

export interface VrittView {
  vritt: StoredVritt | null;
  actions: VrittActions;
}

export const vrittQueryKey = (eventId: string) => ['vritt', eventId] as const;

/** The stored report and what this viewer may do to it — fetched when the sheet opens. */
export function useVritt(eventId: string | null) {
  return useQuery({
    queryKey: vrittQueryKey(eventId ?? ''),
    queryFn: () => vrittRequest<VrittView>(eventId as string),
    enabled: Boolean(eventId),
    staleTime: 0,
    // A focus refetch that picked up someone else's save would reload the form
    // under the person typing. Refresh happens on open and after each action.
    refetchOnWindowFocus: false,
    retry: (count, error) => !(error instanceof VrittApiError && [403, 404].includes(error.status)) && count < 2,
  });
}

/**
 * One mutation per action. The body is built by buildVrittRequest(), so saving
 * a draft carries content and every transition carries only its status (and,
 * for a review, notes).
 */
export function useVrittAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      eventId: string;
      action: VrittAction;
      form: VrittFormState;
      expectedStatus: VrittStatus | null;
      reviewNotes?: string;
    }) => {
      const body = buildVrittRequest(args.action, args);
      return vrittRequest<Record<string, unknown>>(args.eventId, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSettled: (_data, _error, args) => {
      // Refetch after failures too: a 409 means the screen is out of date.
      queryClient.invalidateQueries({ queryKey: vrittQueryKey(args.eventId) });
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
      options: Array<{ label: string; labelHi?: string; scheduledAt?: string | null }>;
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

export function useCloneEvent() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: async (eventId: string) => {
      return fetchApi<Record<string, unknown>>(`/events/${eventId}/clone`, {
        method: 'POST',
      });
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
      await refreshWorkspace();
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

// ── Vritt editor ─────────────────────────────────────────────────────────────

/**
 * Everything the report sheet needs, for one event.
 *
 * Loads the stored report and the actions the server allows, keeps the edits,
 * and turns each button into its own request: a draft save carries content,
 * every other action carries only its status (and, for a review, notes).
 */
export function useVrittEditor(event: { id: string } | null) {
  const t = useT();
  const { addToast } = useToast();
  const query = useVritt(event?.id ?? null);
  const mutation = useVrittAction();

  const [form, setForm] = useState<VrittFormState>(EMPTY_VRITT_FORM);
  const [reviewNotes, setReviewNotes] = useState('');
  const [pendingAction, setPendingAction] = useState<VrittSheetCommand | null>(null);
  const [actionError, setActionError] = useState<VrittActionErrorView | null>(null);

  const stored = query.data?.vritt ?? null;

  // Load the form from the server whenever a different version of the report
  // arrives: on open, after each action, and after a conflict reload. Never
  // seeded from the event list, which carries status only — a form built from
  // it would post empty content over the stored report.
  const storedVersion = query.data
    ? `${event?.id}:${stored?.status ?? 'none'}:${stored?.updatedAt ?? ''}`
    : null;
  useEffect(() => {
    if (storedVersion === null) return;
    setForm(vrittFormFromStored(stored));
    // `stored` is captured by storedVersion; keying on its identity would reset
    // the person's edits on every refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storedVersion]);

  const view: VrittSheetView = query.isPending
    ? { state: 'loading' }
    : query.isError
      ? {
          state: 'error',
          message: (query.error as Error).message,
          forbidden: query.error instanceof VrittApiError && query.error.status === 403,
          onRetry: () => void query.refetch(),
        }
      : { state: 'ready', stored, actions: query.data.actions };

  const isDirty = view.state === 'ready' && view.actions.saveDraft.allowed && isVrittFormDirty(form, stored);

  const describe = (error: unknown): VrittActionErrorView => {
    const detail = error instanceof Error ? error.message : undefined;
    const status = error instanceof VrittApiError ? error.status : -1;
    if (status === 409) {
      return { title: t('This report changed while you had it open.', 'आपके खोले रहते यह विवरण बदल गया।'), detail, stale: true };
    }
    if (status === 403) return { title: t('You are not allowed to do that.', 'आपको यह करने की अनुमति नहीं है।'), detail };
    if (status === 400) return { title: t('The report could not be accepted.', 'विवरण स्वीकार नहीं किया जा सका।'), detail };
    if (status === 0) return { title: t('You appear to be offline.', 'आप ऑफ़लाइन प्रतीत होते हैं।'), detail };
    return { title: t('The report could not be saved.', 'विवरण सहेजा नहीं जा सका।'), detail };
  };

  const runAction = async (command: VrittSheetCommand) => {
    if (!event || view.state !== 'ready' || pendingAction) return;
    const expected = stored?.status ?? null;
    const send = (action: VrittAction, expectedStatus: VrittStatus | null, formState: VrittFormState) =>
      mutation.mutateAsync({ eventId: event.id, action, form: formState, expectedStatus, reviewNotes });

    setPendingAction(command);
    setActionError(null);
    try {
      if (command === 'saveAndSubmit') {
        // Two requests, in order: the edits become the saved draft, then that
        // draft is what is submitted.
        await send('saveDraft', expected, form);
        await send('submit', 'draft', form);
      } else if (command === 'submitSaved') {
        const saved = vrittFormFromStored(stored);
        setForm(saved);
        await send('submit', expected, saved);
      } else {
        await send(command, expected, form);
      }

      const done: Record<VrittSheetCommand, [string, string]> = {
        saveDraft: ['Draft saved', 'प्रारूप सहेजा गया'],
        submit: ['Report submitted for review', 'विवरण समीक्षा हेतु प्रस्तुत'],
        saveAndSubmit: ['Saved and submitted for review', 'सहेजकर समीक्षा हेतु प्रस्तुत'],
        submitSaved: ['Last saved draft submitted', 'अंतिम सहेजा प्रारूप प्रस्तुत'],
        review: ['Report marked reviewed', 'विवरण समीक्षित चिह्नित'],
        reopen: ['Report reopened to draft', 'विवरण प्रारूप में फिर खोला गया'],
      };
      addToast(t(done[command][0], done[command][1]), 'success');
      if (command === 'review') setReviewNotes('');
    } catch (error) {
      const described = describe(error);
      setActionError(described);
      addToast(described.title, 'error', described.detail);
    } finally {
      setPendingAction(null);
    }
  };

  // Stable, so callers can run it from effects.
  const reset = useCallback(() => {
    setForm(EMPTY_VRITT_FORM);
    setReviewNotes('');
    setActionError(null);
  }, []);

  return { form, setForm, reviewNotes, setReviewNotes, view, isDirty, pendingAction, actionError, runAction, reset };
}
