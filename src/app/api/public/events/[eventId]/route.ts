import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

type PublicEventRow = {
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
type PollRow = {
  id: string;
  question: string;
  question_hi: string | null;
  poll_type: string;
  is_finalized: boolean;
  winner_option_id: string | null;
};
type PollOptionRow = {
  id: string;
  poll_id: string;
  label: string;
  scheduled_at: string | null;
};
type PollVoteRow = { option_id: string };

function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  if (!sql) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { eventId } = await params;
    if (!isValidUuid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID format." }, { status: 400 });
    }

    const [eventRows, unitRows, formConfigRows, formQuestionRows, pollRows, pollOptionRows, pollVoteRows] =
      await Promise.all([
        sql`SELECT * FROM public.events WHERE id = ${eventId} LIMIT 1`,
        sql`SELECT id, name FROM public.units`,
        sql`SELECT * FROM public.event_form_configs WHERE event_id = ${eventId}`,
        sql`SELECT * FROM public.event_form_questions WHERE event_id = ${eventId}`,
        sql`SELECT * FROM public.event_polls WHERE event_id = ${eventId}`,
        sql`SELECT * FROM public.event_poll_options`,
        sql`SELECT * FROM public.event_poll_votes`,
      ]);

    const event = (eventRows as unknown as PublicEventRow[])[0];
    if (!event || !["published", "authorized_public"].includes(event.status)) {
      return NextResponse.json({ error: "Event not available." }, { status: 404 });
    }

    const typedUnits = unitRows as unknown as UnitRow[];
    const typedFormConfigs = formConfigRows as unknown as FormConfigRow[];
    const typedQuestions = formQuestionRows as unknown as FormQuestionRow[];
    const typedPolls = pollRows as unknown as PollRow[];
    const typedPollOptions = pollOptionRows as unknown as PollOptionRow[];
    const typedPollVotes = pollVoteRows as unknown as PollVoteRow[];

    const unitsById = new Map(typedUnits.map((unit) => [unit.id, unit.name]));
    const fc = typedFormConfigs[0];
    const polls = typedPolls.map((poll) => {
      const opts = typedPollOptions.filter((option) => option.poll_id === poll.id).map((option) => ({
        id: option.id,
        label: option.label,
        votes: typedPollVotes.filter((vote) => vote.option_id === option.id).length,
        scheduledAtIso: option.scheduled_at,
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

    return NextResponse.json({
      event: {
        id: event.id, title: event.title, description: event.description ?? "",
        date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(event.starts_at)),
        dateIso: event.starts_at,
        unit: event.unit_id ? (unitsById.get(event.unit_id) ?? "Unknown") : "Unknown",
        submittedBy: event.submitted_by_name_snapshot ?? "Organizer",
        status: ["authorized_public", "published"].includes(event.status) ? "Published" : event.status,
        checklist: typeof event.checklist === "object" && event.checklist !== null ? event.checklist : {},
        formConfig: fc ? {
          fields: { phone: fc.collect_phone, city: fc.collect_city, attendingCount: fc.collect_attending_count, specialNeeds: fc.collect_special_needs },
          customQuestions: typedQuestions
            .sort((first, second) => first.display_order - second.display_order)
            .map((question) => ({
              id: question.question_key,
              question: question.label,
              questionHi: question.label_hi ?? question.label,
              type: question.question_type === "yesno" ? "yesno" : "text",
            })),
        } : undefined,
        polls: polls.length ? polls : undefined,
      },
    }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load event.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
