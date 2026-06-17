"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import type { PracharStatus, PracharPlatform } from '@/lib/app/contracts';

export interface PracharCampaignInput {
  title: string;
  description?: string;
  startsAt: string;
  unitId?: string;
  departmentId?: string;
  templateReference?: string;
}

export type UpdatePracharCampaignInput = Partial<PracharCampaignInput>;

export function usePracharStatuses() {
  const { authReady } = useAppContext();
  return useQuery({
    queryKey: ['prachar-statuses'],
    queryFn: async () => {
      const res = await fetch('/api/v1/prachar/statuses');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch prachar statuses');
      return data.data as PracharStatus[];
    },
    enabled: authReady,
    staleTime: 60000,
  });
}

export function useUpdatePracharPlatform() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ eventId, platform, done, skipReason }: { eventId: string; platform: PracharPlatform; done: boolean; skipReason?: string | null }) => {
      const res = await fetch('/api/v1/prachar/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, platform, done, skipReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update prachar platform');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prachar-statuses'] });
    },
  });
}

export function useCreatePracharCampaign() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: async (input: PracharCampaignInput) => {
      const res = await fetch('/api/v1/prachar/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to create Prachar campaign');
      }
      return data.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
      queryClient.invalidateQueries({ queryKey: ['prachar-statuses'] });
      await refreshWorkspace();
    },
  });
}

export function useUpdatePracharCampaign() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: async ({ eventId, input }: { eventId: string; input: UpdatePracharCampaignInput }) => {
      const res = await fetch(`/api/v1/prachar/campaigns/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to update Prachar campaign');
      }
      return data.data;
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-events'] });
      queryClient.invalidateQueries({ queryKey: ['prachar-statuses'] });
      await refreshWorkspace();
    },
  });
}
