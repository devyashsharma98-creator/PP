/**
 * @deprecated Use `/api/v1/*` REST endpoints instead. This legacy action router
 * is maintained for backward compatibility during the migration period.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireNeonAuthContext, isNeonAuthRequiredError } from "@/lib/neon/auth";
import { runNeonAppAction } from "@/lib/neon/repository";
import { isDatabaseConfigured } from "@/lib/neon/env";
import type { AppActionRequest } from "@/lib/app/contracts";
import { appActionSchema } from "@/lib/validators/app-actions";

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  try {
    const auth = await requireNeonAuthContext(req);
    const rawBody = await req.json();

    // ── Zod validation gate ────────────────────────────────────────────────
    const parseResult = appActionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload.", details: parseResult.error.flatten() },
        { status: 422 },
      );
    }

    const result = await runNeonAppAction(auth, parseResult.data as AppActionRequest);
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
