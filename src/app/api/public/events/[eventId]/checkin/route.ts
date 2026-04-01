import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
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

    const currentCount = event.vritt_checked_in_count || 0;
    await sql`UPDATE public.events SET vritt_checked_in_count = ${currentCount + 1} WHERE id = ${eventId} AND vritt_checked_in_count = ${currentCount}`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
