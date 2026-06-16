"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/conferences';

export function useConferences(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.conferences(filters as Record<string, unknown>),
    queryFn: () => api.fetchConferences(filters),
  });
}

export function useConference(id: string) {
  return useQuery({
    queryKey: queryKeys.conference(id),
    queryFn: () => api.getConference(id),
    enabled: Boolean(id),
  });
}

export function useCreateConference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string; titleHi?: string; theme?: string; description?: string;
      venue?: string; startsAt?: string; endsAt?: string;
      unitId?: string; departmentId?: string; registrationEnabled?: boolean;
      maxRegistrations?: number;
    }) => api.createConference(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    },
  });
}

export function useUpdateConference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) =>
      api.updateConference(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    },
  });
}

export function useDeleteConference() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteConference(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    },
  });
}

export function useSessions(conferenceId: string) {
  return useQuery({
    queryKey: queryKeys.conferenceSessions(conferenceId),
    queryFn: () => api.fetchSessions(conferenceId),
    enabled: Boolean(conferenceId),
  });
}

export function useSession(conferenceId: string, sessionId: string) {
  return useQuery({
    queryKey: ['session', conferenceId, sessionId],
    queryFn: () => api.getSession(conferenceId, sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useCreateSession(conferenceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string; titleHi?: string; description?: string; sessionType?: string;
      startsAt?: string; endsAt?: string; venue?: string; chairpersonName?: string;
      sortOrder?: number;
    }) => api.createSession(conferenceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferenceSessions', conferenceId] });
    },
  });
}

export function useUpdateSession(conferenceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, input }: { sessionId: string; input: Record<string, unknown> }) =>
      api.updateSession(conferenceId, sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferenceSessions', conferenceId] });
    },
  });
}

export function useDeleteSession(conferenceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => api.deleteSession(conferenceId, sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferenceSessions', conferenceId] });
    },
  });
}

export function useSpeakers(conferenceId: string, sessionId: string) {
  return useQuery({
    queryKey: queryKeys.sessionSpeakers(sessionId),
    queryFn: () => api.fetchSpeakers(conferenceId, sessionId),
    enabled: Boolean(sessionId),
  });
}

export function useCreateSpeaker(conferenceId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string; nameHi?: string; bio?: string; photoUrl?: string;
      topic?: string; affiliation?: string; profileId?: string | null; sortOrder?: number;
    }) => api.createSpeaker(conferenceId, sessionId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionSpeakers', sessionId] });
    },
  });
}

export function useDeleteSpeaker(conferenceId: string, sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (speakerId: string) => api.deleteSpeaker(conferenceId, sessionId, speakerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessionSpeakers', sessionId] });
    },
  });
}

export function useRegistrations(conferenceId: string) {
  return useQuery({
    queryKey: queryKeys.conferenceRegistrations(conferenceId),
    queryFn: () => api.fetchRegistrations(conferenceId),
    enabled: Boolean(conferenceId),
  });
}

export function useCreateRegistration(conferenceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      name: string; email?: string; phone?: string; organization?: string;
      category?: string; notes?: string;
    }) => api.createRegistration(conferenceId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferenceRegistrations', conferenceId] });
    },
  });
}

export function useMarkAttendance(conferenceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ registrationId, isAttended }: { registrationId: string; isAttended: boolean }) =>
      api.markAttendance(conferenceId, registrationId, isAttended),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conferenceRegistrations', conferenceId] });
    },
  });
}
