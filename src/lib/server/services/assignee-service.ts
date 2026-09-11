import "server-only";

import { ilike, or, type SQL } from "drizzle-orm";

import { profiles } from "@/db/schema/index";
import type { ScopedAccess } from "@/lib/app/scope";
import { canAssignToCandidate, type TaskAccessSubject } from "@/lib/app/task-access";
import type { RoleCode } from "@/lib/permissions/index";
import { findMembersInScope } from "./membership-service";

/**
 * Pragya Pravah — Scoped Assignee Directory
 *
 * Answers one narrow question: who may this user hand work to? It returns only
 * the fields needed to pick a name — id, display names, and the responsibility
 * label — and never the contact details the admin user endpoint carries. It is
 * deliberately separate from /api/v1/users so that a unit head can staff their
 * own unit without that endpoint being widened to non-admins.
 */

export interface AssigneeOption {
  id: string;
  displayName: string | null;
  displayNameHi: string | null;
  responsibility: string | null;
}

export interface AssigneeSearchResult {
  options: AssigneeOption[];
  /** True when the caller's scope reaches nobody but themselves. */
  scopeEmpty: boolean;
}

export async function searchAssignees(args: {
  orgId: string;
  userId: string;
  roleCodes: RoleCode[];
  scope: ScopedAccess;
  search?: string;
  limit: number;
}): Promise<AssigneeSearchResult> {
  const { orgId, userId, roleCodes, scope, search, limit } = args;
  const subject: TaskAccessSubject = { userId, roleCodes, scope };

  const extraConditions: SQL<unknown>[] = [];
  if (search) {
    const term = `%${search}%`;
    const nameClause = or(ilike(profiles.displayName, term), ilike(profiles.displayNameHi, term));
    if (nameClause) extraConditions.push(nameClause);
  }

  // findMembersInScope returns each member together with their *current*
  // department and unit placement. Passing that placement through to the shared
  // rule is what makes the re-check agree with the query: without it every
  // candidate looked unreachable and the picker came back empty for anyone who
  // was not org-wide.
  const members = await findMembersInScope({ orgId, scope, extraConditions, limit });

  const options = members
    .filter((member) =>
      canAssignToCandidate(
        subject,
        {
          id: member.id,
          orgId: member.orgId,
          isActive: member.isActive,
          departmentIds: member.departmentIds,
          unitIds: member.unitIds,
        },
        orgId,
      ),
    )
    .map(({ id, displayName, displayNameHi, responsibility }) => ({
      id,
      displayName,
      displayNameHi,
      responsibility,
    }));

  return { options, scopeEmpty: options.length === 0 };
}
