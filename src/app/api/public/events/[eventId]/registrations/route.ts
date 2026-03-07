import { NextRequest, NextResponse } from "next/server";
import type { PublicRegistrationRequest } from "@/lib/app/contracts";
import { submitPublicRegistration } from "@/lib/server/app-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";

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
    const body = (await req.json()) as PublicRegistrationRequest;
    if (!body?.name?.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    const result = await submitPublicRegistration(eventId, body, requestMeta(req));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

