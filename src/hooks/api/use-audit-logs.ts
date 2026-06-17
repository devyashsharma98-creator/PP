"use client";

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/audit-logs';

export function useAuditLogs(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.auditLogs(filters as Record<string, unknown>),
    queryFn: () => api.fetchAuditLogs(filters),
  });
}
