import { NextRequest } from 'next/server';
import { EventRepository } from '@/lib/server/repositories/event.repository';
import { json, errorResponse, notFound, unauthorized, forbidden } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { eventId } = await params;
  const repo = new EventRepository();

  try {
    const event = await repo.findById(eventId);
    if (!event) {
      return notFound('Event', eventId);
    }
    return json(event);
  } catch (error) {
    console.error('Event get error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch event');
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('event:update')) {
    return forbidden('You do not have permission to update events');
  }

  const { eventId } = await params;
  const repo = new EventRepository();

  try {
    const body = await req.json();
    const event = await repo.update(eventId, body);
    return json(event);
  } catch (error) {
    console.error('Event update error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update event');
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('event:delete')) {
    return forbidden('You do not have permission to delete events');
  }

  const { eventId } = await params;
  const repo = new EventRepository();

  try {
    await repo.softDelete(eventId);
    return json({ success: true });
  } catch (error) {
    console.error('Event delete error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to delete event');
  }
}