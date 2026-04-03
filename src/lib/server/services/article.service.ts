import { sql } from '@/lib/neon/client';
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

    let conditions: string[] = [];
    if (filters.status) conditions.push(`status = '${filters.status}'`);
    if (filters.category) conditions.push(`category = '${filters.category}'`);
    if (filters.author_user_id) conditions.push(`author_user_id = '${filters.author_user_id}'`);
    if (filters.unit_id) conditions.push(`unit_id = '${filters.unit_id}'`);
    
    const whereClause = conditions.length > 0 ? conditions.join(' AND ') : '';
    const query = whereClause 
      ? `SELECT * FROM articles WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`
      : `SELECT * FROM articles ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`${query}`;
    const total = rows.length;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`SELECT * FROM articles WHERE id = ${id} LIMIT 1`;
    return rows[0] as Article | null;
  }

  async create(input: CreateArticleInput): Promise<Article> {
    if (!input.title?.trim()) {
      throw new ValidationError('Title is required');
    }
    if (!input.content?.trim() || input.content.length < 10) {
      throw new ValidationError('Content must be at least 10 characters');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`
      INSERT INTO articles (title, content, summary, category, unit_id, department_id, status, author_user_id, author_name_snapshot)
      VALUES (${input.title}, ${input.content}, ${input.summary ?? null}, ${input.category}, ${input.unit_id ?? null}, ${input.department_id ?? null}, 'draft', null, null)
      RETURNING *`;

    if (!rows[0]) {
      throw new AppError(500, 'DB_ERROR', 'Failed to create article');
    }

    return rows[0] as Article;
  }

  async update(id: string, input: Partial<CreateArticleInput>): Promise<Article> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }

    const updates: string[] = [];
    if (input.title) updates.push(`title = '${input.title}'`);
    if (input.content) updates.push(`content = '${input.content}'`);
    if (input.summary !== undefined) updates.push(`summary = '${input.summary ?? null}'`);
    if (input.category) updates.push(`category = '${input.category}'`);
    updates.push(`updated_at = '${new Date().toISOString()}'`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`
      UPDATE articles SET ${updates.join(', ')}
      WHERE id = ${id}
      RETURNING *`;

    return rows[0] as Article;
  }

  async submitForReview(id: string): Promise<Article> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }
    if (article.status !== 'draft' && article.status !== 'returned_for_revision') {
      throw new ValidationError('Only draft or returned articles can be submitted');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`
      UPDATE articles SET status = 'pending_unit_head_review', updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *`;

    return rows[0] as Article;
  }

  async publish(id: string): Promise<Article> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }
    if (article.status !== 'published' && article.status !== 'pending_prant_authorization') {
      throw new ForbiddenError('Article cannot be published in current status');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows: any[] = await sql`
      UPDATE articles SET status = 'published', published_at = ${new Date().toISOString()}, updated_at = ${new Date().toISOString()}
      WHERE id = ${id}
      RETURNING *`;

    return rows[0] as Article;
  }

  async delete(id: string): Promise<void> {
    const article = await this.getById(id);
    if (!article) {
      throw new NotFoundError('Article', id);
    }

    await sql`DELETE FROM articles WHERE id = ${id}`;
  }
}