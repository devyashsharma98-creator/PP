import { NextRequest } from 'next/server';
import { EventService } from '@/lib/server/services/event.service';
import { createEventSchema, updateEventSchema } from '@/lib/server/validation/events';
import { json, errorResponse, unauthorized } from '@/lib/server/api/response';
import { requireAuth } from '@/lib/server/middleware/auth';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  const { searchParams } = new URL(req.url);
  const filters = {
    status: searchParams.get('status') || undefined,
    unit_id: searchParams.get('unit_id') || undefined,
    from_date: searchParams.get('from_date') || undefined,
    to_date: searchParams.get('to_date') || undefined,
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20'),
  };

  try {
    const service = new EventService();
    const result = await service.list(filters);
    return json(result.data, { meta: result.pagination });
  } catch (error) {
    console.error('Events list error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch events');
  }
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  if (!auth.permissions.includes('event:create')) {
    return unauthorized('You do not have permission to create events');
  }

  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    const service = new EventService();
    const event = await service.create(parsed.data);
    return json(event, { status: 201 });
  } catch (error) {
    console.error('Events create error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create event');
  }
}

export async function PUT(req: NextRequest) {
  const auth = requireAuth(req);
  if (!auth) {
    return unauthorized();
  }

  try {
    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(400, 'VALIDATION_ERROR', parsed.error.errors[0].message);
    }

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return errorResponse(400, 'VALIDATION_ERROR', 'ids array is required');
    }

    const service = new EventService();
    const updated = await Promise.all(
      body.ids.map((id: string) => service.updateStatus(id, body.status || 'draft'))
    );
    return json(updated);
  } catch (error) {
    console.error('Events bulk update error:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update events');
  }
}
