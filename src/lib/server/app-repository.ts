import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  AalekhArticle,
  AppActionRequest,
  AppBootstrapPayload,
  ArticleStatus,
  EventStatus,
  FormConfig,
  GatividhiEvent,
  PracharPlatform,
  PracharStatus,
  PublicRegistrationRequest,
  PublicVoteRequest,
  VimarshResource,
  VimarshTopic,
  VotePoll,
  VrittStatus,
} from "@/lib/app/contracts";
import type { RequestAuthContext } from "@/lib/server/auth-context";
import {
  assertCanCreateArticle,
  assertCanCreateEvent,
  assertCanFinalizePoll,
  assertCanTransitionArticleStatus,
  assertCanTransitionEventStatus,
  assertCanUpdatePracharStatus,
  buildViewerContext,
  canManageEventDraft,
  canViewArticle,
  canViewEvent,
} from "@/lib/server/permissions";
import { ForbiddenError } from "@/lib/server/errors";

type Db = Database["public"]["Tables"];
type EventRow = Db["events"]["Row"];
type ArticleRow = Db["articles"]["Row"];
type DbClient = SupabaseClient<Database>;

const dbToUiEventStatus: Record<string, EventStatus> = {
  draft: "Draft",
  submitted_by_unit: "Submitted by Unit",
  pending_aayam_review: "Pending Aayam Review",
  pending_vibhag_review: "Pending Vibhag Review",
  pending_prant_authorization: "Pending Prant Authorization",
  pending_prant_dual_authorization: "Pending Prant Dual Authorization",
  authorized_public: "Published",
  published: "Published", // Backward compatibility
  escalated_kshetra: "Escalated to Kshetra",
  returned_for_revision: "Returned for Revision",
  rejected: "Rejected",
  cancelled: "Cancelled",
  pending_final_approval: "Pending Vibhag Review", // Legacy mapping
};

