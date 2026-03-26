import { NextRequest, NextResponse } from "next/server";
import type { PublicRegistrationRequest } from "@/lib/app/contracts";
import { submitPublicRegistration } from "@/lib/server/app-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

function isValidUuid(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function requestMeta(req: NextRequest) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  return {
    ip: forwardedFor?.split(",")[0]?.trim() ?? null,
    userAgent: req.headers.get("user-agent"),
  };
}

export async function POST(
  req: NextRequest,
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
    const body = (await req.json()) as PublicRegistrationRequest;
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (body.name.trim().length > 200) {
      return NextResponse.json({ error: "Name must be under 200 characters." }, { status: 400 });
    }
    if (body.phone && !/^[\d\s+-]+$/.test(body.phone)) {
      return NextResponse.json({ error: "Invalid phone format." }, { status: 400 });
    }
    if (body.city && body.city.length > 100) {
      return NextResponse.json({ error: "City must be under 100 characters." }, { status: 400 });
    }
    if (body.attendingCount && (body.attendingCount < 1 || body.attendingCount > 50)) {
      return NextResponse.json({ error: "Attending count must be between 1 and 50." }, { status: 400 });
    }
    const result = await submitPublicRegistration(eventId, body, requestMeta(req));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

