import { createHash } from "node:crypto";
import { getPublicSql, firstRow, firstReturnedRow } from "@/lib/server/neon-public";
import { hasInsertedVote, buildPublicPolls } from "@/lib/public-events";
import type { PublicRegistrationInput } from "@/lib/validators/events";
import type {
  PublicPollRow,
  PublicPollOptionRow,
  PublicPollVoteCountRow,
} from "@/lib/public-events";

export class PublicEventServiceError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PublicEventServiceError";
  }
}

type SqlClient = NonNullable<ReturnType<typeof getPublicSql>>;

// ── Registration ───────────────────────────────────────────────────────────────

/**
 * Cyclomatic: 8
 * Cognitive: 18
 */
export async function createPublicRegistration(
  sql: SqlClient,
  eventId: string,
  input: PublicRegistrationInput,
  meta: { ip: string | null; ua: string | null },
): Promise<{ registrationId: string }> {
  const eventRows = await sql.query("SELECT status FROM public.events WHERE id = $1 LIMIT 1", [eventId]);
  const eventStatus = firstRow<{ status: string }>(eventRows)?.status;
  if (!["authorized_public", "published"].includes(eventStatus ?? "")) {
    throw new PublicEventServiceError("Registration is not open for this event.", 403);
  }

  const configRows = await sql.query("SELECT is_enabled, is_public, allow_multiple_submissions, max_registrations, opens_at, closes_at FROM public.event_form_configs WHERE event_id = $1 LIMIT 1", [eventId]);
  const config = firstRow<{
    is_enabled: boolean;
    is_public: boolean;
    allow_multiple_submissions: boolean;
    max_registrations: number | null;
    opens_at: string | null;
    closes_at: string | null;
  }>(configRows);

  if (!config || !config.is_enabled || !config.is_public) {
    throw new PublicEventServiceError("Registration is not open for this event.", 403);
  }

  const now = new Date();
  if (config.opens_at && new Date(config.opens_at) > now) {
    throw new PublicEventServiceError("Registration has not opened yet.", 403);
  }
  if (config.closes_at && new Date(config.closes_at) < now) {
    throw new PublicEventServiceError("Registration has closed.", 403);
  }

  if (config.max_registrations != null) {
    const countRows = await sql.query("SELECT COUNT(*)::int AS total FROM public.event_registrations WHERE event_id = $1", [eventId]);
    const currentCount = firstRow<{ total: number }>(countRows)?.total ?? 0;
    if (currentCount >= config.max_registrations) {
      throw new PublicEventServiceError("This event is full. Registration is closed.", 403);
    }
  }

  const hash = createHash("sha256")
    .update(`${eventId}:${input.name}:${input.phone ?? ""}:${input.city ?? ""}`)
    .digest("hex");

  if (!config.allow_multiple_submissions) {
    const dupRows = await sql.query("SELECT id FROM public.event_registrations WHERE event_id = $1 AND public_submission_key_hash = $2 LIMIT 1", [eventId, hash]);
    if (Array.isArray(dupRows) && dupRows.length > 0) {
      throw new PublicEventServiceError("You have already registered for this event.", 409);
    }
  }

  const result = await sql.query("INSERT INTO public.event_registrations ( event_id, name, phone, city, attending_count, has_special_needs, notes, public_submission_key_hash, submitted_from_ip, submitted_user_agent ) VALUES ( $1, $2, $3, $4, $5, $6, $7, $8, $9, $10 ) RETURNING id", [eventId, input.name.trim(), input.phone?.trim() || null, input.city?.trim() || null, Math.max(1, input.attendingCount ?? 1), Boolean(input.hasSpecialNeeds), input.notes?.trim() || null, hash, meta.ip, meta.ua]);

  const registrationId = firstRow<{ id: string }>(result)?.id;
  const customAnswers = input.customAnswers ?? input.answers ?? null;

  if (registrationId && customAnswers) {
    for (const [questionKey, answer] of Object.entries(customAnswers)) {
      if (!questionKey || typeof answer !== "string" || !answer.trim()) continue;
      await sql.query("INSERT INTO public.event_registration_answers (registration_id, event_id, question_key, answer) VALUES ($1, $2, $3, $4)", [registrationId, eventId, questionKey, answer.trim()]);
    }
  }

  return { registrationId: registrationId ?? "" };
}

// ── Check-in ───────────────────────────────────────────────────────────────────

function isMissingDbObjectError(err: unknown, hint: string): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("does not exist") && msg.includes(hint);
}

interface CheckInStrategy {
  name: string;
  hint: string;
  run: (sql: SqlClient, eventId: string) => Promise<unknown>;
}

