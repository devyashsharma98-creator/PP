"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OutreachStatus } from "@/lib/app/outreach-types";

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

export interface OutreachItem {
  id: string;
  outreachType: string;
  relatedType: string | null;
  relatedId: string | null;
  title: string;
  description: string | null;
  unitId: string | null;
  departmentId: string | null;
  status: OutreachStatus;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
  skipReason: string | null;
  templateReference: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachInput {
  outreachType: string;
  title: string;
  description?: string | null;
  unitId?: string | null;
  departmentId?: string | null;
  dueDate?: string | null;
  templateReference?: string | null;
  metadata?: Record<string, unknown>;
}

export interface OutreachTypeConfig {
  type: string;
  labelEn: string;
  labelHi: string;
  icon: string;
  color: string;
  descriptionEn: string;
  descriptionHi: string;
  fields: Array<{
    key: string;
    labelEn: string;
    labelHi: string;
    type: "text" | "url" | "number" | "date" | "select" | "multiselect";
    required?: boolean;
    options?: string[];
    source?: string;
  }>;
}

export interface OutreachAnalytics {
  total: number;
  completed: number;
  pending: number;
  skipped: number;
  completionRate: number;
  statusTotals: Record<string, number>;
  perType: Array<{
    type: string;
    labelEn: string;
    labelHi: string;
    color: string;
    icon: string;
    total: number;
    completed: number;
    pending: number;
    skipped: number;
    completionRate: number;
  }>;
}

export function useOutreachItems(filters: { status?: string; type?: string } = {}) {
  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.type) qs.set("type", filters.type);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return useQuery({
    queryKey: ["outreach", filters],
    queryFn: () => fetchApi<OutreachItem[]>(`/outreach${suffix}`),
    staleTime: 30_000,
  });
}

export function useOutreachTypes() {
  return useQuery({
    queryKey: ["outreach-types"],
    queryFn: () => fetchApi<OutreachTypeConfig[]>("/outreach/types"),
    staleTime: 5 * 60_000,
  });
}

export function useOutreachAnalytics() {
  return useQuery({
    queryKey: ["outreach-analytics"],
    queryFn: () => fetchApi<OutreachAnalytics>("/outreach/analytics"),
    staleTime: 30_000,
  });
}

function useInvalidateOutreach() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["outreach"] });
    qc.invalidateQueries({ queryKey: ["outreach-analytics"] });
  };
}

export function useCreateOutreach() {
  const invalidate = useInvalidateOutreach();
  return useMutation({
    mutationFn: (input: OutreachInput) => mutateApi<OutreachItem>("/outreach", "POST", input),
    onSuccess: invalidate,
  });
}

export function useUpdateOutreach() {
  const invalidate = useInvalidateOutreach();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<OutreachInput> & { id: string; status?: OutreachStatus; skipReason?: string | null }) =>
      mutateApi<OutreachItem>(`/outreach/${id}`, "PATCH", patch),
    onSuccess: invalidate,
  });
}

export function useDeleteOutreach() {
  const invalidate = useInvalidateOutreach();
  return useMutation({
    mutationFn: (id: string) => mutateApi<void>(`/outreach/${id}`, "DELETE"),
    onSuccess: invalidate,
  });
}
