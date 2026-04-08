import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import type { NeonAuthContext } from "./auth";
import type { AppActionRequest, AppViewerContext, CanonicalRoleCode, UiRole } from "@/lib/app/contracts";
import { getDatabaseUrl } from "./env";

let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!_sql) {
    const url = getDatabaseUrl();
    if (!url) return null;
    _sql = neon(url);
  }
  return _sql;
}

function requireSql(): NeonQueryFunction<false, false> {
  const conn = getSql();
  if (!conn) throw new Error("Database URL is not set. Define DATABASE_URL (preferred) or NEON_DATABASE_URL.");
  return conn as NeonQueryFunction<false, false>;
}

// Lazy sql - only throws when actually called, not at module load time
export const sql = ((...args: Parameters<NeonQueryFunction<false, false>>) => {
  return requireSql()(...args);
}) as NeonQueryFunction<false, false>;

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

function formatDisplayDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso ?? "";
  return dateFormatter.format(d);
}

const dbToUiEventStatus: Record<string, string> = {
  draft: "Draft",
  submitted_by_unit: "Submitted by Unit",
  pending_aayam_review: "Pending Aayam Review",
  pending_vibhag_review: "Pending Vibhag Review",
  pending_prant_authorization: "Pending Prant Authorization",
  pending_prant_dual_authorization: "Pending Prant Dual Authorization",
  authorized_public: "Published",
  published: "Published",
  escalated_kshetra: "Escalated to Kshetra",
  returned_for_revision: "Returned for Revision",
  rejected: "Rejected",
  cancelled: "Cancelled",
  pending_final_approval: "Pending Vibhag Review",
};

const dbToUiArticleStatus: Record<string, string> = {
  draft: "Draft",
  pending_unit_head_review: "Pending Unit Head Review",
  pending_aayam_review: "Pending Aayam Review",
  pending_vibhag_review: "Pending Vibhag Review",
  pending_prant_authorization: "Pending Prant Authorization",
  authorized_public: "Published",
  published: "Published",
  escalated_kshetra: "Escalated to Kshetra",
  returned_for_revision: "Returned for Revision",
  rejected: "Rejected",
  archived: "Archived",
};

const uiToDbEventStatus: Record<string, string> = {
  Draft: "draft",
  "Submitted by Unit": "submitted_by_unit",
  "Pending Aayam Review": "pending_aayam_review",
  "Pending Vibhag Review": "pending_vibhag_review",
  "Pending Prant Authorization": "pending_prant_authorization",
  "Pending Prant Dual Authorization": "pending_prant_dual_authorization",
  Published: "authorized_public",
  "Escalated to Kshetra": "escalated_kshetra",
  "Returned for Revision": "returned_for_revision",
  Rejected: "rejected",
  Cancelled: "cancelled",
};

const uiToDbArticleStatus: Record<string, string> = {
  Draft: "draft",
  "Pending Unit Head Review": "pending_unit_head_review",
  "Pending Aayam Review": "pending_aayam_review",
  "Pending Vibhag Review": "pending_vibhag_review",
  "Pending Prant Authorization": "pending_prant_authorization",
  Published: "authorized_public",
  "Escalated to Kshetra": "escalated_kshetra",
  "Returned for Revision": "returned_for_revision",
  Rejected: "rejected",
  Archived: "archived",
};

