import { NextRequest } from 'next/server';
import { NotificationService } from '@/lib/server/services/notification.service';
import { notificationFiltersSchema } from '@/lib/server/validation/notifications';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    is_read: searchParams.get('is_read') === 'true' ? true : searchParams.get('is_read') === 'false' ? false : undefined,
    kind: searchParams.get('kind') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  const parsed = notificationFiltersSchema.safeParse(filters);
  if (!parsed.success) {
    return errorResponse(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
  }

  try {
    const service = new NotificationService();
    const result = await service.listForUser(auth.userId, parsed.data);
    return json(result.data, { meta: result.pagination });
  } catch (error) {
    console.error('Notifications list error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch notifications');
  }
}

export async function PATCH(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  try {
    const body = await req.json();
    const service = new NotificationService();

    if (body.mark_all_read) {
      await service.markAllAsRead(auth.userId);
      return json({ success: true });
    }

    return errorResponse(400, 'VALIDATION_ERROR', 'Invalid request');
  } catch (error) {
    console.error('Notifications update error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update notifications');
  }
}