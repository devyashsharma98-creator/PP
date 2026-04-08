/**
 * Pragya Pravah — In-Memory Rate Limiter
 *
 * Token-bucket rate limiter keyed by IP address.
 * Works per-process — for multi-instance deployments, replace the store
 * with a Redis/Upstash backend.
 *
 * Two presets:
 *   apiLimiter       — general authenticated API (60 req/min)
 *   publicLimiter    — public submissions (registrations, votes) (10 req/min)
 */
import { NextRequest, NextResponse } from "next/server";
import { apiError } from "../response";

// ── Internal store ────────────────────────────────────────────────────────────

interface BucketEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, BucketEntry>();

// Periodically clean up expired entries (every 5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > CLEANUP_INTERVAL_MS) {
      store.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS);

// ── Core ──────────────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  max: number;        // max requests per window
  windowMs: number;   // window duration in ms
  keyPrefix?: string; // optional prefix to namespace keys
}

/**
 * Check and update rate limit for an IP.
 * Returns an error response if the limit is exceeded, otherwise null.
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig
): NextResponse | null {
  const now = Date.now();
  const key = `${config.keyPrefix ?? "rl"}:${ip}`;
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now });
    return null;
  }

  if (entry.count >= config.max) {
    const retryAfterSec = Math.ceil(
      (config.windowMs - (now - entry.windowStart)) / 1000
    );
    const res = apiError(
      "RATE_LIMITED",
      `Too many requests. Please retry after ${retryAfterSec} seconds.`,
      429
    ) as NextResponse;
    res.headers.set("Retry-After", String(retryAfterSec));
    return res;
  }

  entry.count += 1;
  return null;
}

// ── Preconfigured limiters ────────────────────────────────────────────────────

const API_MAX = Number(process.env.RATE_LIMIT_MAX ?? "60");
const API_WINDOW = Number(process.env.RATE_LIMIT_WINDOW_MS ?? "60000");
const PUBLIC_MAX = Number(process.env.PUBLIC_RATE_LIMIT_MAX ?? "10");
const PUBLIC_WINDOW = Number(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS ?? "60000");

/** Rate-limit middleware for authenticated API routes */
export function withApiRateLimit(
  ip: string
): NextResponse | null {
  return checkRateLimit(ip, { max: API_MAX, windowMs: API_WINDOW, keyPrefix: "api" });
}

/** Stricter rate-limit for public submission endpoints */
export function withPublicRateLimit(
  ip: string
): NextResponse | null {
  return checkRateLimit(ip, { max: PUBLIC_MAX, windowMs: PUBLIC_WINDOW, keyPrefix: "pub" });
}

/**
 * Higher-order wrapper — applies API rate limiting to any Next.js route handler.
 */
export function rateLimited(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<Response>,
  config?: RateLimitConfig
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<Response> => {
    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const limitRes = config
      ? checkRateLimit(ip, config)
      : withApiRateLimit(ip);

    if (limitRes) return limitRes;
    return handler(req, ...args);
  };
}
