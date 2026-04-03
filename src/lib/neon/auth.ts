import "server-only";
import { neon } from "@neondatabase/serverless";
import { NEON_SESSION_COOKIE, parseSessionToken, readCookieValue } from "./session";
import { requireDatabaseUrl } from "./env";

const sql = neon(requireDatabaseUrl());

export class NeonAuthRequiredError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "NeonAuthRequiredError";
  }
}

export function isNeonAuthRequiredError(error: unknown): error is NeonAuthRequiredError {
  return error instanceof NeonAuthRequiredError;
}

export interface NeonAuthContext {
  user: { id: string; email: string | null };
  profile: {
    id: string;
    org_id: string | null;
    display_name: string | null;
    email: string | null;
  } | null;
  assignments: Array<{
    id: string;
    role_code: string;
    role_name: string;
    role_name_hi: string | null;
    scope_type: "org" | "unit" | "department" | "event" | "article";
    org_id: string | null;
    unit_id: string | null;
    department_id: string | null;
    scope_entity_id: string | null;
    is_primary: boolean;
  }>;
  effectiveRoles: string[];
  units: Array<{
    id: string;
    org_id: string;
    parent_unit_id: string | null;
    unit_kind: string;
    name: string;
  }>;
}

function isActiveAssignment(row: { starts_at?: string | null; ends_at?: string | null }, now = new Date()) {
  const startsAt = row.starts_at ? new Date(row.starts_at) : null;
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

export async function requireNeonAuthContext(req: Request): Promise<NeonAuthContext> {
  const token = readCookieValue(req.headers.get("cookie"), NEON_SESSION_COOKIE);
  const session = parseSessionToken(token);
  if (!session) {
    throw new NeonAuthRequiredError();
  }

  const [profiles, roles, assignments, units] = await Promise.all([
    sql`
      select id, org_id, display_name, email
      from public.profiles
      where id = ${session.userId} and is_active = true
      limit 1
    `,
    sql`select id, code, name, name_hi from public.roles`,
    sql`
      select id, role_id, scope_type, org_id, unit_id, department_id, scope_entity_id, is_primary, starts_at, ends_at
      from public.user_role_assignments
      where user_id = ${session.userId}
    `,
    sql`select id, org_id, parent_unit_id, unit_kind, name from public.units`,
  ]);

  const profile = (profiles as Array<{
    id: string;
    org_id: string | null;
    display_name: string | null;
    email: string | null;
  }>)[0];

  if (!profile) {
    throw new NeonAuthRequiredError("Profile not found for session user.");
  }

  const roleById = new Map(
    (roles as Array<{ id: string; code: string; name: string; name_hi: string | null }>).map((r) => [r.id, r]),
  );

  const activeAssignments = (assignments as Array<{
    id: string;
    role_id: string;
    scope_type: "org" | "unit" | "department" | "event" | "article";
    org_id: string | null;
    unit_id: string | null;
    department_id: string | null;
    scope_entity_id: string | null;
    is_primary: boolean;
    starts_at: string | null;
    ends_at: string | null;
  }>)
    .filter((row) => isActiveAssignment(row))
    .map((row) => {
      const role = roleById.get(row.role_id);
      if (!role) return null;
      return {
        id: row.id,
        role_code: role.code,
        role_name: role.name,
        role_name_hi: role.name_hi ?? null,
        scope_type: row.scope_type,
        org_id: row.org_id,
        unit_id: row.unit_id,
        department_id: row.department_id,
        scope_entity_id: row.scope_entity_id,
        is_primary: row.is_primary,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  const effectiveRoles = Array.from(new Set(activeAssignments.map((a) => a.role_code)));

  return {
    user: {
      id: profile.id,
      email: profile.email ?? session.email ?? null,
    },
    profile,
    assignments: activeAssignments,
    effectiveRoles,
    units: units as NeonAuthContext["units"],
  };
}
