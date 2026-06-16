"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/volunteers';

export function useVolunteers(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.volunteers(filters as Record<string, unknown>),
    queryFn: () => api.fetchVolunteers(filters),
  });
}

export function useVolunteer(id: string) {
  return useQuery({
    queryKey: queryKeys.volunteer(id),
    queryFn: () => api.getVolunteer(id),
    enabled: Boolean(id),
  });
}

export function useUpdateVolunteer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      api.updateVolunteer(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    },
  });
}

export function useVolunteerActivities(volunteerId: string, filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.volunteerActivities(volunteerId, filters as Record<string, unknown>),
    queryFn: () => api.fetchActivities(volunteerId, filters),
    enabled: Boolean(volunteerId),
  });
}

export function useCreateActivity(volunteerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { activityType?: string; description?: string; hoursLogged?: number; date: string; eventId?: string | null }) =>
      api.createActivity(volunteerId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.volunteerActivities(volunteerId) });
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['volunteers', 'summary'] });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (activityId: string) => api.deleteActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    },
  });
}

export function useVolunteerSummary() {
  return useQuery({
    queryKey: queryKeys.volunteerSummary(),
    queryFn: () => api.fetchVolunteerSummary(),
    staleTime: 60000,
  });
}
