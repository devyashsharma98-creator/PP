import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase env is not configured." }, { status: 503 });
  }

  try {
    const { eventId } = await params;
    if (!UUID_RE.test(eventId)) {
      return NextResponse.json({ error: "Invalid event ID format." }, { status: 400 });
    }
    const supabase = getSupabaseAdminClient();

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

    const currentCount = eventAny.vritt_checked_in_count || 0;
    const { error: updateError } = await supabase
      .from("events")
      .update({ vritt_checked_in_count: currentCount + 1 } as any)
      .eq("id", eventId)
      .eq("vritt_checked_in_count", currentCount);

    if (updateError) {
      if ((updateError as any).code === 'PGRST116' || (updateError as any).code === '21000') {
        return NextResponse.json({ error: "Check-in conflict — please retry." }, { status: 409 });
      }
      throw updateError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Check-in failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
