/**
 * Pragya Pravah — API Response Helpers
 *
 * Standardized JSON response format for all API routes:
 *
 *   Success:  { success: true,  data: T,    meta?: PaginationMeta }
 *   Error:    { success: false, error: { code: string, message: string } }
 */
import { NextResponse } from "next/server";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string };
}

// ── Response builders ─────────────────────────────────────────────────────────

export function apiSuccess<T>(
  data: T,
  options: { status?: number; meta?: PaginationMeta } = {}
): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (options.meta) body.meta = options.meta;
  return NextResponse.json(body, { status: options.status ?? 200 });
}

export function apiCreated<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return apiSuccess(data, { status: 201 });
}

export function apiNoContent(): Response {
  return new Response(null, { status: 204 });
}

export function apiError(
  code: string,
  message: string,
  status = 400
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    { success: false, error: { code, message } },
    { status }
  );
}

// ── Common error shortcuts ─────────────────────────────────────────────────────

export const notFound = (msg = "Resource not found.") =>
  apiError("NOT_FOUND", msg, 404);

export const unauthorized = (msg = "Authentication required.") =>
  apiError("UNAUTHORIZED", msg, 401);

export const forbidden = (msg = "You do not have permission.") =>
  apiError("FORBIDDEN", msg, 403);

export const badRequest = (msg: string) =>
  apiError("BAD_REQUEST", msg, 400);

export const conflict = (msg: string) =>
  apiError("CONFLICT", msg, 409);

export const serverError = (msg = "An internal error occurred.") =>
  apiError("INTERNAL_ERROR", msg, 500);

// ── Pagination helpers ────────────────────────────────────────────────────────

export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): { page: number; limit: number; offset: number } {
  const maxLimit = defaults.maxLimit ?? 100;
  const page = Math.max(1, Number(searchParams.get("page") ?? defaults.page ?? 1));
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number(searchParams.get("limit") ?? defaults.limit ?? 20))
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

export function paginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return { page, limit, total, hasMore: page * limit < total };
}
