"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import * as api from '@/lib/api/articles';
import type { ArticleFilters, CreateArticleInput } from '@/lib/api/articles';

export function useArticles(filters?: ArticleFilters) {
  return useQuery({
    queryKey: queryKeys.articles(filters as Record<string, unknown>),
    queryFn: () => api.fetchArticles(filters),
  });
}

export function useArticle(id: string) {
  return useQuery({
    queryKey: queryKeys.article(id),
    queryFn: () => api.fetchArticle(id),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateArticleInput) => api.createArticle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useUpdateArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CreateArticleInput> }) => 
      api.updateArticle(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.article(id) });
    },
  });
}

export function useDeleteArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
    },
  });
}

export function useSubmitArticleForReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.submitArticleForReview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.article(id) });
    },
  });
}

export function usePublishArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.publishArticle(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.article(id) });
    },
  });
}