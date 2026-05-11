"use client";
// Modular hooks for events

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/events';
import type { EventFilters, CreateEventInput } from '@/lib/api/events';

export function useEvents(filters?: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events(filters as Record<string, unknown>),
    queryFn: () => api.fetchEvents(filters),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: queryKeys.event(id),
    queryFn: () => api.fetchEvent(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: (input: CreateEventInput) => api.createEvent(input),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      await refreshWorkspace();
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateEventInput> }) => 
      api.updateEvent(id, input),
    onSuccess: async (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
      await refreshWorkspace();
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      await refreshWorkspace();
    },
  });
}

export function useSubmitEventForReview() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: (id: string) => api.submitEventForReview(id),
    onSuccess: async (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
      await refreshWorkspace();
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: (id: string) => api.publishEvent(id),
    onSuccess: async (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
      await refreshWorkspace();
    },
  });
}

export function useCastVote() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: ({ eventId, pollId, optionId }: { eventId: string; pollId: string; optionId: string }) =>
      api.castVote(eventId, pollId, optionId),
    onSuccess: async (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
      await refreshWorkspace();
    },
  });
}

export function useAddRegistration() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: any }) =>
      fetch(`/api/public/events/${eventId}/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || 'Registration failed');
        }
        return res.json();
      }),
    onSuccess: async (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
      await refreshWorkspace();
    },
  });
}