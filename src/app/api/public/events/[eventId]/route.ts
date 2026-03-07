import { NextResponse } from "next/server";
import { getPublicEventPageData } from "@/lib/server/app-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase env is not configured." }, { status: 503 });
  }

  try {
    const { eventId } = await params;
    const data = await getPublicEventPageData(eventId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load event.";
    const status = /not available/i.test(message) ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

