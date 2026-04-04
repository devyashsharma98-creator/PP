import { NextRequest } from 'next/server';
import { ArticleService } from '@/lib/server/services/article.service';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ articleId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const { articleId } = await params;
    const service = new ArticleService();
    const article = await service.submitForReview(articleId);
    return json(article);
  } catch (error) {
    console.error('Article submit error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to submit article for review');
  }
}
