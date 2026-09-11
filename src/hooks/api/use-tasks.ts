"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/context/AppContext';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/tasks';

export function useTaskboard() {
  return useQuery({
    queryKey: queryKeys.taskboard(),
    queryFn: () => api.fetchTaskboard(),
    staleTime: 30000,
  });
}

export function useProjects(filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.projects(filters as Record<string, unknown>),
    queryFn: () => api.fetchProjects(filters),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  const { refreshWorkspace } = useAppContext();
  return useMutation({
    mutationFn: (input: { name: string; nameHi?: string; description?: string; departmentId?: string; deadline?: string }) =>
      api.createProject(input),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['taskboard'] });
      await refreshWorkspace();
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: Record<string, unknown> }) =>
      api.updateProject(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['taskboard'] });
    },
  });
}

/**
 * Removes a project. Without options this archives it; a permanent delete must
 * pass hardDelete plus the exact task count it is destroying.
 */
export function useRemoveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, ...options }: { projectId: string; hardDelete?: boolean; expectedTaskCount?: number }) =>
      api.removeProject(projectId, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['taskboard'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

export function useMyTasks(filters: { status?: string; search?: string } = {}) {
  return useQuery({
    queryKey: queryKeys.myTasks(filters as Record<string, unknown>),
    queryFn: () => api.fetchMyTasks(filters),
    staleTime: 30000,
  });
}

export function useProjectTasks(projectId: string, filters?: Record<string, string>) {
  return useQuery({
    queryKey: queryKeys.projectTasks(projectId, filters as Record<string, unknown>),
    queryFn: () => api.fetchTasks(projectId, filters),
    enabled: Boolean(projectId),
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string; titleHi?: string; description?: string; assigneeUserId?: string;
      priority?: string; dueDate?: string;
    }) => api.createTask(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: ['taskboard'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: Record<string, unknown> }) =>
      api.updateTask(projectId, taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: ['taskboard'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.deleteTask(projectId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projectTasks(projectId) });
      queryClient.invalidateQueries({ queryKey: ['taskboard'] });
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
    },
  });
}
