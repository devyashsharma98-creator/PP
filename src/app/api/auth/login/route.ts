/**
 * POST /api/auth/login
 *
 * Authenticates a user with email + password.
 * Issues a signed JWT stored in an httpOnly session cookie.
 */
import "server-only";

import { NextRequest } from "next/server";

import { withPublicRateLimit, checkLoginRateLimit } from "@/lib/middleware/rate-limit";
import { loginSchema } from "@/lib/validators/auth";
import { apiSuccess, badRequest } from "@/lib/response";
import { authenticateUser } from "@/lib/server/services/auth-service";

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(req: NextRequest): Promise<Response> {
  const authStartedAt = Date.now();

  const ip = extractIp(req);
  const rateRes = withPublicRateLimit(ip);
  if (rateRes) return rateRes;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Request body must be valid JSON.");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error.errors[0]?.message ?? "Invalid input.");
  }

  const { email, password } = parsed.data;

  const loginRateRes = checkLoginRateLimit(ip, email);
  if (loginRateRes) return loginRateRes;

  const result = await authenticateUser(email, password, ip, authStartedAt);
  if (result instanceof Response) return result;

  return apiSuccess(result);
}
