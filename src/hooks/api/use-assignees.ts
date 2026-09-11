"use client";

import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query-client";
import { fetchAssignees, AssigneeFetchError, type AssigneeOption } from "@/lib/api/assignees";

export type AssigneeListState =
  | { kind: "loading" }
  | { kind: "forbidden"; message: string }
  | { kind: "failed"; message: string; retry: () => void }
  | { kind: "empty"; searching: boolean }
  | { kind: "ready"; options: AssigneeOption[] };

/**
 * Scoped assignee search. `enabled` keeps the request from firing until the
 * picker is actually open, so opening a task board does not query the directory.
 */
export function useAssignees(search: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.assignees(search),
    queryFn: () => fetchAssignees({ search: search || undefined, limit: 50 }),
    enabled,
    staleTime: 60_000,
    // A refusal is an answer, not a transient failure — retrying it only delays
    // the message the user needs to see.
    retry: (failureCount, error) =>
      !(error instanceof AssigneeFetchError && error.kind === "forbidden") && failureCount < 2,
  });
}

/**
 * Collapse the query into the four states the picker must tell apart:
 * loading, forbidden, failed, and genuinely empty.
 */
export function toAssigneeListState(
  query: ReturnType<typeof useAssignees>,
  search: string,
): AssigneeListState {
  if (query.isPending || query.isFetching) return { kind: "loading" };

  if (query.isError) {
    const error = query.error;
    if (error instanceof AssigneeFetchError && error.kind === "forbidden") {
      return { kind: "forbidden", message: error.message };
    }
    return {
      kind: "failed",
      message: error instanceof Error ? error.message : "The member list could not be loaded.",
      retry: () => void query.refetch(),
    };
  }

  const options = query.data ?? [];
  if (options.length === 0) return { kind: "empty", searching: search.trim().length > 0 };

  return { kind: "ready", options };
}
