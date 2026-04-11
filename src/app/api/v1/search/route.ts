import { executeSqlQuery } from '@/lib/neon/client';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';
import { NextRequest } from 'next/server';

type SearchEventRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string;
};

type SearchArticleRow = {
  id: string;
  title: string;
  content: string | null;
  status: string;
  created_at: string;
};

type SearchUserRow = {
  id: string;
  display_name: string | null;
  email: string | null;
};

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return unauthorized();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const type = searchParams.get('type');

  if (!q || q.length < 2) {
    return errorResponse(400, 'VALIDATION_ERROR', 'Search query must be at least 2 characters');
  }

  try {
    const results: { type: string; id: string; title: string; subtitle: string; status?: string; date?: string }[] = [];

    if (!type || type === 'events') {
      const events = await executeSqlQuery<SearchEventRow>(
        `SELECT id, title, description, status, starts_at FROM events WHERE title ILIKE $1 OR description ILIKE $1 ORDER BY starts_at DESC LIMIT 20`,
        [`%${q}%`]
      );

      for (const e of events) {
        results.push({
          type: 'event',
          id: e.id,
          title: e.title,
          subtitle: e.description || '',
          status: e.status,
          date: e.starts_at,
        });
      }
    }

    if (!type || type === 'articles') {
      const articles = await executeSqlQuery<SearchArticleRow>(
        `SELECT id, title, content, status, created_at FROM articles WHERE title ILIKE $1 OR content ILIKE $1 ORDER BY created_at DESC LIMIT 20`,
        [`%${q}%`]
      );

      for (const a of articles) {
        results.push({
          type: 'article',
          id: a.id,
          title: a.title,
          subtitle: (a.content || '').substring(0, 100),
          status: a.status,
          date: a.created_at,
        });
      }
    }

    if (!type || type === 'users') {
      const users = await executeSqlQuery<SearchUserRow>(
        `SELECT id, display_name, email FROM profiles WHERE display_name ILIKE $1 OR email ILIKE $1 ORDER BY created_at DESC LIMIT 20`,
        [`%${q}%`]
      );

      for (const u of users) {
        results.push({
          type: 'user',
          id: u.id,
          title: u.display_name || 'Unknown',
          subtitle: u.email || '',
        });
      }
    }

    return json({ query: q, results, total: results.length });
  } catch (error) {
    console.error('Search error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Search failed');
  }
}