const strategies: CheckInStrategy[] = [
  {
    name: "events.vritt_checked_in_count",
    hint: "vritt_checked_in_count",
    run: async (sql, eventId) =>
      sql.query("UPDATE public.events SET vritt_checked_in_count = COALESCE(vritt_checked_in_count, 0) + 1 WHERE id = $1 RETURNING id", [eventId]),
  },
  {
    name: "events.vritt_attendance_count",
    hint: "vritt_attendance_count",
    run: async (sql, eventId) =>
      sql.query("UPDATE public.events SET vritt_attendance_count = COALESCE(vritt_attendance_count, 0) + 1 WHERE id = $1 RETURNING id", [eventId]),
  },
  {
    name: "event_vritt.checked_in_count",
    hint: "event_vritt",
    run: async (sql, eventId) =>
      sql.query("INSERT INTO public.event_vritt (event_id, checked_in_count, updated_at) VALUES ($1, 1, now()) ON CONFLICT (event_id) DO UPDATE SET checked_in_count = COALESCE(public.event_vritt.checked_in_count, 0) + 1, updated_at = now() RETURNING event_id", [eventId]),
  },
];

async function incrementPublicCheckInCount(
  sql: SqlClient,
  eventId: string,
): Promise<{ ok: true; via: string } | { ok: false; error: string }> {
  for (const strategy of strategies) {
    try {
      const rows = await strategy.run(sql, eventId);
      if (firstReturnedRow(rows)) return { ok: true, via: strategy.name };
    } catch (err) {
      if (!isMissingDbObjectError(err, strategy.hint)) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
    }
  }

  return {
    ok: false,
    error:
      "No supported check-in storage found. Apply migration 20260319000002_phase3_qr_attendance.sql or 20260416000001_ensure_events_vritt_checked_in_count.sql, or ensure public.event_vritt exists.",
  };
}

/**
 * Cyclomatic: 5
 * Cognitive: 12
 */
export async function checkInToEvent(
  sql: SqlClient,
  eventId: string,
): Promise<{ via: string }> {
  const statusRows = await sql.query("SELECT status FROM public.events WHERE id = $1 LIMIT 1", [eventId]);
  const event = firstReturnedRow(statusRows) as { status?: string } | undefined;
  if (!event) {
    throw new PublicEventServiceError("Event not found.", 404);
  }
  if (event.status !== "authorized_public" && event.status !== "published") {
    throw new PublicEventServiceError("Event is not open for check-in.", 403);
  }

  const inc = await incrementPublicCheckInCount(sql, eventId);
  if (!inc.ok) {
    throw new PublicEventServiceError(inc.error, 503);
  }

  return { via: inc.via };
}

// ── Vote ───────────────────────────────────────────────────────────────────────

/**
 * Cyclomatic: 6
 * Cognitive: 15
 */
export async function castPublicVote(
  sql: SqlClient,
  eventId: string,
  pollId: string,
  optionId: string,
  meta: { ip: string; ua: string },
): Promise<{ ok: true }> {
  const [pollRows, eventRows] = await Promise.all([
    sql.query("SELECT * FROM public.event_polls WHERE id = $1 AND event_id = $2 LIMIT 1", [pollId, eventId]),
    sql.query("SELECT status FROM public.events WHERE id = $1 LIMIT 1", [eventId]),
  ]);

  const poll = firstRow<{ is_finalized?: boolean }>(pollRows);
  const event = firstRow<{ status?: string }>(eventRows);
  if (!poll || !event) {
    throw new PublicEventServiceError("Not found.", 404);
  }
  if (event.status !== "authorized_public" && event.status !== "published") {
    throw new PublicEventServiceError("Voting not enabled.", 403);
  }
  if (poll.is_finalized) {
    throw new PublicEventServiceError("Poll is finalized.", 400);
  }

  const insertedRows = await sql.query("INSERT INTO public.event_poll_votes (poll_id, option_id, submitted_from_ip, submitted_user_agent) SELECT $1, $2, $3, $4 WHERE EXISTS ( SELECT 1 FROM public.event_poll_options WHERE id = $5 AND poll_id = $6 ) ON CONFLICT DO NOTHING RETURNING id", [pollId, optionId, meta.ip, meta.ua, optionId, pollId]);

  if (!hasInsertedVote(insertedRows)) {
    const optionRows = await sql.query("SELECT id, poll_id FROM public.event_poll_options WHERE id = $1 LIMIT 1", [optionId]);
    if (
      !Array.isArray(optionRows) ||
      !(optionRows as Array<{ id: string; poll_id: string }>).some(
        (row) => row.id === optionId && row.poll_id === pollId,
      )
    ) {
      throw new PublicEventServiceError("Option not found for this poll.", 400);
    }
    throw new PublicEventServiceError("Vote already recorded.", 409);
  }

  return { ok: true as const };
}

