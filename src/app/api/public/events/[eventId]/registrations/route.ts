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

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent");
    const hash = createHash("sha256").update(`${eventId}:${input.name}:${input.phone ?? ""}:${input.city ?? ""}`).digest("hex");

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
