"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_BASE = "/api/v1";

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, { headers: { "Content-Type": "application/json" } });
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
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error?.message || "API request failed");
  return data.data as T;
}

export type IssueStatus = "draft" | "preparing" | "reviewing" | "published";
export type ArticleStatus =
  | "submitted" | "under_review" | "revision_requested" | "accepted" | "rejected" | "published" | "withdrawn";
export type Recommendation = "accept" | "minor_revision" | "major_revision" | "reject";

export interface Publication {
  id: string;
  title: string;
  titleHi: string;
  subtitle: string | null;
  subtitleHi: string | null;
  issueNumber: string | null;
  publishDate: string | null;
  description: string | null;
  descriptionHi: string | null;
  status: IssueStatus;
  visibility: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PublicationArticle {
  id: string;
  publicationId: string | null;
  publicationTitle?: string | null;
  title: string;
  titleHi: string | null;
  abstract: string | null;
  status: ArticleStatus;
  recommendation: Recommendation | null;
  rating: number | null;
  reviewComment: string | null;
  version: number;
  submittedAt: string;
  reviewedAt: string | null;
  submitterName: string | null;
  reviewerName: string | null;
}

export interface PublicationDetail extends Omit<Publication, "articleCount"> {
  articles: Array<{
    id: string;
    title: string;
    titleHi: string | null;
    abstract: string | null;
    status: ArticleStatus;
    recommendation: Recommendation | null;
    rating: number | null;
    reviewComment: string | null;
    version: number;
    sortOrder: number;
    submittedAt: string;
    submitterName: string | null;
    reviewerName: string | null;
  }>;
}

// ── Issues ───────────────────────────────────────────────────────────────────
export function usePublications() {
  return useQuery({
    queryKey: ["publications"],
    queryFn: () => fetchApi<Publication[]>("/publications"),
    staleTime: 30_000,
  });
}

export function usePublication(id: string | null | undefined) {
  return useQuery({
    queryKey: ["publication", id],
    queryFn: () => fetchApi<PublicationDetail>(`/publications/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export interface PublicationInput {
  title: string;
  titleHi: string;
  subtitle?: string | null;
  issueNumber?: string | null;
  description?: string | null;
  status?: IssueStatus;
}

function useInvalidatePublications() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["publications"] });
    qc.invalidateQueries({ queryKey: ["publication"] });
    qc.invalidateQueries({ queryKey: ["publication-articles"] });
  };
}

export function useCreatePublication() {
  const invalidate = useInvalidatePublications();
  return useMutation({
    mutationFn: (input: PublicationInput) => mutateApi<Publication>("/publications", "POST", input),
    onSuccess: invalidate,
  });
}

export function useUpdatePublication() {
  const invalidate = useInvalidatePublications();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<PublicationInput> & { id: string }) =>
      mutateApi<Publication>(`/publications/${id}`, "PATCH", patch),
    onSuccess: invalidate,
  });
}

export function useDeletePublication() {
  const invalidate = useInvalidatePublications();
  return useMutation({
    mutationFn: (id: string) => mutateApi<void>(`/publications/${id}`, "DELETE"),
    onSuccess: invalidate,
  });
}

// ── Articles ─────────────────────────────────────────────────────────────────
export function usePublicationArticles(filters: { status?: string; publicationId?: string; mine?: boolean } = {}) {
  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.publicationId) qs.set("publicationId", filters.publicationId);
  if (filters.mine) qs.set("mine", "true");
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return useQuery({
    queryKey: ["publication-articles", filters],
    queryFn: () => fetchApi<PublicationArticle[]>(`/publications/articles${suffix}`),
    staleTime: 30_000,
  });
}

export interface ArticleInput {
  title: string;
  titleHi?: string | null;
  abstract?: string | null;
  body?: string;
  references?: string | null;
  publicationId?: string | null;
}

export interface ArticleReviewInput {
  status?: ArticleStatus;
  recommendation?: Recommendation | null;
  rating?: number | null;
  reviewComment?: string | null;
  publicationId?: string | null;
  title?: string;
  abstract?: string | null;
  body?: string;
}

export function useSubmitArticle() {
  const invalidate = useInvalidatePublications();
  return useMutation({
    mutationFn: (input: ArticleInput) => mutateApi<PublicationArticle>("/publications/articles", "POST", input),
    onSuccess: invalidate,
  });
}

export function useUpdateArticle() {
  const invalidate = useInvalidatePublications();
  return useMutation({
    mutationFn: ({ id, ...patch }: ArticleReviewInput & { id: string }) =>
      mutateApi<PublicationArticle>(`/publications/articles/${id}`, "PATCH", patch),
    onSuccess: invalidate,
  });
}

export function useDeleteArticle() {
  const invalidate = useInvalidatePublications();
  return useMutation({
    mutationFn: (id: string) => mutateApi<void>(`/publications/articles/${id}`, "DELETE"),
    onSuccess: invalidate,
  });
}
