"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/users';
import type { UserFilters, UpdateUserInput } from '@/lib/api/users';

export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users(filters as Record<string, unknown>),
    queryFn: () => api.fetchUsers(filters),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => api.fetchUser(id),
    enabled: !!id,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) => 
      api.updateUser(id, input),
    onSuccess: async (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.user(id) });
      await refreshWorkspace();
    },
  });
}