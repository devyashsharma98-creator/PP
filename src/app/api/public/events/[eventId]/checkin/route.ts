import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NeonSql = NonNullable<typeof sql>;

function isMissingDbObjectError(err: unknown, hint: string) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("does not exist") && msg.includes(hint);
}

function firstReturnedRow(rows: unknown): unknown {
  return Array.isArray(rows) ? rows[0] : undefined;
}

/** Single strategy for incrementing check-in count. */
interface CheckInStrategy {
  name: string;
  hint: string;
  run: (runSql: NeonSql, eventId: string) => Promise<unknown>;
}

const strategies: CheckInStrategy[] = [
  {
    name: "events.vritt_checked_in_count",
    hint: "vritt_checked_in_count",
    run: async (runSql, eventId) =>
      runSql`
        UPDATE public.events
        SET vritt_checked_in_count = COALESCE(vritt_checked_in_count, 0) + 1
        WHERE id = ${eventId}
        RETURNING id
      `,
  },
  {
    name: "events.vritt_attendance_count",
    hint: "vritt_attendance_count",
    run: async (runSql, eventId) =>
      runSql`
        UPDATE public.events
        SET vritt_attendance_count = COALESCE(vritt_attendance_count, 0) + 1
        WHERE id = ${eventId}
        RETURNING id
      `,
  },
  {
    name: "event_vritt.checked_in_count",
    hint: "event_vritt",
    run: async (runSql, eventId) =>
      runSql`
        INSERT INTO public.event_vritt (event_id, checked_in_count, updated_at)
        VALUES (${eventId}, 1, now())
        ON CONFLICT (event_id)
        DO UPDATE SET
          checked_in_count = COALESCE(public.event_vritt.checked_in_count, 0) + 1,
          updated_at = now()
        RETURNING event_id
      `,
  },
];

async function incrementPublicCheckInCount(
  runSql: NeonSql,
  eventId: string,
): Promise<{ ok: true; via: string } | { ok: false; error: string }> {
  for (const strategy of strategies) {
    try {
      const rows = await strategy.run(runSql, eventId);
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

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateRes = withPublicRateLimit(clientIp);
  if (rateRes) return rateRes;

  if (!sql) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const { eventId } = await params;
    if (!UUID_RE.test(eventId)) return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });

    const statusRows = await sql`SELECT status FROM public.events WHERE id = ${eventId} LIMIT 1`;
    const event = firstReturnedRow(statusRows) as { status?: string } | undefined;
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    if (event.status !== "authorized_public" && event.status !== "published") {
      return NextResponse.json({ error: "Event is not open for check-in." }, { status: 403 });
    }

    const inc = await incrementPublicCheckInCount(sql, eventId);
    if (!inc.ok) {
      return NextResponse.json({ error: inc.error }, { status: 503 });
    }

    return NextResponse.json({ ok: true, via: inc.via });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
