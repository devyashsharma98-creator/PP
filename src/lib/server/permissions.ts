import "server-only";

import type {
  AppPermissionSummary,
  AppRoleAssignmentSummary,
  AppViewerContext,
  CanonicalRoleCode,
  UiRole,
} from "@/lib/app/contracts";
import type { RequestAuthContext, ActiveRoleAssignment } from "@/lib/server/auth-context";
import type { Database } from "@/types/database";
import { ForbiddenError } from "@/lib/server/errors";

type Db = Database["public"]["Tables"];
type EventRow = Db["events"]["Row"];
type ArticleRow = Db["articles"]["Row"];
type PollRow = Db["event_polls"]["Row"];
type PracharRow = Db["prachar_statuses"]["Row"];
type UnitRow = RequestAuthContext["units"][number];

type ScopedEntity = {
  entityType: "event" | "article" | "prachar";
  entityId?: string | null;
  orgId?: string | null;
  unitId?: string | null;
  departmentId?: string | null;
};

const CANONICAL_ROLE_PRECEDENCE: CanonicalRoleCode[] = [
  "super_admin",
  "org_admin",
  "kshetra_reviewer",
  "prant_sanyojak",
  "prant_aayam_pramukh",
  "vibhag_pramukh",
  "aayam_pramukh",
  "unit_head",
  "karyakarta",
];

const CANONICAL_ROLE_SET = new Set<string>(CANONICAL_ROLE_PRECEDENCE);

const UI_ROLE_FROM_CANONICAL: Record<CanonicalRoleCode, UiRole> = {
  super_admin: "vibhag_pramukh",
  org_admin: "vibhag_pramukh",
  kshetra_reviewer: "vibhag_pramukh",
  prant_sanyojak: "vibhag_pramukh",
  prant_aayam_pramukh: "vibhag_pramukh",
  vibhag_pramukh: "vibhag_pramukh",
  aayam_pramukh: "aayam_pramukh",
  unit_head: "unit_head",
  karyakarta: "karyakarta",
};

function toCanonicalRoleCode(value: string): CanonicalRoleCode | null {
  if (CANONICAL_ROLE_SET.has(value)) {
    return value as CanonicalRoleCode;
  }
  return null;
}

function hasAnyRole(ctx: RequestAuthContext, roles: CanonicalRoleCode[]) {
  const set = new Set(ctx.effectiveRoles);
  return roles.some((role) => set.has(role));
}

function getPrimaryRoleCode(ctx: RequestAuthContext): CanonicalRoleCode {
  const set = new Set(ctx.effectiveRoles);
  for (const role of CANONICAL_ROLE_PRECEDENCE) {
    if (set.has(role)) return role;
  }
  return "karyakarta";
}

function buildUnitParentMap(units: UnitRow[]) {
  const parentById = new Map<string, string | null>();
  for (const unit of units) parentById.set(unit.id, unit.parent_unit_id ?? null);
  return parentById;
}

function unitIsAncestorOrSelf(units: UnitRow[], candidateAncestorId: string | null | undefined, unitId: string | null | undefined, parentById: Map<string, string | null>) {
  if (!candidateAncestorId || !unitId) return false;
  if (candidateAncestorId === unitId) return true;
  let current = parentById.get(unitId) ?? null;
  const guard = new Set<string>();
  while (current) {
    if (current === candidateAncestorId) return true;
    if (guard.has(current)) break;
    guard.add(current);
    current = parentById.get(current) ?? null;
  }
  return false;
}

function assignmentMatchesEntity(ctx: RequestAuthContext, assignment: ActiveRoleAssignment, entity: ScopedEntity, parentById: Map<string, string | null>) {
  if (assignment.org_id && entity.orgId && assignment.org_id !== entity.orgId) return false;

  switch (assignment.scope_type) {
    case "org":
      return true;
    case "unit": {
      const assignedUnitId = assignment.unit_id ?? assignment.scope_entity_id;
      return unitIsAncestorOrSelf(ctx.units, assignedUnitId, entity.unitId, parentById);
    }
    case "department": {
      const assignedDepartmentId = assignment.department_id ?? assignment.scope_entity_id;
      if (!assignedDepartmentId) return false;
      if (entity.departmentId && assignedDepartmentId !== entity.departmentId) return false;
      if (assignment.unit_id && entity.unitId) {
        return unitIsAncestorOrSelf(ctx.units, assignment.unit_id, entity.unitId, parentById);
      }
      return true;
    }
    case "event":
    case "article":
      return Boolean(entity.entityId && assignment.scope_entity_id && assignment.scope_entity_id === entity.entityId);
    default:
      return false;
  }
}

