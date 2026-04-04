import { NextRequest } from 'next/server';
import { sql } from '@/lib/neon/client';
import { json, errorResponse, unauthorized, forbidden } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) return unauthorized();

  try {
    const { userId } = await params;
    const rows = await sql`
      SELECT r.id, r.code, r.name, r.name_hi
      FROM user_role_assignments ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ${userId} AND (ur.ends_at IS NULL OR ur.ends_at > now())
    ` as any[];
    return json(rows);
  } catch (error) {
    console.error('User roles error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch user roles');
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) return unauthorized();
  if (!auth.permissions.includes('user:manage')) return forbidden();

  try {
    const { userId } = await params;
    const body = await req.json();
    if (!body.role_id) return errorResponse(400, 'VALIDATION_ERROR', 'role_id is required');

    await sql`
      INSERT INTO user_role_assignments (user_id, role_id, scope_type, is_primary)
      VALUES (${userId}, ${body.role_id}, ${body.scope_type || 'org'}, true)
      ON CONFLICT DO NOTHING
    `;
    return json({ success: true });
  } catch (error) {
    console.error('Assign role error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to assign role');
  }
}
