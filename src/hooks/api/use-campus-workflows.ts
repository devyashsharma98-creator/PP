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

// ── Types ────────────────────────────────────────────────────────────────────
export type StudyCircleFrequency = "weekly" | "biweekly" | "monthly" | "one_time";
export type CampusOutreachType = "seminar" | "lecture" | "workshop" | "book_discussion";
export type CampusResourceType = "book" | "journal" | "digital" | "study_material";

export interface StudyCircle {
  id: string;
  unitId: string;
  title: string;
  titleHi: string | null;
  description: string | null;
  frequency: StudyCircleFrequency;
  scheduledDate: string;
  scheduledTime: string | null;
  topic: string | null;
  readingMaterial: string | null;
  completed: boolean;
  attendance: number | null;
  notes: string | null;
}

export interface CampusOutreachEntry {
  id: string;
  unitId: string;
  outreachType: CampusOutreachType;
  title: string;
  conductedBy: string | null;
  conductedDate: string;
  attendance: number | null;
  followUpNeeded: boolean;
  nextPlannedDate: string | null;
  notes: string | null;
}

export interface CampusResource {
  id: string;
  unitId: string;
  resourceType: CampusResourceType;
  resourceName: string;
  quantity: number;
  distributedAt: string;
  feedbackReceived: boolean;
  feedbackNotes: string | null;
}

export interface ActivationScore {
  score: number;
  band: "active" | "moderate" | "dormant";
  components: {
    studyCirclesTotal: number;
    studyCirclesCompleted: number;
    studyCirclesRecent: number;
    outreachTotal: number;
    outreachRecent: number;
    pendingFollowUp: number;
    resources: number;
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────
export function useStudyCircles(unitId: string | null | undefined) {
  return useQuery({
    queryKey: ["campus-study-circles", unitId],
    queryFn: () => fetchApi<StudyCircle[]>(`/campus-units/${unitId}/study-circles`),
    enabled: !!unitId,
    staleTime: 30_000,
  });
}

export function useCampusOutreach(unitId: string | null | undefined) {
  return useQuery({
    queryKey: ["campus-outreach", unitId],
    queryFn: () => fetchApi<CampusOutreachEntry[]>(`/campus-units/${unitId}/outreach`),
    enabled: !!unitId,
    staleTime: 30_000,
  });
}

export function useCampusResources(unitId: string | null | undefined) {
  return useQuery({
    queryKey: ["campus-resources", unitId],
    queryFn: () => fetchApi<CampusResource[]>(`/campus-units/${unitId}/resources`),
    enabled: !!unitId,
    staleTime: 30_000,
  });
}

export function useUnitActivation(unitId: string | null | undefined) {
  return useQuery({
    queryKey: ["campus-activation", unitId],
    queryFn: () => fetchApi<ActivationScore>(`/campus-units/${unitId}/activation`),
    enabled: !!unitId,
    staleTime: 30_000,
  });
}

// ── Mutations ────────────────────────────────────────────────────────────────
function useInvalidateUnit() {
  const qc = useQueryClient();
  return (unitId: string) => {
    qc.invalidateQueries({ queryKey: ["campus-study-circles", unitId] });
    qc.invalidateQueries({ queryKey: ["campus-outreach", unitId] });
    qc.invalidateQueries({ queryKey: ["campus-resources", unitId] });
    qc.invalidateQueries({ queryKey: ["campus-activation", unitId] });
  };
}

export function useAddStudyCircle() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ unitId, ...body }: { unitId: string } & Record<string, unknown>) =>
      mutateApi<StudyCircle>(`/campus-units/${unitId}/study-circles`, "POST", body),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useUpdateStudyCircle() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; unitId: string } & Record<string, unknown>) =>
      mutateApi<StudyCircle>(`/campus-workflows/study-circles/${id}`, "PATCH", body),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useDeleteStudyCircle() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ id }: { id: string; unitId: string }) => mutateApi<void>(`/campus-workflows/study-circles/${id}`, "DELETE"),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useAddCampusOutreach() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ unitId, ...body }: { unitId: string } & Record<string, unknown>) =>
      mutateApi<CampusOutreachEntry>(`/campus-units/${unitId}/outreach`, "POST", body),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useUpdateCampusOutreach() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; unitId: string } & Record<string, unknown>) =>
      mutateApi<CampusOutreachEntry>(`/campus-workflows/outreach/${id}`, "PATCH", body),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useDeleteCampusOutreach() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ id }: { id: string; unitId: string }) => mutateApi<void>(`/campus-workflows/outreach/${id}`, "DELETE"),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useAddCampusResource() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ unitId, ...body }: { unitId: string } & Record<string, unknown>) =>
      mutateApi<CampusResource>(`/campus-units/${unitId}/resources`, "POST", body),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useUpdateCampusResource() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string; unitId: string } & Record<string, unknown>) =>
      mutateApi<CampusResource>(`/campus-workflows/resources/${id}`, "PATCH", body),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}

export function useDeleteCampusResource() {
  const invalidate = useInvalidateUnit();
  return useMutation({
    mutationFn: ({ id }: { id: string; unitId: string }) => mutateApi<void>(`/campus-workflows/resources/${id}`, "DELETE"),
    onSuccess: (_d, vars) => invalidate(vars.unitId),
  });
}