function hasScopedRole(ctx: RequestAuthContext, roles: CanonicalRoleCode[], entity: ScopedEntity) {
  const parentById = buildUnitParentMap(ctx.units);
  return ctx.assignments.some((assignment) => {
    const code = toCanonicalRoleCode(assignment.role_code);
    if (!code || !roles.includes(code)) return false;
    return assignmentMatchesEntity(ctx, assignment, entity, parentById);
  });
}

function eventEntity(row: Pick<EventRow, "id" | "org_id" | "unit_id" | "department_id">): ScopedEntity {
  return {
    entityType: "event",
    entityId: row.id,
    orgId: row.org_id,
    unitId: row.unit_id,
    departmentId: row.department_id,
  };
}

function articleEntity(row: Pick<ArticleRow, "id" | "org_id" | "unit_id" | "department_id">): ScopedEntity {
  return {
    entityType: "article",
    entityId: row.id,
    orgId: row.org_id,
    unitId: row.unit_id,
    departmentId: row.department_id,
  };
}

export function canReadInternalBootstrap(ctx: RequestAuthContext) {
  if (ctx.profile && ctx.profile.is_active === false) return false;
  return ctx.assignments.length > 0;
}

export function assertCanReadInternalBootstrap(ctx: RequestAuthContext) {
  if (!canReadInternalBootstrap(ctx)) {
    throw new ForbiddenError("You do not have access to internal app data.");
  }
}

export function canCreateEvent(ctx: RequestAuthContext, input: { orgId: string; unitId?: string | null; departmentId?: string | null }) {
  const entity: ScopedEntity = {
    entityType: "event",
    orgId: input.orgId,
    unitId: input.unitId ?? null,
    departmentId: input.departmentId ?? null,
  };
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "unit_head", "aayam_pramukh", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh"],
    entity,
  );
}

export function canViewEvent(ctx: RequestAuthContext, event: EventRow) {
  if (event.submitted_by_user_id && event.submitted_by_user_id === ctx.user.id) return true;
  const entity = eventEntity(event);
  if (event.status === "published") {
    return hasScopedRole(
      ctx,
      [
        "super_admin",
        "org_admin",
        "kshetra_reviewer",
        "prant_sanyojak",
        "prant_aayam_pramukh",
        "vibhag_pramukh",
        "aayam_pramukh",
        "unit_head",
        "karyakarta",
      ],
      entity,
    );
  }
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh", "aayam_pramukh", "unit_head"],
    entity,
  );
}

export function canManageEventDraft(ctx: RequestAuthContext, event: EventRow) {
  if (event.submitted_by_user_id && event.submitted_by_user_id === ctx.user.id) return true;
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh", "aayam_pramukh", "unit_head"],
    eventEntity(event),
  );
}

export function canReviewEventAtAayam(ctx: RequestAuthContext, event: EventRow) {
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh", "aayam_pramukh"],
    eventEntity(event),
  );
}

export function canReviewAtVibhag(ctx: RequestAuthContext, entity: ScopedEntity) {
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh"],
    entity,
  );
}

export function canAuthorizeAtPrant(ctx: RequestAuthContext, entity: ScopedEntity) {
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh"],
    entity,
  );
}

export function canEscalateToKshetra(ctx: RequestAuthContext, entity: ScopedEntity) {
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer"],
    entity,
  );
}

export function canPublishEvent(ctx: RequestAuthContext, event: EventRow) {
  return canAuthorizeAtPrant(ctx, eventEntity(event));
}

export function canFinalizePoll(ctx: RequestAuthContext, event: EventRow, _poll: PollRow) {
  return canPublishEvent(ctx, event);
}

export function canUpdatePracharStatus(ctx: RequestAuthContext, event: EventRow, _prachar?: PracharRow | null) {
  // TODO(access-phase2): Require Prachar aayam-specific assignment when event.department_id is populated consistently.
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh", "aayam_pramukh"],
    { ...eventEntity(event), entityType: "prachar" },
  );
}

