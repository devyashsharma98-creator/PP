import "server-only";
import { neon } from "@neondatabase/serverless";
import type { NeonAuthContext } from "./auth";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL not set");
const sql = neon(connectionString);

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

function toBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
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
    viewer: {
      user: { id: ctx.user.id, email: ctx.user.email },
      profile: ctx.profile,
      effectiveRoles: ctx.effectiveRoles,
      assignments: ctx.assignments.map((a) => ({
        role_code: a.role_code,
        role_name: a.role_name,
        role_name_hi: a.role_name_hi,
      })),
      permissions: {
        canReadInternalBootstrap: true,
        canCreateEvent: true,
        canCreateArticle: true,
        canFinalizePoll: true,
        canPublishEvent: true,
        canPublishArticle: true,
        canUpdatePrachar: true,
      },
    },
  };
}
