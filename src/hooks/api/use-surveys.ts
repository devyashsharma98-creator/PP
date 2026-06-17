"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/surveys';

export function useSurveys(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.surveys(filters as Record<string, unknown>),
    queryFn: () => api.fetchSurveys(filters),
  });
}

export function useSurvey(id: string) {
  return useQuery({
    queryKey: queryKeys.survey(id),
    queryFn: () => api.getSurvey(id),
    enabled: Boolean(id),
  });
}

export function useCreateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.createSurvey>[0]) => api.createSurvey(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateSurvey>[1] }) => api.updateSurvey(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useDeleteSurvey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteSurvey(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
    },
  });
}

export function useSubmitSurvey(surveyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.submitSurvey>[1]) => api.submitSurvey(surveyId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] });
      queryClient.invalidateQueries({ queryKey: ['surveyResponses', surveyId] });
    },
  });
}

export function useSurveyResponses(surveyId: string) {
  return useQuery({
    queryKey: queryKeys.surveyResponses(surveyId),
    queryFn: () => api.fetchResponses(surveyId),
    enabled: Boolean(surveyId),
  });
}

export function useSurveySummary() {
  return useQuery({
    queryKey: queryKeys.surveySummary(),
    queryFn: () => api.fetchSurveySummary(),
  });
}
