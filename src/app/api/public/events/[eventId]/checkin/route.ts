import { NextResponse } from "next/server";
import { withPublicRateLimit } from "@/lib/middleware/rate-limit";
import { publicErrorMessage } from "@/lib/public-events";
import { getPublicSql, isValidUuid } from "@/lib/server/neon-public";
import {
  checkInToEvent,
  PublicEventServiceError,
} from "@/lib/server/services/public-event-service";

export async function POST(
  req: Request,
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

    const { via } = await checkInToEvent(sql, eventId);
    return NextResponse.json({ ok: true, via });
  } catch (error) {
    if (error instanceof PublicEventServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Public check-in failed:", error);
    return NextResponse.json(
      { error: publicErrorMessage(error, "Check-in failed.") },
      { status: 400 },
    );
  }
}
