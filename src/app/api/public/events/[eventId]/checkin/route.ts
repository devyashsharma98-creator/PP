import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isMissingDbObjectError(err: unknown, hint: string) {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("does not exist") && msg.includes(hint);
}

type NeonSql = NonNullable<typeof sql>;

function firstReturnedRow(rows: unknown): unknown {
  return Array.isArray(rows) ? rows[0] : undefined;
}

/** Increment check-in count across schema variants (phase3 column, Bhopal column, or Drizzle event_vritt). */
async function incrementPublicCheckInCount(
  runSql: NeonSql,
  eventId: string,
): Promise<{ ok: true; via: string } | { ok: false; error: string }> {
  try {
    const rows = await runSql`
      UPDATE public.events
      SET vritt_checked_in_count = COALESCE(vritt_checked_in_count, 0) + 1
      WHERE id = ${eventId}
      RETURNING id
    `;
    if (firstReturnedRow(rows)) return { ok: true, via: "events.vritt_checked_in_count" };
  } catch (err) {
    if (!isMissingDbObjectError(err, "vritt_checked_in_count")) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  try {
    const rows = await runSql`
      UPDATE public.events
      SET vritt_attendance_count = COALESCE(vritt_attendance_count, 0) + 1
      WHERE id = ${eventId}
      RETURNING id
    `;
    if (firstReturnedRow(rows)) return { ok: true, via: "events.vritt_attendance_count" };
  } catch (err) {
    if (!isMissingDbObjectError(err, "vritt_attendance_count")) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  try {
    const rows = await runSql`
      INSERT INTO public.event_vritt (event_id, checked_in_count, updated_at)
      VALUES (${eventId}, 1, now())
      ON CONFLICT (event_id)
      DO UPDATE SET
        checked_in_count = COALESCE(public.event_vritt.checked_in_count, 0) + 1,
        updated_at = now()
      RETURNING event_id
    `;
    if (firstReturnedRow(rows)) return { ok: true, via: "event_vritt.checked_in_count" };
  } catch (err) {
    if (!isMissingDbObjectError(err, "event_vritt")) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
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
