import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

    const rows = await sql`SELECT status, vritt_checked_in_count FROM public.events WHERE id = ${eventId} LIMIT 1`;
    const event = rows[0];
    if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    if (event.status !== "authorized_public" && event.status !== "published") {
      return NextResponse.json({ error: "Event is not open for check-in." }, { status: 403 });
    }

    const updatedRows = await sql`
      UPDATE public.events
      SET vritt_checked_in_count = COALESCE(vritt_checked_in_count, 0) + 1
      WHERE id = ${eventId}
      RETURNING vritt_checked_in_count
    `;
    if (!updatedRows[0]) {
      return NextResponse.json({ error: "Check-in update failed." }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
