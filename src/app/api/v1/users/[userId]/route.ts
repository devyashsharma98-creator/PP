import { NextRequest } from 'next/server';
import { UserService } from '@/lib/server/services/user.service';
import { json, errorResponse, notFound, unauthorized, forbidden } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { userId } = await params;
  const service = new UserService();

  try {
    const user = await service.getById(userId);
    if (!user) {
      return notFound('User', userId);
    }
    return json(user);
  } catch (error) {
    console.error('User get error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch user');
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  const { userId } = await params;
  
  // Users can only update their own profile, admins can update any
  if (auth.userId !== userId && !auth.permissions.includes('admin:full')) {
    return forbidden('You can only update your own profile');
  }

  try {
    const body = await req.json();
    const service = new UserService();
    const user = await service.update(userId, body);
    return json(user);
  } catch (error) {
    console.error('User update error:', error);
    const err = error as Error;
    if (err.message?.includes('not found')) {
      return notFound('User', userId);
    }
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update user');
  }
}