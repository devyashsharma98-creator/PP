import { NextRequest, NextResponse } from "next/server";
import type { AppActionRequest } from "@/lib/app/contracts";
import { runAppAction } from "@/lib/server/app-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireRequestAuthContext } from "@/lib/server/auth-context";
import { assertCanReadInternalBootstrap } from "@/lib/server/permissions";
import { isAuthRequiredError, isForbiddenError } from "@/lib/server/errors";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "Supabase env is not configured." }, { status: 503 });
  }

  try {
    const auth = await requireRequestAuthContext();
    assertCanReadInternalBootstrap(auth);
    const body = (await req.json()) as AppActionRequest;
    const result = await runAppAction(auth, body);
    return NextResponse.json(result);
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (isForbiddenError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "App action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
