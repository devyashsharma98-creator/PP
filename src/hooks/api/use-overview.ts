"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchOverview } from "@/lib/api/overview";
import { queryKeys } from "@/lib/query-client";

export function useOverview() {
  return useQuery({
    queryKey: queryKeys.overview(),
    queryFn: fetchOverview,
    refetchInterval: 60000,
  });
}
