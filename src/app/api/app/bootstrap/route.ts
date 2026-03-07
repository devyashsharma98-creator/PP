import { NextResponse } from "next/server";
import { getAppBootstrapPayload } from "@/lib/server/app-repository";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireRequestAuthContext } from "@/lib/server/auth-context";
import { assertCanReadInternalBootstrap } from "@/lib/server/permissions";
import { isAuthRequiredError, isForbiddenError } from "@/lib/server/errors";

export async function GET() {
  if (!isSupabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase env is not configured." },
      { status: 503 },
    );
  }

  try {
    const auth = await requireRequestAuthContext();
    assertCanReadInternalBootstrap(auth);
    const data = await getAppBootstrapPayload(auth);
    return NextResponse.json(data);
  } catch (error) {
    if (isAuthRequiredError(error)) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }
    if (isForbiddenError(error)) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Failed to load bootstrap data.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
