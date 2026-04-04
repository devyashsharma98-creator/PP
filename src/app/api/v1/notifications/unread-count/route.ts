import { NextRequest } from 'next/server';
import { NotificationService } from '@/lib/server/services/notification.service';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  try {
    const service = new NotificationService();
    const count = await service.getUnreadCount(auth.userId);
    return json({ unread_count: count });
  } catch (error) {
    console.error('Notifications count error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch notification count');
  }
}
