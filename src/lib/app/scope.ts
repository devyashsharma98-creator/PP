export type AssignmentScopeType = "org" | "unit" | "department" | "event" | "article";

export interface ScopedAssignmentLike {
  roleCode?: string | null;
  role_code?: string | null;
  scopeType?: AssignmentScopeType | null;
  scope_type?: AssignmentScopeType | null;
  orgId?: string | null;
  org_id?: string | null;
  unitId?: string | null;
  unit_id?: string | null;
  departmentId?: string | null;
  department_id?: string | null;
  scopeEntityId?: string | null;
  scope_entity_id?: string | null;
}

export interface UnitTreeLike {
  id: string;
  parentUnitId?: string | null;
  parent_unit_id?: string | null;
}

export interface ScopedRowLike {
  id?: string | null;
  unitId?: string | null;
  unit_id?: string | null;
  departmentId?: string | null;
  department_id?: string | null;
  createdBy?: string | null;
  created_by?: string | null;
  authorUserId?: string | null;
  author_user_id?: string | null;
  submittedByUserId?: string | null;
  submitted_by_user_id?: string | null;
}

export interface ScopedAccess {
  orgWide: boolean;
  unitIds: Set<string>;
  departmentIds: Set<string>;
  eventIds: Set<string>;
  articleIds: Set<string>;
}

const ORG_WIDE_ROLES = new Set([
  "super_admin",
  "org_admin",
  "kshetra_reviewer",
  "prant_sanyojak",
  "prant_aayam_pramukh",
  "vibhag_pramukh",
]);

function roleCodeOf(assignment: ScopedAssignmentLike) {
  return assignment.roleCode ?? assignment.role_code ?? "";
}

function scopeTypeOf(assignment: ScopedAssignmentLike): AssignmentScopeType {
  return assignment.scopeType ?? assignment.scope_type ?? "org";
}

function unitIdOf(value: ScopedAssignmentLike | ScopedRowLike) {
  return value.unitId ?? value.unit_id ?? null;
}

function departmentIdOf(value: ScopedAssignmentLike | ScopedRowLike) {
  return value.departmentId ?? value.department_id ?? null;
}

function scopeEntityIdOf(assignment: ScopedAssignmentLike) {
  return assignment.scopeEntityId ?? assignment.scope_entity_id ?? null;
}

function buildUnitChildren(units: UnitTreeLike[]) {
  const children = new Map<string, string[]>();
  for (const unit of units) {
    const parentId = unit.parentUnitId ?? unit.parent_unit_id ?? null;
    if (!parentId) continue;
    const list = children.get(parentId) ?? [];
    list.push(unit.id);
    children.set(parentId, list);
  }
  return children;
}

function addUnitWithChildren(target: Set<string>, unitId: string, children: Map<string, string[]>) {
  if (target.has(unitId)) return;
  target.add(unitId);
  for (const childId of children.get(unitId) ?? []) {
    addUnitWithChildren(target, childId, children);
  }
}

export function resolveScopedAccess(assignments: ScopedAssignmentLike[], units: UnitTreeLike[] = []): ScopedAccess {
  const access: ScopedAccess = {
    orgWide: false,
    unitIds: new Set(),
    departmentIds: new Set(),
    eventIds: new Set(),
    articleIds: new Set(),
  };
  const unitChildren = buildUnitChildren(units);

  for (const assignment of assignments) {
    const roleCode = roleCodeOf(assignment);
    const scopeType = scopeTypeOf(assignment);
    const unitId = unitIdOf(assignment);
    const departmentId = departmentIdOf(assignment);
    const scopeEntityId = scopeEntityIdOf(assignment);

    if (scopeType === "org" && ORG_WIDE_ROLES.has(roleCode)) {
      access.orgWide = true;
      continue;
    }

    if (unitId) addUnitWithChildren(access.unitIds, unitId, unitChildren);
    if (departmentId) access.departmentIds.add(departmentId);
    if (scopeType === "unit" && scopeEntityId) addUnitWithChildren(access.unitIds, scopeEntityId, unitChildren);
    if (scopeType === "department" && scopeEntityId) access.departmentIds.add(scopeEntityId);
    if (scopeType === "event" && scopeEntityId) access.eventIds.add(scopeEntityId);
    if (scopeType === "article" && scopeEntityId) access.articleIds.add(scopeEntityId);
  }

  return access;
}

export function rowMatchesScope(access: ScopedAccess, row: ScopedRowLike, ownerUserId?: string | null) {
  if (access.orgWide) return true;

  const rowId = row.id ?? null;
  const unitId = unitIdOf(row);
  const departmentId = departmentIdOf(row);
  const ownerIds = [row.createdBy, row.created_by, row.authorUserId, row.author_user_id, row.submittedByUserId, row.submitted_by_user_id].filter(Boolean);

  if (ownerUserId && ownerIds.includes(ownerUserId)) return true;
  if (rowId && (access.eventIds.has(rowId) || access.articleIds.has(rowId))) return true;
  if (unitId && access.unitIds.has(unitId)) return true;
  if (departmentId && access.departmentIds.has(departmentId)) return true;
  return false;
}

export function filterRowsByScope<T extends ScopedRowLike>(rows: T[], access: ScopedAccess, ownerUserId?: string | null) {
  if (access.orgWide) return rows;
  return rows.filter((row) => rowMatchesScope(access, row, ownerUserId));
}
