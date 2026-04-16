import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { publicVoteSchema } from "@/lib/validators/events";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; pollId: string }> },
) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateRes = withPublicRateLimit(clientIp);
  if (rateRes) return rateRes;

  if (!sql) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const { eventId, pollId } = await params;
    if (!isValidUuid(eventId) || !isValidUuid(pollId)) {
      return NextResponse.json({ error: "Invalid ID format." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = publicVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Valid optionId required." }, { status: 400 });
    }
    const { optionId } = parsed.data;

    // Check poll is open
    const [pollRows, eventRows] = await Promise.all([
      sql`SELECT * FROM public.event_polls WHERE id = ${pollId} AND event_id = ${eventId} LIMIT 1`,
      sql`SELECT status FROM public.events WHERE id = ${eventId} LIMIT 1`,
    ]);
    const poll = pollRows[0];
    const event = eventRows[0];
    if (!poll || !event) return NextResponse.json({ error: "Not found." }, { status: 404 });
    if (event.status !== "authorized_public" && event.status !== "published") {
      return NextResponse.json({ error: "Voting not enabled." }, { status: 403 });
    }
    if (poll.is_finalized) return NextResponse.json({ error: "Poll is finalized." }, { status: 400 });

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const existingVoteRows = await sql`
      SELECT id FROM public.event_poll_votes
      WHERE poll_id = ${pollId}
        AND coalesce(submitted_from_ip, '') = ${ip}
        AND coalesce(submitted_user_agent, '') = ${ua}
      LIMIT 1
    `;
    if (existingVoteRows[0]) {
      return NextResponse.json({ error: "Vote already recorded." }, { status: 409 });
    }

    await sql`
      INSERT INTO public.event_poll_votes (poll_id, option_id, submitted_from_ip, submitted_user_agent)
      VALUES (${pollId}, ${optionId}, ${ip}, ${ua})
    `;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vote failed.";
    const status = /duplicate/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
