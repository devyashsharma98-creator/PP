import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

export const NEON_SESSION_COOKIE = "pp_neon_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

export interface NeonSessionPayload {
  userId: string;
  email: string | null;
  exp: number;
}

function getSessionSecret() {
  return process.env.APP_SESSION_SECRET || "dev-neon-session-secret";
}

function toBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(data: string) {
  return createHmac("sha256", getSessionSecret()).update(data).digest("base64url");
}

export function createSessionToken(userId: string, email: string | null) {
  const payload: NeonSessionPayload = {
    userId,
    email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  };
  const encoded = toBase64Url(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function parseSessionToken(token: string | null | undefined): NeonSessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [encoded, actualSig] = parts;
  const expectedSig = sign(encoded);

  const actualBuf = Buffer.from(actualSig, "utf8");
  const expectedBuf = Buffer.from(expectedSig, "utf8");
  if (actualBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(actualBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as NeonSessionPayload;
    if (!parsed?.userId || typeof parsed.exp !== "number") return null;
    if (parsed.exp <= Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) return null;
  const segments = cookieHeader.split(";");
  for (const segment of segments) {
    const [rawKey, ...rest] = segment.trim().split("=");
    if (rawKey !== name) continue;
    return decodeURIComponent(rest.join("="));
  }
  return null;
}

