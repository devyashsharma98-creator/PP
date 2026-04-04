import { NextRequest } from 'next/server';
import { EventService } from '@/lib/server/services/event.service';
import { json, errorResponse, unauthorized, forbidden } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
  const auth = requireAuth(req);
  if (!auth) return unauthorized();

  if (!auth.permissions.includes('event:publish')) return forbidden();

  try {
    const { eventId } = await params;
    const service = new EventService();
    const event = await service.getById(eventId);
    if (!event) return errorResponse(404, 'NOT_FOUND', 'Event not found');

    const updated = await service.updateStatus(eventId, 'published');
    return json(updated);
  } catch (error) {
    console.error('Event publish error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to publish event');
  }
}
