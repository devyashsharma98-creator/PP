import { NextRequest } from 'next/server';
import { ArticleService } from '@/lib/server/services/article.service';
import { createArticleSchema, articleFiltersSchema } from '@/lib/server/validation/articles';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    status: searchParams.get('status') || undefined,
    category: searchParams.get('category') || undefined,
    author_user_id: searchParams.get('author_user_id') || undefined,
    unit_id: searchParams.get('unit_id') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  const parsed = articleFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return errorResponse(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
  }

  try {
    const service = new ArticleService();
    const result = await service.list(parsed.data);
    return json(result.data, { meta: result.pagination });
  } catch (error) {
    console.error('Articles list error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch articles');
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('article:create')) {
    return errorResponse(403, 'FORBIDDEN', 'You do not have permission to create articles');
  }

  try {
    const body = await req.json();
    const parsed = createArticleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const service = new ArticleService();
    const article = await service.create(parsed.data);
    return json(article, { status: 201 });
  } catch (error) {
    console.error('Articles create error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create article');
  }
}