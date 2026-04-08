/**
 * Pragya Pravah — Session Cookie Management
 *
 * Manages the httpOnly session cookie that stores the JWT.
 * Cookie is Secure in production, SameSite=Lax.
 */
import "server-only";

import { cookies } from "next/headers";
import { verifyJwt, type VerifiedSession } from "./jwt";

export type { VerifiedSession } from "./jwt";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "pp_session";
const COOKIE_TTL = Number(process.env.SESSION_COOKIE_TTL_SECONDS ?? "86400");
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Write the session JWT into a secure httpOnly cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: COOKIE_TTL,
    path: "/",
  });
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

/**
 * Read and verify the current session from the request cookies.
 * Returns null if no valid session exists.
 */
export async function getSession(): Promise<VerifiedSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyJwt(token);
}

/**
 * Read the raw JWT token string from cookies (without verification).
 * Used when you need to forward the token.
 */
export async function getRawToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}
