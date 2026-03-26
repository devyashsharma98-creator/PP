import { NextResponse } from "next/server";
import { getPublicEventPageData } from "@/lib/server/app-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase env is not configured." }, { status: 503 });
  }

  try {
    const { eventId } = await params;
    if (!isValidUuid(eventId)) {
      return NextResponse.json({ error: "Invalid event ID format." }, { status: 400 });
    }
    const data = await getPublicEventPageData(eventId);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load event.";
    const status = /not available/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

