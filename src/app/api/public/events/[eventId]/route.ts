import { NextResponse } from "next/server";
import { getPublicSql, isValidUuid } from "@/lib/server/neon-public";
import {
  fetchPublicEvent,
  PublicEventServiceError,
} from "@/lib/server/services/public-event-service";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const sql = getPublicSql();
  if (!sql) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const { eventId } = await params;
    if (!isValidUuid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID format." }, { status: 400 });
    }

    const data = await fetchPublicEvent(sql, eventId);
    return NextResponse.json(data, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (error) {
    if (error instanceof PublicEventServiceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Public event load failed:", error);
    return NextResponse.json({ error: "Failed to load event." }, { status: 400 });
  }
}
