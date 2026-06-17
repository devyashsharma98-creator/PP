"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/org';

export function useOrg() {
  return useQuery({
    queryKey: queryKeys.org(),
    queryFn: () => api.fetchOrg(),
  });
}

export function useUpdateOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof api.updateOrg>[0]) => api.updateOrg(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.org() });
    },
  });
}