export function canCreateArticle(ctx: RequestAuthContext, input: { orgId: string; unitId?: string | null; departmentId?: string | null }) {
  const entity: ScopedEntity = {
    entityType: "article",
    orgId: input.orgId,
    unitId: input.unitId ?? null,
    departmentId: input.departmentId ?? null,
  };
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "unit_head", "aayam_pramukh", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh", "karyakarta"],
    entity,
  );
}

export function canViewArticle(ctx: RequestAuthContext, article: ArticleRow) {
  if (article.author_user_id && article.author_user_id === ctx.user.id) return true;
  if (article.status === "authorized_public" || article.status === "published") {
    return hasScopedRole(
      ctx,
      [
        "super_admin",
        "org_admin",
        "kshetra_reviewer",
        "prant_sanyojak",
        "prant_aayam_pramukh",
        "vibhag_pramukh",
        "aayam_pramukh",
        "unit_head",
        "karyakarta",
      ],
      articleEntity(article),
    );
  }
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh", "aayam_pramukh", "unit_head"],
    articleEntity(article),
  );
}

export function canReviewArticleAtUnit(ctx: RequestAuthContext, article: ArticleRow) {
  return hasScopedRole(
    ctx,
    ["super_admin", "org_admin", "kshetra_reviewer", "prant_sanyojak", "prant_aayam_pramukh", "vibhag_pramukh", "aayam_pramukh", "unit_head"],
    articleEntity(article),
  );
}

export function canPublishArticle(ctx: RequestAuthContext, article: ArticleRow) {
  return canAuthorizeAtPrant(ctx, articleEntity(article));
}

export function canTransitionEventStatus(ctx: RequestAuthContext, event: EventRow, target: EventRow["status"]) {
  const entity = eventEntity(event);
  if (target === "pending_aayam_review") return canManageEventDraft(ctx, event);
  if (target === "pending_vibhag_review") return canReviewEventAtAayam(ctx, event);
  if (target === "pending_prant_authorization") return canReviewAtVibhag(ctx, entity);
  if (target === "pending_prant_dual_authorization") return canAuthorizeAtPrant(ctx, entity);
  if (target === "authorized_public" || target === "published") return canAuthorizeAtPrant(ctx, entity);
  if (target === "escalated_kshetra") return canAuthorizeAtPrant(ctx, entity);
  if (target === "returned_for_revision") return canReviewEventAtAayam(ctx, event) || canReviewAtVibhag(ctx, entity);
  if (target === "rejected") return canReviewAtVibhag(ctx, entity) || canAuthorizeAtPrant(ctx, entity);

  // Legacy support
  if ((target as string) === "pending_final_approval") return canReviewEventAtAayam(ctx, event);
  if (target === "draft") return canManageEventDraft(ctx, event) || canReviewEventAtAayam(ctx, event);
  if (target === "cancelled") return canPublishEvent(ctx, event);
  return false;
}

export function canTransitionArticleStatus(ctx: RequestAuthContext, article: ArticleRow, target: ArticleRow["status"]) {
  const entity = articleEntity(article);
  if (target === "pending_unit_head_review") {
    return (
      article.author_user_id === ctx.user.id ||
      canCreateArticle(ctx, {
        orgId: article.org_id,
        unitId: article.unit_id,
        departmentId: article.department_id,
      })
    );
  }
  if (target === "pending_aayam_review") return canReviewArticleAtUnit(ctx, article);
  if (target === "pending_vibhag_review") return canReviewArticleAtUnit(ctx, article);
  if (target === "pending_prant_authorization") return canReviewAtVibhag(ctx, entity);
  if (target === "authorized_public" || target === "published") return canAuthorizeAtPrant(ctx, entity);
  if (target === "returned_for_revision") return canReviewArticleAtUnit(ctx, article) || canReviewAtVibhag(ctx, entity);
  if (target === "rejected") return canReviewAtVibhag(ctx, entity) || canAuthorizeAtPrant(ctx, entity);

  if (target === "draft") return canReviewArticleAtUnit(ctx, article) || article.author_user_id === ctx.user.id;
  if (target === "archived") return canPublishArticle(ctx, article);
  return false;
}

