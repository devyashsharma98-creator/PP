import { NextResponse } from 'next/server';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

export function json<T>(data: T, options?: { status?: number; meta?: ApiResponse<T>['meta'] }): NextResponse {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(options?.meta && { meta: options.meta }),
  };

  return NextResponse.json(body, { status: options?.status ?? 200 });
}

export function errorResponse(
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): NextResponse {
  const body: ApiResponse<null> = {
    success: false,
    error: { code, message, details },
  };

  return NextResponse.json(body, { status: statusCode });
}

export function notFound(resource: string, id: string): NextResponse {
  return errorResponse(404, 'NOT_FOUND', `${resource} with id ${id} not found`);
}

export function unauthorized(message = 'Authentication required'): NextResponse {
  return errorResponse(401, 'UNAUTHORIZED', message);
}

export function forbidden(message = 'Access denied'): NextResponse {
  return errorResponse(403, 'FORBIDDEN', message);
}

export function validationError(message: string, details?: Record<string, unknown>): NextResponse {
  return errorResponse(400, 'VALIDATION_ERROR', message, details);
}