const uiToDbEventStatus: Record<EventStatus, string> = {
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

const dbToUiArticleStatus: Record<string, ArticleStatus> = {
  draft: "Draft",
  pending_unit_head_review: "Pending Unit Head Review",
  pending_aayam_review: "Pending Aayam Review",
  pending_vibhag_review: "Pending Vibhag Review",
  pending_prant_authorization: "Pending Prant Authorization",
  authorized_public: "Published",
  published: "Published", // Backward compatibility
  escalated_kshetra: "Escalated to Kshetra",
  returned_for_revision: "Returned for Revision",
  rejected: "Rejected",
  archived: "Archived",
};

const uiToDbArticleStatus: Record<ArticleStatus, string> = {
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

function asObject(value: Json | null): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function formatDisplayDate(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function toDateOnlyIso(dateInput?: string) {
  if (!dateInput) return null;
  const parsed = new Date(dateInput);
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  return null;
}

function slugifyUnitCode(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "unit";
}

function resolveActorOrgId(ctx: RequestAuthContext) {
  if (ctx.profile?.org_id) return ctx.profile.org_id;
  const assignmentOrgId = ctx.assignments.find((a) => a.org_id)?.org_id ?? null;
  if (assignmentOrgId) return assignmentOrgId;
  throw new Error("Authenticated user does not have an organization scope.");
}

async function ensureUnitIdByName(supabase: DbClient, orgId: string, unitName: string) {
  const code = slugifyUnitCode(unitName);

  const { data, error } = await supabase
    .from("units")
    .upsert(
      [{ org_id: orgId, code, name: unitName, unit_kind: "unit", is_active: true }],
      { onConflict: "org_id,code" },
    )
    .select("id,name")
    .single();

  if (error) throw error;
  return data.id;
}

function buildChecklist(raw: Json | null): GatividhiEvent["checklist"] {
  const obj = asObject(raw);
  return {
    designing: toBool(obj.designing),
    food: toBool(obj.food),
    seating: toBool(obj.seating),
    transport: toBool(obj.transport),
    accommodation: toBool(obj.accommodation),
    soundMic: toBool(obj.soundMic),
    camera: toBool(obj.camera),
    screen: toBool(obj.screen),
    lights: toBool(obj.lights),
  };
}

function buildFormConfig(
  configRow: Db["event_form_configs"]["Row"] | undefined,
  questionRows: Db["event_form_questions"]["Row"][],
): FormConfig | undefined {
  if (!configRow) return undefined;
  return {
    fields: {
      phone: configRow.collect_phone,
      city: configRow.collect_city,
      attendingCount: configRow.collect_attending_count,
      specialNeeds: configRow.collect_special_needs,
    },
    customQuestions: questionRows
      .sort((a, b) => a.display_order - b.display_order)
      .map((q) => ({
        id: q.question_key,
        question: q.label,
        questionHi: q.label_hi ?? q.label,
        type: q.question_type === "yesno" ? "yesno" : "text",
      })),
  };
}

function buildPolls(
  pollRows: Db["event_polls"]["Row"][],
  optionRows: Db["event_poll_options"]["Row"][],
  voteRows: Db["event_poll_votes"]["Row"][],
): VotePoll[] {
  const votesByOption = new Map<string, number>();
  for (const vote of voteRows) {
    votesByOption.set(vote.option_id, (votesByOption.get(vote.option_id) ?? 0) + 1);
  }

  return pollRows.map((poll) => {
    const options = optionRows
      .filter((o) => o.poll_id === poll.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((o) => ({
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
      options,
      isFinalized: poll.is_finalized,
      winnerOptionId: poll.winner_option_id ?? undefined,
    };
  });
}

function hashVoterFingerprint(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function getAppBootstrapPayload(ctx: RequestAuthContext): Promise<AppBootstrapPayload> {
  const supabase = ctx.supabase;

  const [eventsRes, unitsRes, articlesRes] = await Promise.all([
    supabase.from("events").select("*").order("starts_at", { ascending: true }),
    supabase.from("units").select("id,name"),
    supabase.from("articles").select("*").order("created_at", { ascending: false }),
  ]);

  for (const res of [eventsRes, unitsRes, articlesRes]) {
    if (res.error) throw res.error;
  }

  const visibleEventRows = (eventsRes.data ?? []).filter((e) => canViewEvent(ctx, e));
  const visibleEventIds = visibleEventRows.map((e) => e.id);
  const manageableEventIdSet = new Set(visibleEventRows.filter((e) => canManageEventDraft(ctx, e)).map((e) => e.id));
  const manageableEventIds = Array.from(manageableEventIdSet);
  const visibleArticleRows = (articlesRes.data ?? []).filter((a) => canViewArticle(ctx, a));

  let formConfigs: Db["event_form_configs"]["Row"][] = [];
  let formQuestions: Db["event_form_questions"]["Row"][] = [];
  let polls: Db["event_polls"]["Row"][] = [];
  let pracharRows: Db["prachar_statuses"]["Row"][] = [];
  let pollOptions: Db["event_poll_options"]["Row"][] = [];
  let pollVotes: Db["event_poll_votes"]["Row"][] = [];
  let registrations: Db["event_registrations"]["Row"][] = [];
  let registrationAnswers: Db["event_registration_answers"]["Row"][] = [];

  if (visibleEventIds.length > 0) {
    const [formConfigsRes, pollsRes, pracharRes] = await Promise.all([
      supabase.from("event_form_configs").select("*").in("event_id", visibleEventIds),
      supabase.from("event_polls").select("*").in("event_id", visibleEventIds),
      supabase.from("prachar_statuses").select("*").in("event_id", visibleEventIds),
    ]);
    if (formConfigsRes.error) throw formConfigsRes.error;
    if (pollsRes.error) throw pollsRes.error;
    if (pracharRes.error) throw pracharRes.error;
    formConfigs = formConfigsRes.data ?? [];
    polls = pollsRes.data ?? [];
    pracharRows = pracharRes.data ?? [];

    const formConfigIds = formConfigs.map((fc) => fc.id);
    if (formConfigIds.length > 0) {
      const formQuestionsRes = await supabase.from("event_form_questions").select("*").in("form_config_id", formConfigIds);
      if (formQuestionsRes.error) throw formQuestionsRes.error;
      formQuestions = formQuestionsRes.data ?? [];
    }

    const visiblePollIds = polls.map((p) => p.id);
    if (visiblePollIds.length > 0) {
      const pollOptionsRes = await supabase.from("event_poll_options").select("*").in("poll_id", visiblePollIds);
      if (pollOptionsRes.error) throw pollOptionsRes.error;
      pollOptions = pollOptionsRes.data ?? [];

      const manageablePollIds = polls.filter((p) => manageableEventIdSet.has(p.event_id)).map((p) => p.id);
      if (manageablePollIds.length > 0) {
        const pollVotesRes = await supabase.from("event_poll_votes").select("*").in("poll_id", manageablePollIds);
        if (pollVotesRes.error) throw pollVotesRes.error;
        pollVotes = pollVotesRes.data ?? [];
      }
    }
  }

  if (manageableEventIds.length > 0) {
    const registrationsRes = await supabase.from("event_registrations").select("*").in("event_id", manageableEventIds);
    if (registrationsRes.error) throw registrationsRes.error;
    registrations = registrationsRes.data ?? [];

    const registrationIds = registrations.map((r) => r.id);
    if (registrationIds.length > 0) {
      const regAnswersRes = await supabase
        .from("event_registration_answers")
        .select("*")
        .in("registration_id", registrationIds);
      if (regAnswersRes.error) throw regAnswersRes.error;
      registrationAnswers = regAnswersRes.data ?? [];
    }
  }

  const unitsById = new Map((unitsRes.data ?? []).map((u) => [u.id, u.name]));
  const formConfigByEventId = new Map(formConfigs.map((fc) => [fc.event_id, fc]));
  const questionsByConfigId = new Map<string, Db["event_form_questions"]["Row"][]>();
  for (const q of formQuestions) {
    const list = questionsByConfigId.get(q.form_config_id) ?? [];
    list.push(q);
    questionsByConfigId.set(q.form_config_id, list);
  }
  const regAnswersByRegistration = new Map<string, Db["event_registration_answers"]["Row"][]>();
  for (const a of registrationAnswers) {
    const list = regAnswersByRegistration.get(a.registration_id) ?? [];
    list.push(a);
    regAnswersByRegistration.set(a.registration_id, list);
  }
  const questionById = new Map(formQuestions.map((q) => [q.id, q]));
  const regsByEvent = new Map<string, Db["event_registrations"]["Row"][]>();
  for (const r of registrations) {
    const list = regsByEvent.get(r.event_id) ?? [];
    list.push(r);
    regsByEvent.set(r.event_id, list);
  }
  const pollsByEvent = new Map<string, Db["event_polls"]["Row"][]>();
  for (const p of polls) {
    const list = pollsByEvent.get(p.event_id) ?? [];
    list.push(p);
    pollsByEvent.set(p.event_id, list);
  }
  const pracharByEvent = new Map(pracharRows.map((p) => [p.event_id, p]));

  const events = visibleEventRows.map<GatividhiEvent>((e) => {
    const fc = formConfigByEventId.get(e.id);
    const questions = fc ? questionsByConfigId.get(fc.id) ?? [] : [];
    const regs = manageableEventIdSet.has(e.id)
      ? (regsByEvent.get(e.id) ?? []).map((r) => {
      const customAnswers: Record<string, string> = {};
      const answerRows = regAnswersByRegistration.get(r.id) ?? [];
      for (const answer of answerRows) {
        const q = questionById.get(answer.question_id);
        if (!q) continue;
        customAnswers[q.id] =
          answer.answer_text ??
          (answer.answer_json ? JSON.stringify(answer.answer_json) : "");
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
      })
      : [];

    const polls = buildPolls(
      pollsByEvent.get(e.id) ?? [],
      pollOptions.filter((o) => (pollsByEvent.get(e.id) ?? []).some((p) => p.id === o.poll_id)),
      pollVotes.filter((v) => (pollsByEvent.get(e.id) ?? []).some((p) => p.id === v.poll_id)),
    );

    return {
      id: e.id,
      title: e.title,
      description: e.description ?? "",
      date: formatDisplayDate(e.starts_at),
      dateIso: e.starts_at,
      unit: e.unit_id ? (unitsById.get(e.unit_id) ?? "Unknown Unit") : "Unknown Unit",
      submittedBy: e.submitted_by_name_snapshot ?? "Current User",
      status: dbToUiEventStatus[e.status],
      checklist: buildChecklist(e.checklist),
      report: e.report ?? undefined,
      imageUrl: e.image_url ?? undefined,
      videoUrl: e.video_url ?? undefined,
      registrations: regs.length ? regs : undefined,
      formConfig: buildFormConfig(fc, questions),
      polls: polls.length ? polls : undefined,
      vrittAttendanceCount: e.vritt_attendance_count ?? 0,
      vrittMediaUrls: e.vritt_media_urls ?? [],
      vrittContent: e.vritt_content ?? "",
      vrittStatus: (["draft", "submitted", "reviewed"].includes(e.vritt_status ?? "")
        ? e.vritt_status
        : "draft") as VrittStatus,
    };
  });

  const pracharStatuses = events
    .filter((e) => e.status === "Published")
    .map<PracharStatus>((e) => {
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

  // Fetch latest review notes per article
  const visibleArticleIds = visibleArticleRows.map((a) => a.id);
  let articleReviewRows: { article_id: string; review_notes: string | null; created_at: string }[] = [];
  if (visibleArticleIds.length > 0) {
    const reviewsRes = await supabase
      .from("article_reviews")
      .select("article_id,review_notes,created_at")
      .in("article_id", visibleArticleIds)
      .order("created_at", { ascending: false });
    if (reviewsRes.error) throw reviewsRes.error;
    articleReviewRows = reviewsRes.data ?? [];
  }
  const latestReviewByArticle = new Map<string, string | null>();
  for (const review of articleReviewRows) {
    if (latestReviewByArticle.has(review.article_id)) continue;
    if (review.review_notes && review.review_notes.trim()) {
      latestReviewByArticle.set(review.article_id, review.review_notes);
    }
  }

  const articles = visibleArticleRows.map<AalekhArticle>((a) => {
    const values = asObject(a.values_checklist);
    return {
      id: a.id,
      title: a.title,
      content: a.content,
      summary: a.summary ?? "",
      author: a.author_name_snapshot ?? "Current User",
      date: (a.created_at ?? "").slice(0, 10),
      category: a.category,
      status: dbToUiArticleStatus[a.status],
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

  // Fetch vimarsh topics and resources
  let vimarshTopics: VimarshTopic[] = [];
  const [topicsRes, resourcesRes] = await Promise.all([
    supabase.from("vimarsh_topics").select("*").order("sort_order", { ascending: true }),
    supabase.from("vimarsh_resources").select("*"),
  ]);
  if (!topicsRes.error && !resourcesRes.error) {
    const resourcesByTopic = new Map<string, VimarshResource[]>();
    for (const r of resourcesRes.data ?? []) {
      const list = resourcesByTopic.get(r.topic_id) ?? [];
      list.push({
        id: r.id,
        topicId: r.topic_id,
        title: r.title,
        url: r.url,
        resourceType: r.resource_type,
      });
      resourcesByTopic.set(r.topic_id, list);
    }

    vimarshTopics = (topicsRes.data ?? []).map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      sortOrder: t.sort_order ?? 0,
      resources: resourcesByTopic.get(t.id) ?? [],
    }));
  }

  return {
    events,
    articles,
    pracharStatuses,
    vimarshTopics,
    notifications: [],
    viewer: buildViewerContext(ctx),
  };
}

async function recordWorkflowApproval(
  supabase: DbClient,
  params: {
    entityType: "event" | "article";
    entityId: string;
    fromStatus: string | null;
    toStatus: string;
    actorId: string;
    actorRole: string;
    stepLabel?: string;
    remarks?: string;
    isFinalStep?: boolean;
    metadata?: Record<string, unknown>;
  },
) {
  await supabase.from("workflow_approvals").insert({
    entity_type: params.entityType,
    entity_id: params.entityId,
    from_status: params.fromStatus,
    to_status: params.toStatus,
    actor_id: params.actorId,
    actor_role: params.actorRole,
    step_label: params.stepLabel,
    remarks: params.remarks,
    is_final_step: !!params.isFinalStep,
    metadata: (params.metadata || {}) as Json,
  });
}

async function insertEventStatusHistory(
  supabase: DbClient,
  ctx: RequestAuthContext,
  eventId: string,
  oldStatus: EventRow["status"] | null,
  newStatus: EventRow["status"],
  remarks?: string,
) {
  await supabase.from("event_status_history").insert({
    event_id: eventId,
    old_status: oldStatus,
    new_status: newStatus,
    changed_by: ctx.user.id,
    reason: remarks || "app_action",
  });

  // Also record in the new workflow_approvals table for Phase 2
  await recordWorkflowApproval(supabase, {
    entityType: "event",
    entityId: eventId,
    fromStatus: oldStatus,
    toStatus: newStatus,
    actorId: ctx.user.id,
    actorRole: ctx.effectiveRoles[0] || "unknown",
    remarks,
  });
}

export async function runAppAction(ctx: RequestAuthContext, input: AppActionRequest) {
  const supabase = ctx.supabase;
  const orgId = resolveActorOrgId(ctx);

  switch (input.action) {
    case "createEvent": {
      const unitId = await ensureUnitIdByName(supabase, orgId, input.payload.unit || "Bhopal");
      assertCanCreateEvent(ctx, { orgId, unitId, departmentId: null });
      const startsAt = toDateOnlyIso(input.payload.dateIso ?? input.payload.date) ?? new Date().toISOString();

      const { data: eventRow, error } = await supabase
        .from("events")
        .insert({
          org_id: orgId,
          unit_id: unitId,
          title: input.payload.title,
          description: input.payload.description,
          status: "pending_aayam_review",
          starts_at: startsAt,
          submitted_by_user_id: ctx.user.id,
          submitted_by_name_snapshot: ctx.profile?.display_name ?? input.payload.submittedBy,
          checklist: input.payload.checklist as unknown as Json,
          report: input.payload.report ?? null,
          image_url: input.payload.imageUrl ?? null,
          video_url: input.payload.videoUrl ?? null,
          registration_public_enabled: true,
          voting_public_enabled: true,
          public_page_enabled: true,
          created_by: ctx.user.id,
          updated_by: ctx.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (input.payload.formConfig) {
        await runAppAction(ctx, {
          action: "updateFormConfig",
          payload: { eventId: eventRow.id, config: input.payload.formConfig },
        });
      }

      await insertEventStatusHistory(supabase, ctx, eventRow.id, null, "pending_aayam_review");
      return { ok: true, eventId: eventRow.id };
    }

    case "updateEventStatus": {
      const dbStatus = uiToDbEventStatus[input.payload.status] as EventRow["status"];
      const { data: existing, error: selectError } = await supabase
        .from("events")
        .select("*")
        .eq("id", input.payload.id)
        .single();
      if (selectError) throw selectError;
      assertCanTransitionEventStatus(ctx, existing, dbStatus);

      const { error } = await supabase
        .from("events")
        .update({
          status: dbStatus,
          published_at: dbStatus === "published" ? new Date().toISOString() : null,
          updated_by: ctx.user.id,
        })
        .eq("id", input.payload.id);
      if (error) throw error;

      if (dbStatus === "published") {
        await supabase.from("prachar_statuses").upsert(
          {
            event_id: input.payload.id,
            last_updated_by: ctx.user.id,
            last_updated_at: new Date().toISOString(),
          },
          { onConflict: "event_id" },
        );
      }
      await insertEventStatusHistory(supabase, ctx, existing.id, existing.status, dbStatus);
      return { ok: true };
    }

    case "updateFormConfig": {
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", input.payload.eventId)
        .single();
      if (eventError) throw eventError;
      if (!canManageEventDraft(ctx, eventRow)) {
        throw new ForbiddenError("You do not have permission to update this event form.");
      }

      const { data: configRow, error: configError } = await supabase
        .from("event_form_configs")
        .upsert(
          {
            event_id: input.payload.eventId,
            is_enabled: true,
            is_public: true,
            collect_phone: input.payload.config.fields.phone,
            collect_city: input.payload.config.fields.city,
            collect_attending_count: input.payload.config.fields.attendingCount,
            collect_special_needs: input.payload.config.fields.specialNeeds,
            created_by: ctx.user.id,
            updated_by: ctx.user.id,
          },
          { onConflict: "event_id" },
        )
        .select("id")
        .single();
      if (configError) throw configError;

      const { error: deleteError } = await supabase
        .from("event_form_questions")
        .delete()
        .eq("form_config_id", configRow.id);
      if (deleteError) throw deleteError;

      if (input.payload.config.customQuestions.length > 0) {
        const rows = input.payload.config.customQuestions.map((q, index) => ({
          event_id: input.payload.eventId,
          form_config_id: configRow.id,
          question_key: q.id,
          label: q.question,
          label_hi: q.questionHi,
          question_type: q.type === "yesno" ? "yesno" : "text",
          display_order: index,
          is_required: false,
          created_by: ctx.user.id,
          updated_by: ctx.user.id,
        }));
        const { error: insertQuestionsError } = await supabase
          .from("event_form_questions")
          .insert(rows as Db["event_form_questions"]["Insert"][]);
        if (insertQuestionsError) throw insertQuestionsError;
      }

      return { ok: true };
    }

    case "addPoll": {
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", input.payload.eventId)
        .single();
      if (eventError) throw eventError;
      if (!canManageEventDraft(ctx, eventRow)) {
        throw new ForbiddenError("You do not have permission to add polls to this event.");
      }

      const { data: pollRow, error } = await supabase
        .from("event_polls")
        .insert({
          event_id: input.payload.eventId,
          question: input.payload.poll.question,
          question_hi: input.payload.poll.questionHi,
          poll_type: input.payload.poll.type,
          is_public_voting: true,
          created_by: ctx.user.id,
          updated_by: ctx.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      const options = input.payload.poll.options.map((o, index) => ({
        poll_id: pollRow.id,
        label: o.label,
        sort_order: index,
        scheduled_at:
          input.payload.poll.type === "date"
            ? (toDateOnlyIso((o as { scheduledAtIso?: string | null }).scheduledAtIso ?? o.label) ?? null)
            : null,
        created_by: ctx.user.id,
        updated_by: ctx.user.id,
      }));
      const { error: optionError } = await supabase
        .from("event_poll_options")
        .insert(options as Db["event_poll_options"]["Insert"][]);
      if (optionError) throw optionError;

      return { ok: true, pollId: pollRow.id };
    }

    case "castVote": {
      const [{ data: pollRow, error: pollError }, { data: eventRow, error: eventError }] = await Promise.all([
        supabase
          .from("event_polls")
          .select("*")
          .eq("id", input.payload.pollId)
          .eq("event_id", input.payload.eventId)
          .single(),
        supabase.from("events").select("*").eq("id", input.payload.eventId).single(),
      ]);
      if (pollError) throw pollError;
      if (eventError) throw eventError;
      if (!canViewEvent(ctx, eventRow)) {
        throw new ForbiddenError("You do not have permission to vote on this poll.");
      }

      const { error } = await supabase.from("event_poll_votes").insert({
        poll_id: input.payload.pollId,
        option_id: input.payload.optionId,
        actor_user_id: ctx.user.id,
      });
      if (error) throw error;
      return { ok: true };
    }

    case "finalizePoll": {
      const [{ data: pollRow, error: pollError }, { data: eventRow, error: eventError }] = await Promise.all([
        supabase
          .from("event_polls")
          .select("*")
          .eq("id", input.payload.pollId)
          .eq("event_id", input.payload.eventId)
          .single(),
        supabase.from("events").select("*").eq("id", input.payload.eventId).single(),
      ]);
      if (pollError) throw pollError;
      if (eventError) throw eventError;
      assertCanFinalizePoll(ctx, eventRow, pollRow);

      const { error } = await supabase
        .from("event_polls")
        .update({
          is_finalized: true,
          winner_option_id: input.payload.winnerOptionId,
          finalized_by: ctx.user.id,
          updated_by: ctx.user.id,
        })
        .eq("id", input.payload.pollId)
        .eq("event_id", input.payload.eventId);
      if (error) throw error;
      return { ok: true };
    }

    case "addArticle": {
      assertCanCreateArticle(ctx, { orgId, unitId: null, departmentId: null });
      const { data: articleRow, error } = await supabase
        .from("articles")
        .insert({
          org_id: orgId,
          title: input.payload.title,
          content: input.payload.content,
          summary: input.payload.summary,
          category: input.payload.category,
          status: "pending_unit_head_review",
          author_user_id: ctx.user.id,
          author_name_snapshot: ctx.profile?.display_name ?? input.payload.author,
          social_url: input.payload.socialUrl ?? null,
          values_checklist: input.payload.valuesChecklist as unknown as Json,
          created_by: ctx.user.id,
          updated_by: ctx.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;

      await recordWorkflowApproval(supabase, {
        entityType: "article",
        entityId: articleRow.id,
        fromStatus: null,
        toStatus: "pending_unit_head_review",
        actorId: ctx.user.id,
        actorRole: ctx.effectiveRoles[0] || "unknown",
      });

      return { ok: true };
    }

    case "updateArticleStatus": {
      const targetStatus = uiToDbArticleStatus[input.payload.status] as ArticleRow["status"];
      const { data: articleRow, error: articleError } = await supabase
        .from("articles")
        .select("*")
        .eq("id", input.payload.id)
        .single();
      if (articleError) throw articleError;
      assertCanTransitionArticleStatus(ctx, articleRow, targetStatus);

      const updates: Db["articles"]["Update"] = {
        status: targetStatus,
        updated_by: ctx.user.id,
      };
      if (input.payload.edits?.title) updates.title = input.payload.edits.title;
      if (input.payload.edits?.content) updates.content = input.payload.edits.content;
      if (input.payload.edits?.summary) updates.summary = input.payload.edits.summary;
      if (input.payload.documentUrl !== undefined) {
        updates.document_url = input.payload.documentUrl;
      }
      if (targetStatus === "published") {
        updates.published_at = new Date().toISOString();
      }
      const { error } = await supabase
        .from("articles")
        .update(updates)
        .eq("id", input.payload.id);
      if (error) throw error;

      const reviewInsert: Db["article_reviews"]["Insert"] = {
        article_id: input.payload.id,
        reviewer_user_id: ctx.user.id,
        review_step: "app_action",
        decision:
          input.payload.status === "Published"
            ? "approved"
            : input.payload.status === "Pending Aayam Review"
              ? "forwarded"
              : "changes_requested",
        edits: (input.payload.edits ?? {}) as unknown as Json,
        review_notes: input.payload.reviewNotes ?? null,
      };
      await supabase.from("article_reviews").insert(reviewInsert);

      await recordWorkflowApproval(supabase, {
        entityType: "article",
        entityId: input.payload.id,
        fromStatus: articleRow.status,
        toStatus: targetStatus,
        actorId: ctx.user.id,
        actorRole: ctx.effectiveRoles[0] || "unknown",
        remarks: input.payload.reviewNotes || undefined,
        metadata: { edits: input.payload.edits },
      });

      if (input.payload.status === "Published") {
        await supabase.from("article_publications").insert({
          article_id: input.payload.id,
          channel: "feed",
          published_by: ctx.user.id,
        });
      }

      return { ok: true };
    }

    case "updatePracharPlatform": {
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", input.payload.eventId)
        .single();
      if (eventError) throw eventError;
      assertCanUpdatePracharStatus(ctx, eventRow);

      type PracharInsert = Db["prachar_statuses"]["Insert"];
      type PracharUpdate = Db["prachar_statuses"]["Update"];
      const doneKey = `${input.payload.platform}_done` as keyof PracharInsert & keyof PracharUpdate;
      const skipKey = `${input.payload.platform}_skip_reason` as keyof PracharInsert & keyof PracharUpdate;

      const nowIso = new Date().toISOString();
      const doneValue = input.payload.done;
      const skipValue = doneValue ? null : (input.payload.skipReason ?? null);

      // Check whether a prachar_statuses row already exists for this event
      const { data: existing } = await supabase
        .from("prachar_statuses")
        .select("id")
        .eq("event_id", input.payload.eventId)
        .maybeSingle();

      if (existing) {
        // Row exists — targeted update of only the changed platform columns
        const { error } = await supabase
          .from("prachar_statuses")
          .update({
            [doneKey]: doneValue,
            [skipKey]: skipValue,
            last_updated_by: ctx.user.id,
            last_updated_at: nowIso,
          } as PracharUpdate)
          .eq("event_id", input.payload.eventId);
        if (error) throw error;
      } else {
        // No row yet — insert a full initial row with only this platform set
        const { error } = await supabase
          .from("prachar_statuses")
          .insert({
            event_id: input.payload.eventId,
            [doneKey]: doneValue,
            [skipKey]: skipValue,
            last_updated_by: ctx.user.id,
            last_updated_at: nowIso,
          } as PracharInsert);
        if (error) throw error;
      }

      return { ok: true };
    }

    case "updateVritt": {
      const { data: eventRow, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", input.payload.eventId)
        .single();
      if (eventError) throw eventError;
      if (!canManageEventDraft(ctx, eventRow)) {
        throw new ForbiddenError("You do not have permission to update vritt for this event.");
      }

      const vrittUpdates: Db["events"]["Update"] = {
        updated_by: ctx.user.id,
        vritt_updated_at: new Date().toISOString(),
      };
      if (input.payload.vrittContent !== undefined) {
        vrittUpdates.vritt_content = input.payload.vrittContent;
      }
      if (input.payload.vrittAttendanceCount !== undefined) {
        vrittUpdates.vritt_attendance_count = input.payload.vrittAttendanceCount;
      }
      if (input.payload.vrittMediaUrls !== undefined) {
        vrittUpdates.vritt_media_urls = input.payload.vrittMediaUrls;
      }
      if (input.payload.vrittStatus !== undefined) {
        vrittUpdates.vritt_status = input.payload.vrittStatus;
      }

      const { error } = await supabase
        .from("events")
        .update(vrittUpdates)
        .eq("id", input.payload.eventId);
      if (error) throw error;

      return { ok: true };
    }
  }
}

export async function submitPublicRegistration(eventId: string, body: PublicRegistrationRequest, meta: { ip?: string | null; userAgent?: string | null }) {
  // Service role is intentionally retained for public endpoint orchestration.
  // The route performs explicit published/public checks before writes.
  const supabase = getSupabaseAdminClient();

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("id,status,registration_public_enabled")
    .eq("id", eventId)
    .single();
  if (eventError) throw eventError;
  if (eventRow.status !== "published" || !eventRow.registration_public_enabled) {
    throw new Error("Public registration is not enabled for this event.");
  }

  const { data: config } = await supabase
    .from("event_form_configs")
    .select("*")
    .eq("event_id", eventId)
    .maybeSingle();

  if (config && (!config.is_enabled || !config.is_public)) {
    throw new Error("Registration form is disabled.");
  }

  const answerHash = hashVoterFingerprint(
    `${eventId}:${body.name}:${body.phone ?? ""}:${body.city ?? ""}:${Date.now()}`,
  );

  const { data: registrationRow, error: regError } = await supabase
    .from("event_registrations")
    .insert({
      event_id: eventId,
      name: body.name.trim(),
      phone: body.phone?.trim() || null,
      city: body.city?.trim() || null,
      attending_count: Math.max(1, body.attendingCount ?? 1),
      has_special_needs: Boolean(body.hasSpecialNeeds),
      notes: body.notes?.trim() || null,
      answers_payload: (body.customAnswers ?? {}) as unknown as Json,
      public_submission_key_hash: answerHash,
      submitted_from_ip: meta.ip ?? null,
      submitted_user_agent: meta.userAgent ?? null,
    })
    .select("id")
    .single();
  if (regError) throw regError;

  if (config && body.customAnswers && Object.keys(body.customAnswers).length > 0) {
    const { data: questions } = await supabase
      .from("event_form_questions")
      .select("id,question_key")
      .eq("event_id", eventId);
    const questionMap = new Map((questions ?? []).map((q) => [q.question_key, q.id]));
    const answerRows = Object.entries(body.customAnswers)
      .map(([key, value]) => {
        const questionId = questionMap.get(key);
        return {
          registration_id: registrationRow.id,
          question_id: questionId,
          answer_text: value,
        };
      })
      .filter((r) => Boolean(r.question_id));

    if (answerRows.length > 0) {
      await supabase.from("event_registration_answers").insert(answerRows as Db["event_registration_answers"]["Insert"][]);
    }
  }

  return { ok: true, registrationId: registrationRow.id };
}

export async function getPublicEventPageData(eventId: string) {
  // Service role is intentionally retained for a consolidated public payload (including vote aggregates).
  // Visibility is restricted to published + public-enabled events below before any data is returned.
  const supabase = getSupabaseAdminClient();

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();
  if (eventError) throw eventError;

  if (
    eventRow.status !== "published" ||
    !(eventRow.public_page_enabled || eventRow.registration_public_enabled || eventRow.voting_public_enabled)
  ) {
    throw new Error("Public event page is not available.");
  }

  const [
    unitRes,
    formConfigRes,
    formQuestionsRes,
    pollsRes,
  ] = await Promise.all([
    eventRow.unit_id
      ? supabase.from("units").select("id,name").eq("id", eventRow.unit_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("event_form_configs").select("*").eq("event_id", eventId).maybeSingle(),
    supabase.from("event_form_questions").select("*").eq("event_id", eventId),
    supabase.from("event_polls").select("*").eq("event_id", eventId),
  ]);

  if (unitRes.error) throw unitRes.error;
  if (formConfigRes.error) throw formConfigRes.error;
  if (formQuestionsRes.error) throw formQuestionsRes.error;
  if (pollsRes.error) throw pollsRes.error;

  const polls = pollsRes.data ?? [];
  const pollIds = polls.map((p) => p.id);

  let pollOptions: Db["event_poll_options"]["Row"][] = [];
  let pollVotes: Db["event_poll_votes"]["Row"][] = [];
  if (pollIds.length > 0) {
    const [pollOptionsRes, pollVotesRes] = await Promise.all([
      supabase.from("event_poll_options").select("*").in("poll_id", pollIds),
      supabase.from("event_poll_votes").select("*").in("poll_id", pollIds),
    ]);
    if (pollOptionsRes.error) throw pollOptionsRes.error;
    if (pollVotesRes.error) throw pollVotesRes.error;
    pollOptions = pollOptionsRes.data ?? [];
    pollVotes = pollVotesRes.data ?? [];
  }

  const formConfig = buildFormConfig(formConfigRes.data ?? undefined, formQuestionsRes.data ?? []);
  const votePolls = buildPolls(polls, pollOptions, pollVotes);

  const event: GatividhiEvent = {
    id: eventRow.id,
    title: eventRow.title,
    description: eventRow.description ?? "",
    date: formatDisplayDate(eventRow.starts_at),
    dateIso: eventRow.starts_at,
    unit: unitRes.data?.name ?? "Unknown Unit",
    submittedBy: eventRow.submitted_by_name_snapshot ?? "Current User",
    status: dbToUiEventStatus[eventRow.status],
    checklist: buildChecklist(eventRow.checklist),
    report: undefined,
    imageUrl: undefined,
    videoUrl: undefined,
    formConfig,
    polls: votePolls.length ? votePolls : undefined,
  };

  return { event };
}

export async function submitPublicVote(
  eventId: string,
  pollId: string,
  body: PublicVoteRequest,
  meta: { ip?: string | null; userAgent?: string | null },
) {
  // Service role is intentionally retained for public voting writes after server-side checks.
  const supabase = getSupabaseAdminClient();

  const { data: pollRow, error: pollError } = await supabase
    .from("event_polls")
    .select("id,event_id,is_public_voting,is_finalized,opens_at,closes_at")
    .eq("id", pollId)
    .eq("event_id", eventId)
    .single();
  if (pollError) throw pollError;

  const { data: eventRow, error: eventError } = await supabase
    .from("events")
    .select("id,status,voting_public_enabled")
    .eq("id", eventId)
    .single();
  if (eventError) throw eventError;

  if (eventRow.status !== "published" || !eventRow.voting_public_enabled || !pollRow.is_public_voting) {
    throw new Error("Public voting is not enabled for this poll.");
  }
  if (pollRow.is_finalized) {
    throw new Error("Poll is finalized.");
  }

  const now = new Date();
  if (pollRow.opens_at && new Date(pollRow.opens_at) > now) {
    throw new Error("Poll has not opened yet.");
  }
  if (pollRow.closes_at && new Date(pollRow.closes_at) < now) {
    throw new Error("Poll is closed.");
  }

  const { data: optionRow, error: optionError } = await supabase
    .from("event_poll_options")
    .select("id,poll_id")
    .eq("id", body.optionId)
    .eq("poll_id", pollId)
    .single();
  if (optionError) throw optionError;

  const ip = meta.ip ?? "unknown";
  const ua = meta.userAgent ?? "unknown";
  const fingerprint = hashVoterFingerprint(`${eventId}:${pollId}:${ip}:${ua}`);

  const { error } = await supabase.from("event_poll_votes").insert({
    poll_id: pollId,
    option_id: optionRow.id,
    voter_fingerprint_hash: fingerprint,
    submitted_from_ip: meta.ip ?? null,
    submitted_user_agent: meta.userAgent ?? null,
  });
  if (error) throw error;

  return { ok: true };
}