export function buildPermissionSummary(ctx: RequestAuthContext): AppPermissionSummary {
  return {
    canReadInternalBootstrap: canReadInternalBootstrap(ctx),
    canCreateEvent: hasAnyRole(ctx, ["super_admin", "org_admin", "unit_head", "aayam_pramukh", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh"]),
    canCreateArticle: hasAnyRole(ctx, ["super_admin", "org_admin", "unit_head", "aayam_pramukh", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh", "karyakarta"]),
    canFinalizePoll: hasAnyRole(ctx, ["super_admin", "org_admin", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]),
    canPublishEvent: hasAnyRole(ctx, ["super_admin", "org_admin", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]),
    canPublishArticle: hasAnyRole(ctx, ["super_admin", "org_admin", "aayam_pramukh", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]),
    canUpdatePrachar: hasAnyRole(ctx, ["super_admin", "org_admin", "aayam_pramukh", "vibhag_pramukh", "prant_sanyojak", "prant_aayam_pramukh", "kshetra_reviewer"]),
  };
}

export function buildViewerContext(ctx: RequestAuthContext): AppViewerContext {
  const canonicalRoles = Array.from(
    new Set(
      ctx.effectiveRoles
        .map((role) => toCanonicalRoleCode(role))
        .filter((role): role is CanonicalRoleCode => Boolean(role)),
    ),
  );
  const primaryRoleCode = canonicalRoles.length ? getPrimaryRoleCode({ ...ctx, effectiveRoles: canonicalRoles }) : "karyakarta";
  const uiRole = UI_ROLE_FROM_CANONICAL[primaryRoleCode];

  const assignments: AppRoleAssignmentSummary[] = [];
  for (const assignment of ctx.assignments) {
    const roleCode = toCanonicalRoleCode(assignment.role_code);
    if (!roleCode) continue;
    assignments.push({
      id: assignment.id,
      roleCode,
      roleName: assignment.role_name,
      roleNameHi: assignment.role_name_hi ?? undefined,
      scopeType: assignment.scope_type,
      orgId: assignment.org_id,
      unitId: assignment.unit_id,
      departmentId: assignment.department_id,
      scopeEntityId: assignment.scope_entity_id,
      isPrimary: assignment.is_primary,
    });
  }

  return {
    userId: ctx.user.id,
    email: ctx.user.email ?? ctx.profile?.email ?? null,
    displayName: ctx.profile?.display_name ?? null,
    isAuthenticated: true,
    uiRole,
    primaryRoleCode,
    effectiveRoles: canonicalRoles,
    assignments,
    permissions: buildPermissionSummary(ctx),
  };
}

export function assertCanCreateEvent(ctx: RequestAuthContext, input: { orgId: string; unitId?: string | null; departmentId?: string | null }) {
  if (!canCreateEvent(ctx, input)) {
    throw new ForbiddenError("You do not have permission to create events in this scope.");
  }
}

export function assertCanCreateArticle(ctx: RequestAuthContext, input: { orgId: string; unitId?: string | null; departmentId?: string | null }) {
  if (!canCreateArticle(ctx, input)) {
    throw new ForbiddenError("You do not have permission to create articles in this scope.");
  }
}

export function assertCanTransitionEventStatus(ctx: RequestAuthContext, event: EventRow, target: EventRow["status"]) {
  if (!canTransitionEventStatus(ctx, event, target)) {
    throw new ForbiddenError("You do not have permission to update this event status.");
  }
}

export function assertCanFinalizePoll(ctx: RequestAuthContext, event: EventRow, poll: PollRow) {
  if (!canFinalizePoll(ctx, event, poll)) {
    throw new ForbiddenError("You do not have permission to finalize this poll.");
  }
}

export function assertCanTransitionArticleStatus(ctx: RequestAuthContext, article: ArticleRow, target: ArticleRow["status"]) {
  if (!canTransitionArticleStatus(ctx, article, target)) {
    throw new ForbiddenError("You do not have permission to update this article status.");
  }
}

export function assertCanUpdatePracharStatus(ctx: RequestAuthContext, event: EventRow) {
  if (!canUpdatePracharStatus(ctx, event)) {
    throw new ForbiddenError("You do not have permission to update Prachar status for this event.");
  }
}
