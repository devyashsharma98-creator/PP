import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);
const sql = isNeonConfigured ? neon(process.env.NEON_DATABASE_URL!) : null;

function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  if (!sql) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const { eventId } = await params;
    if (!isValidUuid(eventId)) return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });

    const body = await req.json();
    if (!body?.name?.trim()) return NextResponse.json({ error: "Name is required." }, { status: 400 });

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent");
    const hash = createHash("sha256").update(`${eventId}:${body.name}:${body.phone ?? ""}:${body.city ?? ""}`).digest("hex");

    const result = await sql`
      INSERT INTO public.event_registrations (event_id, name, phone, city, attending_count, has_special_needs, notes, answers_payload, public_submission_key_hash, submitted_from_ip, submitted_user_agent)
      VALUES (${eventId}, ${body.name.trim()}, ${body.phone?.trim() || null}, ${body.city?.trim() || null}, ${Math.max(1, body.attendingCount ?? 1)}, ${Boolean(body.hasSpecialNeeds)}, ${body.notes?.trim() || null}, ${JSON.stringify(body.customAnswers ?? {})}, ${hash}, ${ip}, ${ua})
      RETURNING id
    `;

    return NextResponse.json({ ok: true, registrationId: result[0].id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

