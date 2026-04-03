"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  
  return useMutation({
    mutationFn: (input: CreateEventInput) => api.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateEventInput> }) => 
      api.updateEvent(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

export function useSubmitEventForReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.submitEventForReview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
    },
  });
}

export function usePublishEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.publishEvent(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(id) });
    },
  });
}