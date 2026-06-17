import { fetchApi } from './events';

export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string;
  status: string;
  author_user_id: string | null;
  author_name_snapshot: string | null;
  unit_id: string | null;
  featured_image: string | null;
  values_checklist: Record<string, boolean> | null;
  published_at: string | null;
}

export interface ArticleFilters {
  status?: string;
  category?: string;
  author_user_id?: string;
  unit_id?: string;
  page?: number;
  limit?: number;
}

export interface CreateArticleInput {
  title: string;
  content: string;
  summary?: string;
  category: string;
  unit_id?: string;
  department_id?: string;
  featured_image?: string;
}

export async function fetchArticles(filters?: ArticleFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.category) params.set('category', filters.category);
  if (filters?.author_user_id) params.set('author_user_id', filters.author_user_id);
  if (filters?.unit_id) params.set('unit_id', filters.unit_id);
  if (filters?.page) params.set('page', String(filters.page));
  if (filters?.limit) params.set('limit', String(filters.limit));
  
  const query = params.toString() ? `?${params}` : '';
  return fetchApi<Article[]>(`/articles${query}`);
}

export async function fetchArticle(id: string) {
  return fetchApi<Article>(`/articles/${id}`);
}

export async function createArticle(input: CreateArticleInput) {
  return fetchApi<Article>('/articles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateArticle(id: string, input: Partial<CreateArticleInput>) {
  return fetchApi<Article>(`/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export async function deleteArticle(id: string) {
  return fetchApi<{ success: boolean }>(`/articles/${id}`, {
    method: 'DELETE',
  });
}

export async function submitArticleForReview(id: string) {
  return fetchApi<Article>(`/articles/${id}/submit`, {
    method: 'POST',
  });
}

export async function publishArticle(id: string) {
  return fetchApi<Article>(`/articles/${id}/publish`, {
    method: 'POST',
  });
}