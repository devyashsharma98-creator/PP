import { executeSqlQuery, sql } from '@/lib/neon/client';
import { AppError, NotFoundError, ValidationError, ForbiddenError } from '../errors/app-errors';
import type { IService, PaginatedResult, CreateArticleInput, ArticleFilters } from '../services/types';

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
  department_id: string | null;
  values_checklist: Record<string, boolean> | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export class ArticleService implements IService<ArticleFilters, PaginatedResult<Article>> {
  async execute(filters: ArticleFilters): Promise<PaginatedResult<Article>> {
    return this.list(filters);
  }

  async list(filters: ArticleFilters): Promise<PaginatedResult<Article>> {
    const { page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (filters.status) {
      whereParts.push(`status = $${values.length + 1}`);
      values.push(filters.status);
    }
    if (filters.category) {
      whereParts.push(`category = $${values.length + 1}`);
      values.push(filters.category);
    }
    if (filters.author_user_id) {
      whereParts.push(`author_user_id = $${values.length + 1}`);
      values.push(filters.author_user_id);
    }
    if (filters.unit_id) {
      whereParts.push(`unit_id = $${values.length + 1}`);
      values.push(filters.unit_id);
    }

    const whereSql = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
    const v = [...values];

    const countResult = await executeSqlQuery<{ count: string }>(`SELECT COUNT(*) as count FROM public.articles ${whereSql}`, v);
    const total = parseInt(countResult?.[0]?.count ?? '0', 10);

    const rows = await executeSqlQuery<Article>(`SELECT * FROM public.articles ${whereSql} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`, v);

    return {
      data: rows as Article[],
      pagination: {
        page,
        limit,
        total,
        hasMore: offset + limit < total,
      },
    };
  }

  async getById(id: string): Promise<Article | null> {
    const rows = await sql`SELECT * FROM public.articles WHERE id = ${id} LIMIT 1` as unknown as Article[];
    return rows[0] ?? null;
  }

  async create(input: CreateArticleInput): Promise<Article> {
    if (!input.title?.trim()) {
      throw new ValidationError('Title is required');
    }
    if (!input.content?.trim() || input.content.length < 10) {
      throw new ValidationError('Content must be at least 10 characters');
    }

    const rows = await sql`
      INSERT INTO public.articles (title, content, summary, category, unit_id, department_id, status, author_user_id, author_name_snapshot)
      VALUES (${input.title}, ${input.content}, ${input.summary ?? null}, ${input.category}, ${input.unit_id ?? null}, ${input.department_id ?? null}, 'draft', null, null)
      RETURNING *` as unknown as Article[];

    if (!rows[0]) {
      throw new AppError(500, 'DB_ERROR', 'Failed to create article');
    }

    return rows[0];
  }

  async update(id: string, input: Partial<CreateArticleInput>): Promise<Article> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }

    const setParts: string[] = [];
    const values: unknown[] = [];

    if (input.title) {
      setParts.push(`title = $${values.length + 1}`);
      values.push(input.title);
    }
    if (input.content) {
      setParts.push(`content = $${values.length + 1}`);
      values.push(input.content);
    }
    if (input.summary !== undefined) {
      setParts.push(`summary = $${values.length + 1}`);
      values.push(input.summary);
    }
    if (input.category) {
      setParts.push(`category = $${values.length + 1}`);
      values.push(input.category);
    }
    setParts.push(`updated_at = $${values.length + 1}`);
    values.push(new Date().toISOString());

    const whereIdx = values.length + 1;
    const rows = await executeSqlQuery<Article>(`UPDATE public.articles SET ${setParts.join(', ')} WHERE id = $${whereIdx} RETURNING *`, [...values, id]);

    return rows[0];
  }

  async submitForReview(id: string): Promise<Article> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }
    if (article.status !== 'draft' && article.status !== 'returned_for_revision') {
      throw new ValidationError('Only draft or returned articles can be submitted');
    }

    const rows = await sql`
      UPDATE public.articles SET status = 'pending_unit_head_review', updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *` as unknown as Article[];

    return rows[0];
  }

  async publish(id: string): Promise<Article> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }
    if (article.status !== 'published' && article.status !== 'pending_prant_authorization') {
      throw new ForbiddenError('Article cannot be published in current status');
    }

    const rows = await sql`
      UPDATE public.articles SET status = 'published', published_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *` as unknown as Article[];

    return rows[0];
  }

  async delete(id: string): Promise<void> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }

    await sql`DELETE FROM public.articles WHERE id = ${id}`;
  }
}
