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

export type ProjectStatus = "proposed" | "active" | "under_review" | "completed" | "published";
export type MilestoneStatus = "pending" | "in_progress" | "completed";
export type DeliverableType = "report" | "article" | "presentation" | "data";

export interface ResearchProject {
  id: string;
  title: string;
  titleHi: string | null;
  objective: string | null;
  status: ProjectStatus;
  progress: number;
  startDate: string | null;
  endDate: string | null;
  leadResearcherId: string | null;
  leadName: string | null;
  leadNameHi: string | null;
  teamIds: string[] | null;
  milestoneCount: number;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  weight: number;
  deliverableType: DeliverableType | null;
  deliverableUrl: string | null;
  status: MilestoneStatus;
  completedAt: string | null;
  sortOrder: number;
}

export interface ResearchProjectDetail extends Omit<ResearchProject, "milestoneCount"> {
  objectiveHi: string | null;
  methodology: string | null;
  budget: string | null;
  milestones: Milestone[];
}

export interface ProjectInput {
  title: string;
  titleHi?: string | null;
  objective?: string | null;
  status?: ProjectStatus;
  leadResearcherId?: string | null;
  teamIds?: string[] | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface MilestoneInput {
  title: string;
  description?: string | null;
  weight?: number;
  deliverableType?: DeliverableType | null;
  dueDate?: string | null;
  status?: MilestoneStatus;
}

function useInvalidateResearch() {
  const qc = useQueryClient();
  return (projectId?: string) => {
    qc.invalidateQueries({ queryKey: ["research"] });
    if (projectId) qc.invalidateQueries({ queryKey: ["research-project", projectId] });
    else qc.invalidateQueries({ queryKey: ["research-project"] });
  };
}

export function useResearchProjects(filters: { status?: string } = {}) {
  const qs = filters.status ? `?status=${filters.status}` : "";
  return useQuery({
    queryKey: ["research", filters],
    queryFn: () => fetchApi<ResearchProject[]>(`/research${qs}`),
    staleTime: 30_000,
  });
}

export function useResearchProject(id: string | null | undefined) {
  return useQuery({
    queryKey: ["research-project", id],
    queryFn: () => fetchApi<ResearchProjectDetail>(`/research/${id}`),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateProject() {
  const invalidate = useInvalidateResearch();
  return useMutation({
    mutationFn: (input: ProjectInput) => mutateApi<ResearchProject>("/research", "POST", input),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateProject() {
  const invalidate = useInvalidateResearch();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<ProjectInput> & { id: string }) =>
      mutateApi<ResearchProject>(`/research/${id}`, "PATCH", patch),
    onSuccess: (_d, vars) => invalidate(vars.id),
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateResearch();
  return useMutation({
    mutationFn: (id: string) => mutateApi<void>(`/research/${id}`, "DELETE"),
    onSuccess: () => invalidate(),
  });
}

export function useAddMilestone() {
  const invalidate = useInvalidateResearch();
  return useMutation({
    mutationFn: ({ projectId, ...input }: MilestoneInput & { projectId: string }) =>
      mutateApi<Milestone>(`/research/${projectId}/milestones`, "POST", input),
    onSuccess: (_d, vars) => invalidate(vars.projectId),
  });
}

export function useUpdateMilestone() {
  const invalidate = useInvalidateResearch();
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<MilestoneInput> & { id: string; projectId: string }) =>
      mutateApi<Milestone>(`/research/milestones/${id}`, "PATCH", patch),
    onSuccess: (_d, vars) => invalidate(vars.projectId),
  });
}

export function useDeleteMilestone() {
  const invalidate = useInvalidateResearch();
  return useMutation({
    mutationFn: ({ id }: { id: string; projectId: string }) => mutateApi<void>(`/research/milestones/${id}`, "DELETE"),
    onSuccess: (_d, vars) => invalidate(vars.projectId),
  });
}
