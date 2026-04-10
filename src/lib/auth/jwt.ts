/**
 * Pragya Pravah — JWT Utilities
 *
 * Signs and verifies HS256 JWTs using the `jose` library.
 * The token payload encodes the authenticated user's identity,
 * effective role codes, and org context.
 *
 * SECURITY: JWT_SECRET must be at least 64 hex characters.
 * Generate with: openssl rand -hex 64
 */
import "server-only";

import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { RoleCode } from "../permissions/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppJwtPayload extends JWTPayload {
  userId: string;
  email: string;
  orgId: string;
  orgCode: string;
  displayName: string | null;
  primaryRoleCode: RoleCode;
  effectiveRoleCodes: RoleCode[];
  unitId: string | null;
  departmentId: string | null;
  assignments?: SessionAssignment[];
}

export interface SessionAssignment {
  roleCode: RoleCode;
  scopeType: "org" | "unit" | "department" | "event" | "article";
  orgId: string | null;
  unitId: string | null;
  departmentId: string | null;
  scopeEntityId: string | null;
  isPrimary: boolean;
}

export interface VerifiedSession {
  userId: string;
  email: string;
  orgId: string;
  orgCode: string;
  displayName: string | null;
  primaryRoleCode: RoleCode;
  effectiveRoleCodes: RoleCode[];
  unitId: string | null;
  departmentId: string | null;
  assignments: SessionAssignment[];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET env var is missing or too short (min 32 chars required; 64 recommended)."
    );
  }
  return new TextEncoder().encode(secret);
}

function getExpiresIn(): string {
  return process.env.JWT_EXPIRES_IN ?? "24h";
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sign a new JWT for an authenticated session.
 */
export async function signJwt(payload: Omit<AppJwtPayload, "iat" | "exp" | "jti">): Promise<string> {
  const secret = getSecret();
  const expiresIn = getExpiresIn();

  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .setJti(crypto.randomUUID())
    .sign(secret);
}

/**
 * Verify a JWT and return the typed payload.
 * Returns null if the token is invalid, expired, or tampered.
 */
export async function verifyJwt(token: string): Promise<VerifiedSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });

    const p = payload as AppJwtPayload;

    // Validate required fields are present
    if (!p.userId || !p.email || !p.orgId || !p.primaryRoleCode) {
      return null;
    }

    const fallbackAssignment: SessionAssignment = {
      roleCode: p.primaryRoleCode,
      scopeType: "org",
      orgId: p.orgId,
      unitId: p.unitId ?? null,
      departmentId: p.departmentId ?? null,
      scopeEntityId: null,
      isPrimary: true,
    };

    return {
      userId: p.userId,
      email: p.email,
      orgId: p.orgId,
      orgCode: p.orgCode,
      displayName: p.displayName ?? null,
      primaryRoleCode: p.primaryRoleCode,
      effectiveRoleCodes: p.effectiveRoleCodes ?? [p.primaryRoleCode],
      unitId: p.unitId ?? null,
      departmentId: p.departmentId ?? null,
      assignments: Array.isArray(p.assignments) && p.assignments.length ? p.assignments : [fallbackAssignment],
    };
  } catch {
    return null;
  }
}
