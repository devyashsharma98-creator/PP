import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { AuthRequiredError } from "@/lib/server/errors";

type Db = Database["public"]["Tables"];
type RoleLookupRow = Pick<Db["roles"]["Row"], "id" | "code" | "name" | "name_hi">;
type ProfileRow = Db["profiles"]["Row"];
type UserRoleAssignmentRow = Db["user_role_assignments"]["Row"];
type UnitRow = Pick<Db["units"]["Row"], "id" | "org_id" | "parent_unit_id" | "unit_kind" | "name">;

export type ActiveRoleAssignment = UserRoleAssignmentRow & {
  role_code: string;
  role_name: string;
  role_name_hi: string | null;
};

export interface RequestAuthContext {
  supabase: SupabaseClient<Database>;
  user: User;
  profile: ProfileRow | null;
  assignments: ActiveRoleAssignment[];
  effectiveRoles: string[];
  units: UnitRow[];
}

function isActiveAssignment(row: UserRoleAssignmentRow, now = new Date()) {
  const startsAt = row.starts_at ? new Date(row.starts_at) : null;
  const endsAt = row.ends_at ? new Date(row.ends_at) : null;
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

export async function requireRequestAuthContext(): Promise<RequestAuthContext> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new AuthRequiredError();
  }

  const [profileRes, rolesRes, assignmentsRes, unitsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("roles").select("id,code,name,name_hi"),
    supabase.from("user_role_assignments").select("*").eq("user_id", user.id),
    supabase.from("units").select("id,org_id,parent_unit_id,unit_kind,name"),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (rolesRes.error) throw rolesRes.error;
  if (assignmentsRes.error) throw assignmentsRes.error;
  if (unitsRes.error) throw unitsRes.error;

  const roleById = new Map<string, RoleLookupRow>((rolesRes.data ?? []).map((r) => [r.id, r]));
  const assignments: ActiveRoleAssignment[] = (assignmentsRes.data ?? [])
    .filter((row) => isActiveAssignment(row))
    .map((row) => {
      const role = roleById.get(row.role_id);
      if (!role) return null;
      return {
        ...row,
        role_code: role.code,
        role_name: role.name,
        role_name_hi: role.name_hi ?? null,
      };
    })
    .filter((row): row is ActiveRoleAssignment => Boolean(row));

  const effectiveRoles = Array.from(new Set(assignments.map((a) => a.role_code)));

  return {
    supabase,
    user,
    profile: profileRes.data ?? null,
    assignments,
    effectiveRoles,
    units: unitsRes.data ?? [],
  };
}