const rolePriority: CanonicalRoleCode[] = [
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

const roleUiMap: Record<CanonicalRoleCode, UiRole> = {
  super_admin: "vibhag_pramukh",
  org_admin: "vibhag_pramukh",
  karyakarta: "karyakarta",
  unit_head: "unit_head",
  aayam_pramukh: "aayam_pramukh",
  vibhag_pramukh: "vibhag_pramukh",
  prant_sanyojak: "vibhag_pramukh",
  prant_aayam_pramukh: "aayam_pramukh",
  kshetra_reviewer: "vibhag_pramukh",
};

const canonicalRoleSet = new Set<CanonicalRoleCode>([
  "super_admin",
  "org_admin",
  "karyakarta",
  "unit_head",
  "aayam_pramukh",
  "vibhag_pramukh",
  "prant_sanyojak",
  "prant_aayam_pramukh",
  "kshetra_reviewer",
]);

function toBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toCanonicalRole(role: string): CanonicalRoleCode | null {
  return canonicalRoleSet.has(role as CanonicalRoleCode) ? (role as CanonicalRoleCode) : null;
}

function buildViewer(ctx: NeonAuthContext): AppViewerContext {
  const canonicalRoles = Array.from(
    new Set(
      ctx.effectiveRoles
        .map((role) => toCanonicalRole(role))
        .filter((role): role is CanonicalRoleCode => Boolean(role)),
    ),
  );

  const primaryRoleCode =
    rolePriority.find((role) => canonicalRoles.includes(role)) ?? canonicalRoles[0] ?? "karyakarta";
  const uiRole = roleUiMap[primaryRoleCode] ?? "karyakarta";

  const managerRoles: CanonicalRoleCode[] = [
    "super_admin",
    "org_admin",
    "kshetra_reviewer",
    "prant_sanyojak",
    "prant_aayam_pramukh",
    "vibhag_pramukh",
    "aayam_pramukh",
    "unit_head",
  ];
  const publishRoles: CanonicalRoleCode[] = [
    "super_admin",
    "org_admin",
    "kshetra_reviewer",
    "prant_sanyojak",
    "prant_aayam_pramukh",
    "vibhag_pramukh",
    "aayam_pramukh",
  ];
  const hasAny = (roles: CanonicalRoleCode[]) => roles.some((r) => canonicalRoles.includes(r));
  const assignmentSummaries: AppViewerContext["assignments"] = [];
  for (const a of ctx.assignments) {
    const roleCode = toCanonicalRole(a.role_code);
    if (!roleCode) continue;
    assignmentSummaries.push({
      id: a.id,
      roleCode,
      roleName: a.role_name,
      roleNameHi: a.role_name_hi,
      scopeType: a.scope_type,
      orgId: a.org_id,
      unitId: a.unit_id,
      departmentId: a.department_id,
      scopeEntityId: a.scope_entity_id,
      isPrimary: a.is_primary,
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
    assignments: assignmentSummaries,
    permissions: {
      canReadInternalBootstrap: true,
      canCreateEvent: hasAny(managerRoles),
      canCreateArticle: hasAny(managerRoles),
      canFinalizePoll: hasAny(publishRoles),
      canPublishEvent: hasAny(publishRoles),
      canPublishArticle: hasAny(publishRoles),
      canUpdatePrachar: hasAny(publishRoles),
      canManageUsers: hasAny(["super_admin", "org_admin"]),
    },
  };
}

function resolveActorOrgId(ctx: NeonAuthContext) {
  if (ctx.profile?.org_id) return ctx.profile.org_id;
  const fromAssignment = ctx.assignments.find((a) => a.org_id)?.org_id ?? null;
  if (!fromAssignment) {
    throw new Error("User has no organization scope.");
  }
  return fromAssignment;
}

function resolveEventStartIso(input: { date?: string; dateIso?: string }) {
  const candidate = input.dateIso || input.date;
  if (!candidate) return new Date().toISOString();
  const parsed = new Date(candidate);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString();
  return parsed.toISOString();
}

export async function getBootstrapPayload(ctx: NeonAuthContext) {
  // Load all data in parallel
  const [events, units, articles, formConfigs, formQuestions, polls, pollOptions, pollVotes, pracharStatuses, registrations, regAnswers, articleReviews, vimarshTopics, vimarshResources] =
    await Promise.all([
      sql`SELECT * FROM public.events ORDER BY starts_at ASC`,
      sql`SELECT id, name FROM public.units`,
      sql`SELECT * FROM public.articles ORDER BY created_at DESC`,
      sql`SELECT * FROM public.event_form_configs`,
      sql`SELECT * FROM public.event_form_questions`,
      sql`SELECT * FROM public.event_polls`,
      sql`SELECT * FROM public.event_poll_options`,
      sql`SELECT * FROM public.event_poll_votes`,
      sql`SELECT * FROM public.prachar_statuses`,
      sql`SELECT * FROM public.event_registrations`,
      sql`SELECT * FROM public.event_registration_answers`,
      sql`SELECT article_id, review_notes, created_at FROM public.article_reviews ORDER BY created_at DESC`,
      sql`SELECT * FROM public.vimarsh_topics ORDER BY sort_order ASC`,
      sql`SELECT * FROM public.vimarsh_resources`,
    ]);

  const unitsById = new Map(units.map((u: any) => [u.id, u.name]));
  const formConfigByEventId = new Map(formConfigs.map((fc: any) => [fc.event_id, fc]));

  const questionsByConfigId = new Map<string, any[]>();
  for (const q of formQuestions) {
    const list = questionsByConfigId.get(q.form_config_id) ?? [];
    list.push(q);
    questionsByConfigId.set(q.form_config_id, list);
  }

  const questionById = new Map(formQuestions.map((q: any) => [q.id, q]));
  const regAnswersByReg = new Map<string, any[]>();
  for (const a of regAnswers) {
    const list = regAnswersByReg.get(a.registration_id) ?? [];
    list.push(a);
    regAnswersByReg.set(a.registration_id, list);
  }

  const regsByEvent = new Map<string, any[]>();
  for (const r of registrations) {
    const list = regsByEvent.get(r.event_id) ?? [];
    list.push(r);
    regsByEvent.set(r.event_id, list);
  }

  const pollsByEvent = new Map<string, any[]>();
  for (const p of polls) {
    const list = pollsByEvent.get(p.event_id) ?? [];
    list.push(p);
    pollsByEvent.set(p.event_id, list);
  }

  const pracharByEvent = new Map(pracharStatuses.map((p: any) => [p.event_id, p]));

  const optionsByPoll = new Map<string, any[]>();
  for (const o of pollOptions) {
    const list = optionsByPoll.get(o.poll_id) ?? [];
    list.push(o);
    optionsByPoll.set(o.poll_id, list);
  }

  const votesByPoll = new Map<string, any[]>();
  const votesByOption = new Map<string, number>();
  for (const v of pollVotes) {
    const list = votesByPoll.get(v.poll_id) ?? [];
    list.push(v);
    votesByPoll.set(v.poll_id, list);
    votesByOption.set(v.option_id, (votesByOption.get(v.option_id) ?? 0) + 1);
  }

  const latestReviewByArticle = new Map<string, string | null>();
  for (const review of articleReviews) {
    if (latestReviewByArticle.has(review.article_id)) continue;
    if (review.review_notes?.trim()) {
      latestReviewByArticle.set(review.article_id, review.review_notes);
    }
  }

  // Build events
  const formattedEvents = events.map((e: any) => {
    const fc = formConfigByEventId.get(e.id);
    const questions = fc ? questionsByConfigId.get(fc.id) ?? [] : [];
    const regs = (regsByEvent.get(e.id) ?? []).map((r: any) => {
      const customAnswers: Record<string, string> = {};
      const answerRows = regAnswersByReg.get(r.id) ?? [];
      for (const answer of answerRows) {
        const q = questionById.get(answer.question_id);
        if (q) customAnswers[q.id] = answer.answer_text ?? "";
      }
      const payloadObj = asObject(r.answers_payload);
      for (const [key, value] of Object.entries(payloadObj)) {
        if (!(key in customAnswers)) {
          customAnswers[key] = typeof value === "string" ? value : JSON.stringify(value);
        }
      }
      return {
        id: r.id,
        name: r.name,
        phone: r.phone ?? "",
        city: r.city ?? "",
        attendingCount: r.attending_count,
        hasSpecialNeeds: r.has_special_needs,
        notes: r.notes ?? undefined,
        submittedAt: (r.created_at ?? "").slice(0, 10),
        customAnswers: Object.keys(customAnswers).length ? customAnswers : undefined,
      };
    });

    const eventPolls = pollsByEvent.get(e.id) ?? [];
    const eventOptions = eventPolls.flatMap((p: any) => optionsByPoll.get(p.id) ?? []);
    const eventVotes = eventPolls.flatMap((p: any) => votesByPoll.get(p.id) ?? []);

    const builtPolls = eventPolls.map((poll: any) => {
      const opts = eventOptions
        .filter((o: any) => o.poll_id === poll.id)
        .sort((a: any, b: any) => a.sort_order - b.sort_order)
        .map((o: any) => ({
          id: o.id,
          label: o.label,
          votes: votesByOption.get(o.id) ?? 0,
          scheduledAtIso: o.scheduled_at,
        }));
      return {
        id: poll.id,
        question: poll.question,
        questionHi: poll.question_hi ?? poll.question,
        type: poll.poll_type,
        options: opts,
        isFinalized: poll.is_finalized,
        winnerOptionId: poll.winner_option_id ?? undefined,
      };
    });

    const checklistObj = asObject(e.checklist);
    return {
      id: e.id,
      title: e.title,
      description: e.description ?? "",
      date: formatDisplayDate(e.starts_at),
      dateIso: e.starts_at,
      unit: e.unit_id ? (unitsById.get(e.unit_id) ?? "Unknown Unit") : "Unknown Unit",
      submittedBy: e.submitted_by_name_snapshot ?? "Current User",
      status: dbToUiEventStatus[e.status] ?? e.status,
      checklist: {
        designing: toBool(checklistObj.designing),
        food: toBool(checklistObj.food),
        seating: toBool(checklistObj.seating),
        transport: toBool(checklistObj.transport),
        accommodation: toBool(checklistObj.accommodation),
        soundMic: toBool(checklistObj.soundMic),
        camera: toBool(checklistObj.camera),
        screen: toBool(checklistObj.screen),
        lights: toBool(checklistObj.lights),
      },
      report: e.report ?? undefined,
      imageUrl: e.image_url ?? undefined,
      videoUrl: e.video_url ?? undefined,
      registrations: regs.length ? regs : undefined,
      formConfig: fc
        ? {
            fields: {
              phone: fc.collect_phone,
              city: fc.collect_city,
              attendingCount: fc.collect_attending_count,
              specialNeeds: fc.collect_special_needs,
            },
            customQuestions: questions
              .sort((a: any, b: any) => a.display_order - b.display_order)
              .map((q: any) => ({
                id: q.question_key,
                question: q.label,
                questionHi: q.label_hi ?? q.label,
                type: q.question_type === "yesno" ? "yesno" : "text",
              })),
          }
        : undefined,
      polls: builtPolls.length ? builtPolls : undefined,
      vrittAttendanceCount: e.vritt_attendance_count ?? 0,
      vrittCheckedInCount: e.vritt_checked_in_count ?? 0,
      vrittMediaUrls: e.vritt_media_urls ?? [],
      vrittContent: e.vritt_content ?? "",
      vrittStatus: (["draft", "submitted", "reviewed"].includes(e.vritt_status ?? "")
        ? e.vritt_status
        : "draft") as "draft" | "submitted" | "reviewed",
    };
  });

  // Prachar statuses for published events
  const pracharStatusList = formattedEvents
    .filter((e: any) => e.status === "Published")
    .map((e: any) => {
      const p = pracharByEvent.get(e.id);
      return {
        eventId: e.id,
        platforms: {
          whatsapp: p?.whatsapp_done ?? false,
          facebook: p?.facebook_done ?? false,
          instagram: p?.instagram_done ?? false,
          telegram: p?.telegram_done ?? false,
        },
        skipReasons: {
          whatsapp: p?.whatsapp_skip_reason ?? null,
          facebook: p?.facebook_skip_reason ?? null,
          instagram: p?.instagram_skip_reason ?? null,
          telegram: p?.telegram_skip_reason ?? null,
        },
        templateReference: p?.template_reference ?? null,
      };
    });

  // Articles
  const formattedArticles = articles.map((a: any) => {
    const values = asObject(a.values_checklist);
    return {
      id: a.id,
      title: a.title,
      content: a.content,
      summary: a.summary ?? "",
      author: a.author_name_snapshot ?? "Current User",
      date: (a.created_at ?? "").slice(0, 10),
      category: a.category,
      status: dbToUiArticleStatus[a.status] ?? a.status,
      socialUrl: a.social_url ?? undefined,
      documentUrl: a.document_url ?? null,
      latestReviewNotes: latestReviewByArticle.get(a.id) ?? null,
      valuesChecklist: {
        rashtraPratham: toBool(values.rashtraPratham),
        culturallyGrounded: toBool(values.culturallyGrounded),
        balancedTone: toBool(values.balancedTone),
        noDivisiveContent: toBool(values.noDivisiveContent),
      },
    };
  });

  // Vimarsh
  const resourcesByTopic = new Map<string, any[]>();
  for (const r of vimarshResources) {
    const list = resourcesByTopic.get(r.topic_id) ?? [];
    list.push({ id: r.id, topicId: r.topic_id, title: r.title, url: r.url, resourceType: r.resource_type });
    resourcesByTopic.set(r.topic_id, list);
  }
  const formattedVimarsh = vimarshTopics.map((t: any) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? null,
    sortOrder: t.sort_order ?? 0,
    resources: resourcesByTopic.get(t.id) ?? [],
  }));

  return {
    events: formattedEvents,
    articles: formattedArticles,
    pracharStatuses: pracharStatusList,
    vimarshTopics: formattedVimarsh,
    notifications: [],
    viewer: buildViewer(ctx),
  };
}

export async function runNeonAppAction(ctx: NeonAuthContext, input: AppActionRequest) {
  const orgId = resolveActorOrgId(ctx);
  const actorId = ctx.user.id;

  switch (input.action) {
    case "createEvent": {
      const startsAt = resolveEventStartIso(input.payload);
      const unitName = input.payload.unit?.trim() || "Unit";
      const unitRows = await sql`
        select id from public.units
        where org_id = ${orgId} and lower(name) = lower(${unitName})
        limit 1
      `;
      const unitId = (unitRows as Array<{ id: string }>)[0]?.id ?? null;

      const result = await sql`
        insert into public.events (
          org_id, unit_id, title, description, status, starts_at, submitted_by_user_id, submitted_by_name_snapshot,
          checklist, created_by, updated_by
        )
        values (
          ${orgId}, ${unitId}, ${input.payload.title}, ${input.payload.description ?? ""}, 'draft', ${startsAt},
          ${actorId}, ${ctx.profile?.display_name ?? input.payload.submittedBy ?? "Current User"},
          ${JSON.stringify(input.payload.checklist ?? {})}::jsonb, ${actorId}, ${actorId}
        )
        returning id
      `;
      return { ok: true, id: (result as Array<{ id: string }>)[0]?.id };
    }

    case "updateEventStatus": {
      const dbStatus = uiToDbEventStatus[input.payload.status];
      if (!dbStatus) throw new Error("Unknown event status.");
      await sql`
        update public.events
        set status = ${dbStatus}, updated_by = ${actorId}, updated_at = now(),
            published_at = case when ${dbStatus} in ('authorized_public','published') then now() else published_at end
        where id = ${input.payload.id}
      `;
      return { ok: true };
    }

    case "updateFormConfig": {
      const eventId = input.payload.eventId;
      const config = input.payload.config;
      const configRes = await sql`
        insert into public.event_form_configs (
          event_id, collect_phone, collect_city, collect_attending_count, collect_special_needs, updated_by, created_by
        )
        values (
          ${eventId}, ${config.fields.phone}, ${config.fields.city},
          ${config.fields.attendingCount}, ${config.fields.specialNeeds}, ${actorId}, ${actorId}
        )
        on conflict (event_id)
        do update set
          collect_phone = excluded.collect_phone,
          collect_city = excluded.collect_city,
          collect_attending_count = excluded.collect_attending_count,
          collect_special_needs = excluded.collect_special_needs,
          updated_by = excluded.updated_by
        returning id
      `;
      const formConfigId = (configRes as Array<{ id: string }>)[0]?.id;
      if (!formConfigId) return { ok: false };

      await sql`delete from public.event_form_questions where form_config_id = ${formConfigId}`;
      if (config.customQuestions.length > 0) {
        for (let i = 0; i < config.customQuestions.length; i += 1) {
          const q = config.customQuestions[i];
          await sql`
            insert into public.event_form_questions (
              event_id, form_config_id, question_key, label, label_hi, question_type, is_required, display_order, created_by, updated_by
            )
            values (
              ${eventId}, ${formConfigId}, ${q.id}, ${q.question}, ${q.questionHi},
              ${q.type === "yesno" ? "yesno" : "text"}, false, ${i}, ${actorId}, ${actorId}
            )
          `;
        }
      }
      return { ok: true };
    }

    case "addPoll": {
      const poll = input.payload.poll;
      const pollRes = await sql`
        insert into public.event_polls (
          event_id, question, question_hi, poll_type, is_public_voting, created_by, updated_by
        )
        values (
          ${input.payload.eventId}, ${poll.question}, ${poll.questionHi}, ${poll.type}, true, ${actorId}, ${actorId}
        )
        returning id
      `;
      const pollId = (pollRes as Array<{ id: string }>)[0]?.id;
      if (!pollId) return { ok: false };

      for (let i = 0; i < poll.options.length; i += 1) {
        const opt = poll.options[i];
        await sql`
          insert into public.event_poll_options (poll_id, label, sort_order, scheduled_at, created_by, updated_by)
          values (
            ${pollId},
            ${opt.label},
            ${i},
            ${poll.type === "date" ? (opt.scheduledAtIso ?? null) : null},
            ${actorId},
            ${actorId}
          )
        `;
      }

      return { ok: true, pollId };
    }

    case "castVote": {
      await sql`
        insert into public.event_poll_votes (poll_id, option_id, actor_user_id)
        values (${input.payload.pollId}, ${input.payload.optionId}, ${actorId})
      `;
      return { ok: true };
    }

    case "finalizePoll": {
      await sql`
        update public.event_polls
        set is_finalized = true, winner_option_id = ${input.payload.winnerOptionId}, finalized_by = ${actorId}, updated_by = ${actorId}, updated_at = now()
        where id = ${input.payload.pollId} and event_id = ${input.payload.eventId}
      `;
      return { ok: true };
    }

    case "addArticle": {
      await sql`
        insert into public.articles (
          org_id, title, content, summary, category, status, author_user_id, author_name_snapshot, social_url, values_checklist, created_by, updated_by
        )
        values (
          ${orgId}, ${input.payload.title}, ${input.payload.content}, ${input.payload.summary},
          ${input.payload.category}, 'pending_unit_head_review', ${actorId},
          ${ctx.profile?.display_name ?? input.payload.author}, ${input.payload.socialUrl ?? null},
          ${JSON.stringify(input.payload.valuesChecklist)}::jsonb, ${actorId}, ${actorId}
        )
      `;
      return { ok: true };
    }

    case "updateArticleStatus": {
      const dbStatus = uiToDbArticleStatus[input.payload.status];
      if (!dbStatus) throw new Error("Unknown article status.");
      await sql`
        update public.articles
        set
          status = ${dbStatus},
          title = coalesce(${input.payload.edits?.title ?? null}, title),
          content = coalesce(${input.payload.edits?.content ?? null}, content),
          summary = coalesce(${input.payload.edits?.summary ?? null}, summary),
          document_url = coalesce(${input.payload.documentUrl ?? null}, document_url),
          updated_by = ${actorId},
          updated_at = now(),
          published_at = case when ${dbStatus} in ('authorized_public','published') then now() else published_at end
        where id = ${input.payload.id}
      `;
      await sql`
        insert into public.article_reviews (article_id, reviewer_user_id, review_step, decision, review_notes, edits)
        values (
          ${input.payload.id},
          ${actorId},
          'app_action',
          ${input.payload.status === "Published" ? "approved" : "forwarded"},
          ${input.payload.reviewNotes ?? null},
          ${JSON.stringify(input.payload.edits ?? {})}::jsonb
        )
      `;
      return { ok: true };
    }

    case "updatePracharPlatform": {
      const done = input.payload.done;
      const skipReason = done ? null : input.payload.skipReason ?? null;
      if (input.payload.platform === "whatsapp") {
        await sql`
          insert into public.prachar_statuses (event_id, whatsapp_done, whatsapp_skip_reason, last_updated_by, last_updated_at)
          values (${input.payload.eventId}, ${done}, ${skipReason}, ${actorId}, now())
          on conflict (event_id)
          do update set
            whatsapp_done = excluded.whatsapp_done,
            whatsapp_skip_reason = excluded.whatsapp_skip_reason,
            last_updated_by = excluded.last_updated_by,
            last_updated_at = excluded.last_updated_at,
            updated_at = now()
        `;
      } else if (input.payload.platform === "facebook") {
        await sql`
          insert into public.prachar_statuses (event_id, facebook_done, facebook_skip_reason, last_updated_by, last_updated_at)
          values (${input.payload.eventId}, ${done}, ${skipReason}, ${actorId}, now())
          on conflict (event_id)
          do update set
            facebook_done = excluded.facebook_done,
            facebook_skip_reason = excluded.facebook_skip_reason,
            last_updated_by = excluded.last_updated_by,
            last_updated_at = excluded.last_updated_at,
            updated_at = now()
        `;
      } else if (input.payload.platform === "instagram") {
        await sql`
          insert into public.prachar_statuses (event_id, instagram_done, instagram_skip_reason, last_updated_by, last_updated_at)
          values (${input.payload.eventId}, ${done}, ${skipReason}, ${actorId}, now())
          on conflict (event_id)
          do update set
            instagram_done = excluded.instagram_done,
            instagram_skip_reason = excluded.instagram_skip_reason,
            last_updated_by = excluded.last_updated_by,
            last_updated_at = excluded.last_updated_at,
            updated_at = now()
        `;
      } else {
        await sql`
          insert into public.prachar_statuses (event_id, telegram_done, telegram_skip_reason, last_updated_by, last_updated_at)
          values (${input.payload.eventId}, ${done}, ${skipReason}, ${actorId}, now())
          on conflict (event_id)
          do update set
            telegram_done = excluded.telegram_done,
            telegram_skip_reason = excluded.telegram_skip_reason,
            last_updated_by = excluded.last_updated_by,
            last_updated_at = excluded.last_updated_at,
            updated_at = now()
        `;
      }
      return { ok: true };
    }

    case "updateVritt": {
      await sql`
        update public.events
        set
          vritt_content = coalesce(${input.payload.vrittContent ?? null}, vritt_content),
          vritt_attendance_count = coalesce(${input.payload.vrittAttendanceCount ?? null}, vritt_attendance_count),
          vritt_status = coalesce(${input.payload.vrittStatus ?? null}, vritt_status),
          vritt_media_urls = coalesce(${input.payload.vrittMediaUrls ?? null}::text[], vritt_media_urls),
          vritt_updated_at = now(),
          updated_by = ${actorId},
          updated_at = now()
        where id = ${input.payload.eventId}
      `;
      return { ok: true };
    }

    case "markAttendance": {
      await sql`
        update public.events
        set vritt_checked_in_count = coalesce(vritt_checked_in_count, 0) + 1,
            updated_by = ${actorId},
            updated_at = now()
        where id = ${input.payload.eventId}
      `;
      return { ok: true };
    }

    default:
      throw new Error("Unknown action.");
  }
}
