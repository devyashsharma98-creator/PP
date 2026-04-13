import "server-only";

import type { VerifiedSession } from "@/lib/auth/session";
import type {
  AppOverviewActorRecord,
  AppOverviewLoginRecord,
  AppOverviewPayload,
  CanonicalRoleCode,
} from "@/lib/app/contracts";
import { filterRowsByScope, resolveScopedAccess, rowMatchesScope, type UnitTreeLike } from "@/lib/app/scope";
import { sql } from "@/lib/neon/repository";

type AccountRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  is_active: boolean;
  last_login_at: string | null;
};

type AssignmentRow = {
  user_id: string;
  role_code: CanonicalRoleCode;
  scope_type: "org" | "unit" | "department" | "event" | "article";
  unit_id: string | null;
  department_id: string | null;
  is_primary: boolean;
  display_name: string | null;
  email: string | null;
  is_active: boolean;
};

type UnitRow = { id: string; name: string; unit_kind: string; parent_unit_id: string | null };
type AayamRow = { id: string; name: string; department_kind: string; unit_id: string | null };
type EventRow = {
  id: string;
  title: string;
  status: string;
  unit_id: string | null;
  department_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
type ArticleRow = {
  id: string;
  title: string;
  status: string;
  unit_id: string | null;
  department_id: string | null;
  author_user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
type EventHistoryRow = {
  event_id: string;
  actor_user_id: string | null;
  to_status: string;
  created_at: string;
};
type ArticleReviewRow = {
  article_id: string;
  reviewer_user_id: string | null;
  decision: string;
  created_at: string;
};
type ArticlePublicationRow = {
  article_id: string;
  published_by: string | null;
  published_at: string;
};
type PracharRow = {
  entity_id: string;
  platform: "whatsapp" | "facebook" | "instagram" | "telegram";
  is_done: boolean;
  skip_reason: string | null;
  template_ref: string | null;
};
type AuditSummaryRow = {
  action: string;
  total: number | string;
};

type InactiveAssignmentHolder = {
  displayName: string | null;
  email: string | null;
  roleCode: CanonicalRoleCode;
  scopeType: "org" | "unit" | "department" | "event" | "article";
};

function typedResult<T>(value: unknown) {
  return value as Promise<T>;
}

const ROLE_PRIORITY: CanonicalRoleCode[] = [
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

const PENDING_EVENT_STATUSES = new Set([
  "submitted_by_unit",
  "pending_aayam_review",
  "pending_vibhag_review",
  "pending_prant_authorization",
  "pending_prant_dual_authorization",
  "returned_for_revision",
]);

const PENDING_ARTICLE_STATUSES = new Set([
  "pending_unit_head_review",
  "pending_aayam_review",
  "pending_vibhag_review",
  "pending_prant_authorization",
  "returned_for_revision",
]);

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

function isRecent(value: string | null, days: number) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return date.getTime() >= cutoff;
}

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate()
  );
}

function selectPrimaryRole(roleCodes: CanonicalRoleCode[]) {
  return ROLE_PRIORITY.find((role) => roleCodes.includes(role)) ?? roleCodes[0] ?? null;
}

function getStaleCount(rows: Array<{ status: string; updated_at: string }>, pendingStatuses: Set<string>) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return rows.filter((row) => {
    if (!pendingStatuses.has(row.status)) return false;
    const updatedAt = new Date(row.updated_at);
    return !Number.isNaN(updatedAt.getTime()) && updatedAt.getTime() < cutoff;
  }).length;
}

function hasPracharResolution(row: PracharRow) {
  return row.is_done || Boolean(row.skip_reason?.trim());
}

function createActorIndex(accounts: AccountRow[]) {
  return new Map(
    accounts.map((account) => [
      account.id,
      {
        displayName: account.display_name,
        email: account.email,
      },
    ]),
  );
}

