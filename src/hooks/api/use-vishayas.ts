"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/v1";

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || "API request failed");
  return data.data as T;
}

async function mutateApi<T>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || "API request failed");
  return data.data as T;
}

export interface Vishaya {
  id: string;
  slug: string;
  nameEn: string;
  nameHi: string;
  description: string | null;
  descriptionHi: string | null;
  parentVishayId: string | null;
  color: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  contentCount: number;
}

export type VishayaInput = {
  nameEn: string;
  nameHi: string;
  description?: string | null;
  descriptionHi?: string | null;
  parentVishayId?: string | null;
  color?: string;
  icon?: string;
  sortOrder?: number;
};

export function useVishayas(opts: { includeInactive?: boolean } = {}) {
  const qs = opts.includeInactive ? "?includeInactive=true" : "";
  return useQuery({
    queryKey: ["vishayas", { includeInactive: !!opts.includeInactive }],
    queryFn: () => fetchApi<Vishaya[]>(`/vishayas${qs}`),
    staleTime: 60_000,
  });
}

export function useCreateVishaya() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VishayaInput) => mutateApi<Vishaya>("/vishayas", "POST", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vishayas"] }),
  });
}

export function useUpdateVishaya() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<VishayaInput> & { id: string; isActive?: boolean }) =>
      mutateApi<Vishaya>(`/vishayas/${id}`, "PATCH", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vishayas"] }),
  });
}

export function useDeleteVishaya() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mutateApi<{ id: string }>(`/vishayas/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vishayas"] }),
  });
}

// ── Content ↔ vishay linking ────────────────────────────────────────────────

export type VishayContentType =
  | "article"
  | "event"
  | "scholar"
  | "project"
  | "unit"
  | "publication"
  | "thread";

export function useVishayLinks(contentType: VishayContentType, contentId: string | null | undefined) {
  return useQuery({
    queryKey: ["vishaya-links", contentType, contentId],
    queryFn: () =>
      fetchApi<string[]>(
        `/vishayas/links?contentType=${encodeURIComponent(contentType)}&contentId=${encodeURIComponent(contentId!)}`,
      ),
    enabled: !!contentId,
    staleTime: 30_000,
  });
}

// ── Vishay detail (related content) ─────────────────────────────────────────

export interface VishayRelatedArticle { id: string; title: string; status: string; category: string }
export interface VishayRelatedEvent { id: string; title: string; status: string; startsAt: string | null }
export interface VishayRelatedScholar { id: string; name: string; nameHi: string; slug: string; designation: string | null }
export interface VishayRelatedPublication { id: string; title: string; titleHi: string | null; status: string }
export interface VishayRelatedProject { id: string; title: string; titleHi: string | null; status: string }

export interface VishayContentResponse {
  vishay: {
    id: string;
    slug: string;
    nameEn: string;
    nameHi: string;
    description: string | null;
    descriptionHi: string | null;
    color: string;
    icon: string;
  };
  groups: {
    article: VishayRelatedArticle[];
    event: VishayRelatedEvent[];
    scholar: VishayRelatedScholar[];
    publication: VishayRelatedPublication[];
    project: VishayRelatedProject[];
  };
  totals: { article: number; event: number; scholar: number; publication: number; project: number; all: number };
}

export function useVishayContent(vishayId: string | null | undefined) {
  return useQuery({
    queryKey: ["vishaya-content", vishayId],
    queryFn: () => fetchApi<VishayContentResponse>(`/vishayas/${vishayId}/content`),
    enabled: !!vishayId,
    staleTime: 30_000,
  });
}

export function useSetVishayLinks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { contentType: VishayContentType; contentId: string; vishayIds: string[] }) =>
      mutateApi<{ vishayIds: string[] }>("/vishayas/links", "PUT", args),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["vishaya-links", vars.contentType, vars.contentId] });
      qc.invalidateQueries({ queryKey: ["vishayas"] });
    },
  });
}
