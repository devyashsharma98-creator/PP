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

  const { eventId } = await params;
  const body = await req.json();

  try {
    if (body.action === 'submit') {
      if (!auth.permissions.includes('event:create')) return forbidden();
      const service = new (await import('@/lib/server/services/event.service')).EventService();
      const event = await service.updateStatus(eventId, 'submitted_by_unit');
      return json(event);
    }
    if (body.action === 'approve') {
      if (!auth.permissions.includes('event:approve')) return forbidden();
      const service = new (await import('@/lib/server/services/event.service')).EventService();
      const event = await service.updateStatus(eventId, 'pending_vibhag_review');
      return json(event);
    }
    if (body.action === 'reject') {
      if (!auth.permissions.includes('event:approve')) return forbidden();
      const service = new (await import('@/lib/server/services/event.service')).EventService();
      const event = await service.updateStatus(eventId, 'rejected');
      return json(event);
    }
    if (body.action === 'publish') {
      if (!auth.permissions.includes('event:publish')) return forbidden();
      const service = new (await import('@/lib/server/services/event.service')).EventService();
      const event = await service.updateStatus(eventId, 'published');
      return json(event);
    }

    if (!auth.permissions.includes('event:update')) {
      return forbidden('You do not have permission to update events');
    }
    const repo = new EventRepository();
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