export async function getAppOverview(
  session: VerifiedSession,
  canManageUsers: boolean,
): Promise<AppOverviewPayload> {
  const orgId = session.orgId;

  const [
    accountRows,
    assignmentRows,
    unitRows,
    aayamRows,
    eventRows,
    articleRows,
    eventHistoryRows,
    articleReviewRows,
    articlePublicationRows,
    auditSummaryRows,
    pracharRows,
  ] = await Promise.all([
    typedResult<AccountRow[]>(sql`
      select id, email, display_name, is_active, last_login_at
      from public.profiles
      where org_id = ${orgId}
      order by created_at desc
    `),
    typedResult<AssignmentRow[]>(sql`
      select
        ura.user_id,
        r.code as role_code,
        ura.scope_type,
        ura.unit_id,
        ura.department_id,
        ura.is_primary,
        p.display_name,
        p.email,
        p.is_active
      from public.user_role_assignments ura
      inner join public.roles r on r.id = ura.role_id
      inner join public.profiles p on p.id = ura.user_id
      where p.org_id = ${orgId}
        and ura.starts_at <= now()
        and (ura.ends_at is null or ura.ends_at > now())
    `),
    typedResult<UnitRow[]>(sql`
      select id, name, unit_kind, parent_unit_id
      from public.units
      where org_id = ${orgId} and is_active = true
      order by name asc
    `),
    typedResult<AayamRow[]>(sql`
      select id, name, department_kind, unit_id
      from public.departments_or_aayams
      where org_id = ${orgId} and is_active = true
      order by name asc
    `),
    typedResult<EventRow[]>(sql`
      select id, title, status, unit_id, department_id, created_by, created_at, updated_at
      from public.events
      where org_id = ${orgId}
      order by created_at desc
    `),
    typedResult<ArticleRow[]>(sql`
      select id, title, status, unit_id, department_id, author_user_id, created_by, created_at, updated_at
      from public.articles
      where org_id = ${orgId}
      order by created_at desc
    `),
    typedResult<EventHistoryRow[]>(sql`
      select esh.event_id, esh.actor_user_id, esh.to_status, esh.created_at
      from public.event_status_history esh
      inner join public.events e on e.id = esh.event_id
      where e.org_id = ${orgId}
    `),
    typedResult<ArticleReviewRow[]>(sql`
      select ar.article_id, ar.reviewer_user_id, ar.decision, ar.created_at
      from public.article_reviews ar
      inner join public.articles a on a.id = ar.article_id
      where a.org_id = ${orgId}
    `),
    typedResult<ArticlePublicationRow[]>(sql`
      select ap.article_id, ap.published_by, ap.published_at
      from public.article_publications ap
      inner join public.articles a on a.id = ap.article_id
      where a.org_id = ${orgId}
    `),
    typedResult<AuditSummaryRow[]>(sql`
      select action, count(*)::int as total
      from public.audit_logs
      where org_id = ${orgId}
        and action in ('auth.login_success', 'auth.login_failed')
        and created_at >= now() - interval '30 days'
      group by action
    `),
    typedResult<PracharRow[]>(sql`
      select
        ps.entity_id,
        ps.platform,
        ps.is_done,
        ps.skip_reason,
        ps.template_ref
      from public.prachar_statuses ps
      inner join public.events e on e.id = ps.entity_id
      where ps.entity_type = 'event'
        and e.org_id = ${orgId}
    `),
  ]);

  const scopedAccess = resolveScopedAccess(session.assignments, unitRows as UnitTreeLike[]);
  const scopedEventRows = filterRowsByScope(eventRows, scopedAccess, session.userId);
  const scopedArticleRows = filterRowsByScope(articleRows, scopedAccess, session.userId);
  const scopedEventIds = new Set(scopedEventRows.map((row) => row.id));
  const scopedArticleIds = new Set(scopedArticleRows.map((row) => row.id));
  const scopedAssignmentRows = scopedAccess.orgWide
    ? assignmentRows
    : assignmentRows.filter((assignment) =>
        rowMatchesScope(
          scopedAccess,
          { unit_id: assignment.unit_id, department_id: assignment.department_id },
          session.userId,
        ),
      );

  const unitIdsFromDepartments = new Set(
    aayamRows
      .filter((aayam) => scopedAccess.departmentIds.has(aayam.id))
      .map((aayam) => aayam.unit_id)
      .filter((unitId): unitId is string => Boolean(unitId)),
  );
  const scopedUnitRows = scopedAccess.orgWide
    ? unitRows
    : unitRows.filter((unit) => scopedAccess.unitIds.has(unit.id) || unitIdsFromDepartments.has(unit.id));
  const scopedAayamRows = scopedAccess.orgWide
    ? aayamRows
    : aayamRows.filter(
        (aayam) =>
          scopedAccess.departmentIds.has(aayam.id) ||
          (aayam.unit_id ? scopedAccess.unitIds.has(aayam.unit_id) : false),
      );

  const roleCodesByUser = new Map<string, CanonicalRoleCode[]>();
  const unitHeads = new Set<string>();
  const aayamHeads = new Set<string>();
  const orgRolePresence = new Set<CanonicalRoleCode>();
  const inactiveAssignmentHolders: InactiveAssignmentHolder[] = [];

  for (const assignment of scopedAssignmentRows) {
    const currentRoles = roleCodesByUser.get(assignment.user_id) ?? [];
    currentRoles.push(assignment.role_code);
    roleCodesByUser.set(assignment.user_id, currentRoles);

    orgRolePresence.add(assignment.role_code);

    if (assignment.scope_type === "unit" && assignment.role_code === "unit_head" && assignment.unit_id) {
      unitHeads.add(assignment.unit_id);
    }

    if (
      assignment.scope_type === "department" &&
      (assignment.role_code === "aayam_pramukh" || assignment.role_code === "prant_aayam_pramukh") &&
      assignment.department_id
    ) {
      aayamHeads.add(assignment.department_id);
    }

    if (!assignment.is_active) {
      inactiveAssignmentHolders.push({
        displayName: assignment.display_name,
        email: assignment.email,
        roleCode: assignment.role_code,
        scopeType: assignment.scope_type,
      });
    }
  }

  const missingOrgRoles = scopedAccess.orgWide
    ? [
        ["vibhag_pramukh", "Vibhag Pramukh"],
        ["prant_sanyojak", "Prant Sanyojak"],
      ]
        .filter(([roleCode]) => !orgRolePresence.has(roleCode as CanonicalRoleCode))
        .map(([, label]) => label)
    : [];

  const missingUnits = scopedUnitRows
    .filter((unit) => unit.unit_kind !== "prant")
    .filter((unit) => !unitHeads.has(unit.id))
    .map((unit) => unit.name);

  const missingAayams = scopedAayamRows
    .filter((aayam) => aayam.department_kind !== "other")
    .filter((aayam) => !aayamHeads.has(aayam.id))
    .map((aayam) => aayam.name);

  const pendingEvents = scopedEventRows.filter((row) => PENDING_EVENT_STATUSES.has(row.status)).length;
  const pendingArticles = scopedArticleRows.filter((row) => PENDING_ARTICLE_STATUSES.has(row.status)).length;
  const publishedEvents = scopedEventRows.filter((row) => row.status === "authorized_public" || row.status === "published").length;
  const publishedArticles = scopedArticleRows.filter((row) => row.status === "authorized_public" || row.status === "published").length;
  const stalledEvents = getStaleCount(scopedEventRows, PENDING_EVENT_STATUSES);
  const stalledArticles = getStaleCount(scopedArticleRows, PENDING_ARTICLE_STATUSES);

  const pracharByEventId = new Map<string, PracharRow[]>();
  for (const row of pracharRows) {
    const current = pracharByEventId.get(row.entity_id) ?? [];
    current.push(row);
    pracharByEventId.set(row.entity_id, current);
  }
  const openPracharCampaigns = scopedEventRows
    .filter((row) => row.status === "authorized_public" || row.status === "published")
    .filter((row) => {
      const prachar = pracharByEventId.get(row.id) ?? [];
      const resolvedPlatforms = new Set(
        prachar
          .filter((entry) => hasPracharResolution(entry))
          .map((entry) => entry.platform),
      );
      return ["whatsapp", "facebook", "instagram", "telegram"].some(
        (platform) => !resolvedPlatforms.has(platform as PracharRow["platform"]),
      );
    }).length;

  const workflowGapDetails: Array<{ lane: string; count: number; reason: string }> = [];

  const pendingUnitLaneCount =
    scopedEventRows.filter((row) => row.status === "submitted_by_unit" && (!row.unit_id || !unitHeads.has(row.unit_id))).length +
    scopedArticleRows.filter((row) => row.status === "pending_unit_head_review" && (!row.unit_id || !unitHeads.has(row.unit_id))).length;
  if (pendingUnitLaneCount > 0) {
    workflowGapDetails.push({
      lane: "Unit review",
      count: pendingUnitLaneCount,
      reason: "Pending items have no active unit-head reviewer in scope.",
    });
  }

  const pendingAayamLaneCount =
    scopedEventRows.filter((row) => row.status === "pending_aayam_review" && (!row.department_id || !aayamHeads.has(row.department_id))).length +
    scopedArticleRows.filter((row) => row.status === "pending_aayam_review" && (!row.department_id || !aayamHeads.has(row.department_id))).length;
  if (pendingAayamLaneCount > 0) {
    workflowGapDetails.push({
      lane: "Aayam review",
      count: pendingAayamLaneCount,
      reason: "Pending items have no active aayam reviewer in scope.",
    });
  }

  const hasVibhagApprover = orgRolePresence.has("vibhag_pramukh");
  const pendingVibhagLaneCount =
    scopedEventRows.filter((row) => row.status === "pending_vibhag_review").length +
    scopedArticleRows.filter((row) => row.status === "pending_vibhag_review").length;
  if (pendingVibhagLaneCount > 0 && !hasVibhagApprover) {
    workflowGapDetails.push({
      lane: "Vibhag review",
      count: pendingVibhagLaneCount,
      reason: "Pending items exist but no active Vibhag Pramukh is assigned.",
    });
  }

  const hasPrantApprover = orgRolePresence.has("prant_sanyojak");
  const pendingPrantLaneCount =
    scopedEventRows.filter((row) => row.status === "pending_prant_authorization" || row.status === "pending_prant_dual_authorization").length +
    scopedArticleRows.filter((row) => row.status === "pending_prant_authorization").length;
  if (pendingPrantLaneCount > 0 && !hasPrantApprover) {
    workflowGapDetails.push({
      lane: "Prant authorization",
      count: pendingPrantLaneCount,
      reason: "Pending items exist but no active Prant Sanyojak is assigned.",
    });
  }

  const actorIndex = createActorIndex(accountRows);
  const actorMap = new Map<string, AppOverviewActorRecord>();
  const ensureActor = (userId: string | null) => {
    if (!userId) return null;
    const existing = actorMap.get(userId);
    if (existing) return existing;
    const actor = actorIndex.get(userId);
    const base: AppOverviewActorRecord = {
      userId,
      displayName: actor?.displayName ?? null,
      email: actor?.email ?? null,
      createdCount: 0,
      reviewCount: 0,
      publishedCount: 0,
      lastActionAt: null,
    };
    actorMap.set(userId, base);
    return base;
  };
  const noteActorAction = (userId: string | null, field: "createdCount" | "reviewCount" | "publishedCount", at: string) => {
    const actor = ensureActor(userId);
    if (!actor) return;
    actor[field] += 1;
    if (!actor.lastActionAt || new Date(actor.lastActionAt).getTime() < new Date(at).getTime()) {
      actor.lastActionAt = at;
    }
  };

  for (const event of scopedEventRows) {
    noteActorAction(event.created_by, "createdCount", event.created_at);
  }

  for (const article of scopedArticleRows) {
    noteActorAction(article.author_user_id ?? article.created_by, "createdCount", article.created_at);
  }

  for (const history of eventHistoryRows) {
    if (!scopedEventIds.has(history.event_id)) continue;
    if (history.to_status === "authorized_public" || history.to_status === "published") {
      noteActorAction(history.actor_user_id, "publishedCount", history.created_at);
    } else {
      noteActorAction(history.actor_user_id, "reviewCount", history.created_at);
    }
  }

  for (const review of articleReviewRows) {
    if (!scopedArticleIds.has(review.article_id)) continue;
    noteActorAction(review.reviewer_user_id, "reviewCount", review.created_at);
  }

  for (const publication of articlePublicationRows) {
    if (!scopedArticleIds.has(publication.article_id)) continue;
    noteActorAction(publication.published_by, "publishedCount", publication.published_at);
  }

  const recentActors = Array.from(actorMap.values())
    .filter((actor) => actor.createdCount || actor.reviewCount || actor.publishedCount)
    .sort((a, b) => {
      const aTime = a.lastActionAt ? new Date(a.lastActionAt).getTime() : 0;
      const bTime = b.lastActionAt ? new Date(b.lastActionAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 8);

  const scopedUserIds = new Set(scopedAssignmentRows.map((assignment) => assignment.user_id));

  const recentLogins: AppOverviewLoginRecord[] = (scopedAccess.orgWide
    ? accountRows
    : accountRows.filter((account) => scopedUserIds.has(account.id)))
    .filter((account) => account.last_login_at)
    .sort((a, b) => new Date(b.last_login_at ?? 0).getTime() - new Date(a.last_login_at ?? 0).getTime())
    .slice(0, 8)
    .map((account) => ({
      userId: account.id,
      displayName: account.display_name,
      email: account.email,
      lastLoginAt: account.last_login_at,
      primaryRoleCode: selectPrimaryRole(roleCodesByUser.get(account.id) ?? []),
      isActive: account.is_active,
    }));

  const warningMessages = [
    ...missingOrgRoles.map((role) => `${role} role is not assigned.`),
    ...(missingUnits.length > 0 ? [`${missingUnits.length} units have no active Unit Head.`] : []),
    ...(missingAayams.length > 0 ? [`${missingAayams.length} aayams have no active Aayam Pramukh.`] : []),
    ...(inactiveAssignmentHolders.length > 0 ? [`${inactiveAssignmentHolders.length} inactive users still hold active assignments.`] : []),
    ...workflowGapDetails.map((gap) => `${gap.count} items are blocked in ${gap.lane.toLowerCase()}.`),
  ].slice(0, 6);

  const uniqueEventCreators = new Set(scopedEventRows.map((row) => row.created_by).filter(Boolean)).size;
  const uniqueArticleAuthors = new Set(scopedArticleRows.map((row) => row.author_user_id ?? row.created_by).filter(Boolean)).size;
  const activeContributors = new Set(Array.from(actorMap.values()).map((actor) => actor.userId)).size;
  const loginSummaryMap = new Map(auditSummaryRows.map((row) => [row.action, toNumber(row.total)]));

  const roleLaneCounts = [
    { lane: "Unit review", count: scopedEventRows.filter((row) => row.status === "submitted_by_unit").length + scopedArticleRows.filter((row) => row.status === "pending_unit_head_review").length },
    { lane: "Aayam review", count: scopedEventRows.filter((row) => row.status === "pending_aayam_review").length + scopedArticleRows.filter((row) => row.status === "pending_aayam_review").length },
    { lane: "Vibhag review", count: scopedEventRows.filter((row) => row.status === "pending_vibhag_review").length + scopedArticleRows.filter((row) => row.status === "pending_vibhag_review").length },
    { lane: "Prant review", count: scopedEventRows.filter((row) => row.status === "pending_prant_authorization" || row.status === "pending_prant_dual_authorization").length + scopedArticleRows.filter((row) => row.status === "pending_prant_authorization").length },
    { lane: "Prachar follow-through", count: openPracharCampaigns },
  ];

  return {
    generatedAt: new Date().toISOString(),
    login: {
      totalAccounts: scopedAccess.orgWide ? accountRows.length : scopedUserIds.size,
      activeAccounts: (scopedAccess.orgWide ? accountRows : accountRows.filter((account) => scopedUserIds.has(account.id))).filter((account) => account.is_active).length,
      loggedInToday: (scopedAccess.orgWide ? accountRows : accountRows.filter((account) => scopedUserIds.has(account.id))).filter((account) => isToday(account.last_login_at)).length,
      loggedInLast7Days: (scopedAccess.orgWide ? accountRows : accountRows.filter((account) => scopedUserIds.has(account.id))).filter((account) => isRecent(account.last_login_at, 7)).length,
      successLast30Days: loginSummaryMap.get("auth.login_success") ?? 0,
      failedLast30Days: loginSummaryMap.get("auth.login_failed") ?? 0,
    },
    workflow: {
      pendingEvents,
      pendingArticles,
      openPracharCampaigns,
      publishedEvents,
      publishedArticles,
      stalledEvents,
      stalledArticles,
      roleLaneCounts,
      ownership: {
        eventCreators: uniqueEventCreators,
        articleAuthors: uniqueArticleAuthors,
        activeContributors,
      },
    },
    hierarchy: {
      totalWarnings:
        missingOrgRoles.length +
        missingUnits.length +
        missingAayams.length +
        inactiveAssignmentHolders.length +
        workflowGapDetails.reduce((sum, gap) => sum + gap.count, 0),
      missingOrgRoles,
      missingUnitHeads: missingUnits.length,
      missingAayamHeads: missingAayams.length,
      inactiveAssignees: inactiveAssignmentHolders.length,
      workflowGaps: workflowGapDetails.reduce((sum, gap) => sum + gap.count, 0),
      warningMessages,
    },
    admin: canManageUsers
      ? {
          recentLogins,
          recentActors,
          missingUnits: missingUnits.slice(0, 8),
          missingAayams: missingAayams.slice(0, 8),
          inactiveAssignmentHolders: inactiveAssignmentHolders.slice(0, 8),
          workflowGapDetails,
        }
      : null,
  };
}
