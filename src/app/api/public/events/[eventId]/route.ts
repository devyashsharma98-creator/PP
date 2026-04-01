import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

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

    const event = eventRows[0];
    if (!event || event.status !== "published") {
      return NextResponse.json({ error: "Event not available." }, { status: 404 });
    }

    const unitsById = new Map(unitRows.map((u: any) => [u.id, u.name]));
    const fc = formConfigRows[0];
    const polls = pollRows.map((p: any) => {
      const opts = pollOptionRows.filter((o: any) => o.poll_id === p.id).map((o: any) => ({
        id: o.id, label: o.label,
        votes: pollVoteRows.filter((v: any) => v.option_id === o.id).length,
        scheduledAtIso: o.scheduled_at,
      }));
      return { id: p.id, question: p.question, questionHi: p.question_hi ?? p.question, type: p.poll_type, options: opts, isFinalized: p.is_finalized, winnerOptionId: p.winner_option_id ?? undefined };
    });

    return NextResponse.json({
      event: {
        id: event.id, title: event.title, description: event.description ?? "",
        date: new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(event.starts_at)),
        dateIso: event.starts_at,
        unit: event.unit_id ? (unitsById.get(event.unit_id) ?? "Unknown") : "Unknown",
        submittedBy: event.submitted_by_name_snapshot ?? "Organizer",
        status: event.status === "authorized_public" ? "Published" : event.status,
        checklist: typeof event.checklist === "object" ? event.checklist : {},
        formConfig: fc ? {
          fields: { phone: fc.collect_phone, city: fc.collect_city, attendingCount: fc.collect_attending_count, specialNeeds: fc.collect_special_needs },
          customQuestions: formQuestionRows.sort((a: any, b: any) => a.display_order - b.display_order).map((q: any) => ({ id: q.question_key, question: q.label, questionHi: q.label_hi ?? q.label, type: q.question_type === "yesno" ? "yesno" : "text" })),
        } : undefined,
        polls: polls.length ? polls : undefined,
      },
    }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load event.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

