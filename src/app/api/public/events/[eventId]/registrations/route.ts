import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";
import { publicRegistrationSchema } from "@/lib/validators/events";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";

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
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateRes = withPublicRateLimit(clientIp);
  if (rateRes) return rateRes;

  if (!sql) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const { eventId } = await params;
    if (!isValidUuid(eventId)) return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });

    const body = await req.json();
    const parsed = publicRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Invalid registration payload." }, { status: 400 });
    }
    const input = parsed.data;

    // Fetch event + form config to enforce constraints
    const eventRows = await sql`SELECT status FROM public.events WHERE id = ${eventId} LIMIT 1`;
    const eventStatus = (eventRows as Array<{ status: string }>)[0]?.status;
    if (!["authorized_public", "published"].includes(eventStatus)) {
      return NextResponse.json({ error: "Registration is not open for this event." }, { status: 403 });
    }

    const configRows = await sql`
      SELECT is_enabled, is_public, allow_multiple_submissions, max_registrations, opens_at, closes_at
      FROM public.event_form_configs
      WHERE event_id = ${eventId}
      LIMIT 1
    `;
    const config = (configRows as Array<{
      is_enabled: boolean;
      is_public: boolean;
      allow_multiple_submissions: boolean;
      max_registrations: number | null;
      opens_at: string | null;
      closes_at: string | null;
    }>)[0];

    if (!config || !config.is_enabled || !config.is_public) {
      return NextResponse.json({ error: "Registration is not open for this event." }, { status: 403 });
    }

    const now = new Date();
    if (config.opens_at && new Date(config.opens_at) > now) {
      return NextResponse.json({ error: "Registration has not opened yet." }, { status: 403 });
    }
    if (config.closes_at && new Date(config.closes_at) < now) {
      return NextResponse.json({ error: "Registration has closed." }, { status: 403 });
    }

    // Capacity check
    if (config.max_registrations != null) {
      const countRows = await sql`SELECT COUNT(*)::int AS total FROM public.event_registrations WHERE event_id = ${eventId}`;
      const currentCount = (countRows as Array<{ total: number }>)[0]?.total ?? 0;
      if (currentCount >= config.max_registrations) {
        return NextResponse.json({ error: "This event is full. Registration is closed." }, { status: 403 });
      }
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent");
    const hash = createHash("sha256").update(`${eventId}:${input.name}:${input.phone ?? ""}:${input.city ?? ""}`).digest("hex");

    // Duplicate check
    if (!config.allow_multiple_submissions) {
      const dupRows = await sql`SELECT id FROM public.event_registrations WHERE event_id = ${eventId} AND public_submission_key_hash = ${hash} LIMIT 1`;
      if ((dupRows as Array<{ id: string }>).length > 0) {
        return NextResponse.json({ error: "You have already registered for this event." }, { status: 409 });
      }
    }

    const result = await sql`
      INSERT INTO public.event_registrations (event_id, name, phone, city, attending_count, has_special_needs, notes, public_submission_key_hash, submitted_from_ip, submitted_user_agent)
      VALUES (${eventId}, ${input.name.trim()}, ${input.phone?.trim() || null}, ${input.city?.trim() || null}, ${Math.max(1, input.attendingCount ?? 1)}, ${Boolean(input.hasSpecialNeeds)}, ${input.notes?.trim() || null}, ${hash}, ${ip}, ${ua})
      RETURNING id
    `;

    const registrationId = result[0]?.id as string | undefined;
    const customAnswers = input.customAnswers ?? input.answers ?? null;

    if (registrationId && customAnswers) {
      for (const [questionKey, answer] of Object.entries(customAnswers)) {
        if (!questionKey || typeof answer !== "string" || !answer.trim()) continue;
        await sql`
          INSERT INTO public.event_registration_answers (registration_id, event_id, question_key, answer)
          VALUES (${registrationId}, ${eventId}, ${questionKey}, ${answer.trim()})
        `;
      }
    }

    return NextResponse.json({ ok: true, registrationId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
