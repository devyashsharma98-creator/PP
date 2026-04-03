import { NextRequest } from 'next/server';
import { UserService } from '@/lib/server/services/user.service';
import { userFiltersSchema } from '@/lib/server/validation/users';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('user:read')) {
    return errorResponse(403, 'FORBIDDEN', 'You do not have permission to view users');
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    is_active: searchParams.get('is_active') === 'true' ? true : undefined,
    unit_id: searchParams.get('unit_id') || undefined,
    department_id: searchParams.get('department_id') || undefined,
    search: searchParams.get('search') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  const parsed = userFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return errorResponse(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
  }

  try {
    const service = new UserService();
    const result = await service.list(parsed.data);
    return json(result.data, { meta: result.pagination });
  } catch (error) {
    console.error('Users list error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch users');
  }
}