// ── Fetch public event ─────────────────────────────────────────────────────────

type EventRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  starts_at: string;
  unit_id: string | null;
  submitted_by_name_snapshot: string | null;
  checklist: unknown;
};

type UnitRow = { id: string; name: string };

type FormConfigRow = {
  id: string;
  collect_phone: boolean;
  collect_city: boolean;
  collect_attending_count: boolean;
  collect_special_needs: boolean;
};

type FormQuestionRow = {
  id: string;
  event_id: string;
  question_key: string;
  label: string;
  label_hi: string | null;
  question_type: string;
  display_order: number;
};

/**
 * Cyclomatic: 6
 * Cognitive: 14
 */
export async function fetchPublicEvent(
  sql: SqlClient,
  eventId: string,
): Promise<{
  event: {
    id: string;
    title: string;
    description: string;
    date: string;
    dateIso: string;
    unit: string;
    submittedBy: string;
    status: string;
    checklist: unknown;
    formConfig:
      | {
          fields: {
            phone: boolean;
            city: boolean;
            attendingCount: boolean;
            specialNeeds: boolean;
          };
          customQuestions: {
            id: string;
            question: string;
            questionHi: string;
            type: string;
          }[];
        }
      | undefined;
    polls: ReturnType<typeof buildPublicPolls> | undefined;
  };
}> {
  const [eventRows, formConfigRows, formQuestionRows, pollRows] = await Promise.all([
    sql.query("SELECT * FROM public.events WHERE id = $1 LIMIT 1", [eventId]),
    sql.query("SELECT * FROM public.event_form_configs WHERE event_id = $1", [eventId]),
    sql.query("SELECT * FROM public.event_form_questions WHERE event_id = $1", [eventId]),
    sql.query("SELECT * FROM public.event_polls WHERE event_id = $1", [eventId]),
  ]);

  const event = firstRow<EventRow>(eventRows);
  if (!event || !["published", "authorized_public"].includes(event.status)) {
    throw new PublicEventServiceError("Event not available.", 404);
  }

  const typedFormConfigs = formConfigRows as unknown as FormConfigRow[];
  const typedQuestions = formQuestionRows as unknown as FormQuestionRow[];
  const typedPolls = pollRows as unknown as PublicPollRow[];

  const [unitRows, pollOptionRows, pollVoteCountRows] = await Promise.all([
    event.unit_id
      ? sql.query("SELECT id, name FROM public.units WHERE id = $1 LIMIT 1", [event.unit_id])
      : Promise.resolve([]),
    typedPolls.length
      ? sql.query("SELECT epo.id, epo.poll_id, epo.label, epo.scheduled_at FROM public.event_poll_options epo INNER JOIN public.event_polls ep ON ep.id = epo.poll_id WHERE ep.event_id = $1", [eventId])
      : Promise.resolve([]),
    typedPolls.length
      ? sql.query("SELECT epv.option_id, COUNT(*)::int AS total FROM public.event_poll_votes epv INNER JOIN public.event_poll_options epo ON epo.id = epv.option_id INNER JOIN public.event_polls ep ON ep.id = epo.poll_id WHERE ep.event_id = $1 GROUP BY epv.option_id", [eventId])
      : Promise.resolve([]),
  ]);

  const typedUnits = unitRows as unknown as UnitRow[];
  const typedPollOptions = pollOptionRows as unknown as PublicPollOptionRow[];
  const typedPollVoteCounts = pollVoteCountRows as unknown as PublicPollVoteCountRow[];

  const unitsById = new Map(typedUnits.map((unit) => [unit.id, unit.name]));
  const fc = typedFormConfigs[0];
  const polls = buildPublicPolls(typedPolls, typedPollOptions, typedPollVoteCounts);

  return {
    event: {
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      date: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(event.starts_at)),
      dateIso: event.starts_at,
      unit: event.unit_id ? (unitsById.get(event.unit_id) ?? "Unknown") : "Unknown",
      submittedBy: event.submitted_by_name_snapshot ?? "Organizer",
      status: ["authorized_public", "published"].includes(event.status) ? "Published" : event.status,
      checklist: typeof event.checklist === "object" && event.checklist !== null ? event.checklist : {},
      formConfig: fc
        ? {
            fields: {
              phone: fc.collect_phone,
              city: fc.collect_city,
              attendingCount: fc.collect_attending_count,
              specialNeeds: fc.collect_special_needs,
            },
            customQuestions: typedQuestions
              .sort((first, second) => first.display_order - second.display_order)
              .map((question) => ({
                id: question.question_key,
                question: question.label,
                questionHi: question.label_hi ?? question.label,
                type: question.question_type === "yesno" ? "yesno" : "text",
              })),
          }
        : undefined,
      polls: polls.length ? polls : undefined,
    },
  };
}
