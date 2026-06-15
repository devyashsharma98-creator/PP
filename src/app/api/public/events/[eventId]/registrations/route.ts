import { NextRequest, NextResponse } from "next/server";
import { publicRegistrationSchema } from "@/lib/validators/events";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";
import { publicErrorMessage } from "@/lib/public-events";
import { getPublicSql, isValidUuid } from "@/lib/server/neon-public";
import {
  createPublicRegistration,
  PublicEventServiceError,
} from "@/lib/server/services/public-event-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateRes = withPublicRateLimit(clientIp);
  if (rateRes) return rateRes;

  const sql = getPublicSql();
  if (!sql) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const { eventId } = await params;
    if (!isValidUuid(eventId)) return NextResponse.json({ error: "Invalid event ID." }, { status: 400 });

    const body = await req.json();
    const parsed = publicRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid registration payload." },
        { status: 400 },
      );
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? null;
    const ua = req.headers.get("user-agent");

    const { registrationId } = await createPublicRegistration(sql, eventId, parsed.data, { ip, ua });
    return NextResponse.json({ ok: true, registrationId });
  } catch (error) {
    if (error instanceof PublicEventServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Public registration failed:", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "Registration failed.") },
      { status: 400 },
    );
  }
}
