import { NextRequest, NextResponse } from "next/server";
import { requireNeonAuthContext, isNeonAuthRequiredError } from "@/lib/neon/auth";
import { runNeonAppAction } from "@/lib/neon/repository";
import { isDatabaseConfigured } from "@/lib/neon/env";
import type { AppActionRequest } from "@/lib/app/contracts";

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  try {
    const auth = await requireNeonAuthContext(req);
    const body = (await req.json()) as AppActionRequest;
    const result = await runNeonAppAction(auth, body);
    return NextResponse.json(result);
  } catch (error) {
    if (isNeonAuthRequiredError(error)) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "App action failed.";
    console.error("Action error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
