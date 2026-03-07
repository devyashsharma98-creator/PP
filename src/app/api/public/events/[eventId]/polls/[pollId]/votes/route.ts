import { NextRequest, NextResponse } from "next/server";
import type { PublicVoteRequest } from "@/lib/app/contracts";
import { submitPublicVote } from "@/lib/server/app-repository";
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
  { params }: { params: Promise<{ eventId: string; pollId: string }> },
) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase env is not configured." }, { status: 503 });
  }

  try {
    const { eventId, pollId } = await params;
    const body = (await req.json()) as PublicVoteRequest;
    if (!body?.optionId) {
      return NextResponse.json({ error: "optionId is required." }, { status: 400 });
    }
    const result = await submitPublicVote(eventId, pollId, body, requestMeta(req));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Vote submission failed.";
    const status = /duplicate/i.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
