import { NextRequest } from 'next/server';
import { sql } from '@/lib/neon/client';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const rows = await sql`SELECT id, code, name, name_hi FROM roles ORDER BY code` as any[];
    return json(rows);
  } catch (error) {
    console.error('Roles list error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch roles');
  }
}
