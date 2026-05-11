"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import type { PracharStatus, PracharPlatform } from '@/lib/app/contracts';

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
