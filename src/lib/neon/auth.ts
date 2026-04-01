import "server-only";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL not set");
const sql = neon(connectionString);

export interface NeonAuthContext {
  user: { id: string; email: string };
  profile: {
    id: string;
    org_id: string | null;
    display_name: string | null;
    email: string | null;
  } | null;
  assignments: Array<{
    role_code: string;
    role_name: string;
    role_name_hi: string | null;
    org_id: string | null;
    unit_id: string | null;
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

export async function getDemoAuthContext(): Promise<NeonAuthContext> {
  // Load org, units, and roles from Neon
  const [orgs, units, roles] = await Promise.all([
    sql`SELECT id FROM public.org_settings WHERE org_code = 'pragya-pravah' LIMIT 1`,
    sql`SELECT id, org_id, parent_unit_id, unit_kind, name FROM public.units`,
    sql`SELECT id, code, name, name_hi FROM public.roles`,
  ]);

  const orgId = (orgs as Array<{ id: string }>)[0]?.id ?? null;

  // Create a demo user context
  const demoUser = {
    id: "00000000-0000-0000-0000-000000000001",
    email: "demo@pragya-pravah.org",
  };

  // Assign all roles to demo user for full access
  const demoAssignments = (roles as Array<{ code: string; name: string; name_hi: string | null }>).map(
    (r) => ({
      role_code: r.code,
      role_name: r.name,
      role_name_hi: r.name_hi,
      org_id: orgId,
      unit_id: null,
    }),
  );

  return {
    user: demoUser,
    profile: {
      id: demoUser.id,
      org_id: orgId,
      display_name: "Demo User",
      email: demoUser.email,
    },
    assignments: demoAssignments,
    effectiveRoles: (roles as Array<{ code: string }>).map((r) => r.code),
    units: units as NeonAuthContext["units"],
  };
}
