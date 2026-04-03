import { NextRequest } from 'next/server';
import { ArticleService } from '@/lib/server/services/article.service';
import { updateArticleSchema } from '@/lib/server/validation/articles';
import { json, errorResponse, notFound, unauthorized, forbidden } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

interface RouteParams {
  params: Promise<{ articleId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { articleId } = await params;
  const service = new ArticleService();

  try {
    const article = await service.getById(articleId);
    if (!article) {
      return notFound('Article', articleId);
    }
    return json(article);
  } catch (error) {
    console.error('Article get error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch article');
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('article:update')) {
    return forbidden('You do not have permission to update articles');
  }

  const { articleId } = await params;

  try {
    const body = await req.json();
    const parsed = updateArticleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const service = new ArticleService();
    const article = await service.update(articleId, parsed.data);
    return json(article);
  } catch (error) {
    console.error('Article update error:', error);
    const err = error as Error;
    if (err.message?.includes('not found')) {
      return notFound('Article', articleId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update article');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('article:delete')) {
    return forbidden('You do not have permission to delete articles');
  }

  const { articleId } = await params;

  try {
    const service = new ArticleService();
    await service.delete(articleId);
    return json({ success: true });
  } catch (error) {
    console.error('Article delete error:', error);
    const err = error as Error;
    if (err.message?.includes('not found')) {
      return notFound('Article', articleId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to delete article');
  }
}