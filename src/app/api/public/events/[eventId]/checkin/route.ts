import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase env is not configured." }, { status: 503 });
  }

  try {
    const { eventId } = await params;
    const supabase = getSupabaseAdminClient();

    // 1. Verify event exists and is published
    const { data: event, error: fetchError } = await supabase
      .from("events")
      .select("id, status, vritt_checked_in_count")
      .eq("id", eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const eventAny = event as any;

    if (eventAny.status !== "authorized_public" && eventAny.status !== "published") {
      return NextResponse.json({ error: "Event is not open for check-in." }, { status: 403 });
    }

    // 2. Increment check-in count
    const { error: updateError } = await supabase
      .from("events")
      .update({
        vritt_checked_in_count: (eventAny.vritt_checked_in_count || 0) + 1,
      } as any)
      .eq("id", eventId);

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
