import { NextRequest, NextResponse } from "next/server";
import { publicVoteSchema } from "@/lib/validators/events";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";
import { publicErrorMessage } from "@/lib/public-events";
import { getPublicSql, isValidUuid } from "@/lib/server/neon-public";
import {
  castPublicVote,
  PublicEventServiceError,
} from "@/lib/server/services/public-event-service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; pollId: string }> },
) {
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateRes = withPublicRateLimit(clientIp);
  if (rateRes) return rateRes;

  const sql = getPublicSql();
  if (!sql) return NextResponse.json({ error: "Database not configured." }, { status: 503 });

  try {
    const { eventId, pollId } = await params;
    if (!isValidUuid(eventId) || !isValidUuid(pollId)) {
      return NextResponse.json({ error: "Invalid ID format." }, { status: 400 });
    }

    const body = await req.json();
    const parsed = publicVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Valid optionId required." },
        { status: 400 },
      );
    }
    const { optionId } = parsed.data;

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";

    await castPublicVote(sql, eventId, pollId, optionId, { ip, ua });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof PublicEventServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: publicErrorMessage(error, "Vote failed.") },
      { status: 400 },
    );
  }
}
