import { NextRequest, NextResponse } from "next/server";
import { requireNeonAuthContext, isNeonAuthRequiredError } from "@/lib/neon/auth";
import { getBootstrapPayload } from "@/lib/neon/repository";
import { isDatabaseConfigured } from "@/lib/neon/env";

const emptyBootstrapPayload = {
  events: [],
  articles: [],
  pracharStatuses: [],
  vimarshTopics: [],
  notifications: [],
  viewer: null,
};

export async function GET(req: NextRequest) {
  if (!isDatabaseConfigured) {
    return NextResponse.json(
      { error: "Neon database is not configured." },
      { status: 503 },
    );
  }

  try {
    const auth = await requireNeonAuthContext(req);
    const data = await getBootstrapPayload(auth);
    return NextResponse.json(data);
  } catch (error) {
    if (isNeonAuthRequiredError(error)) {
      return NextResponse.json(emptyBootstrapPayload);
    }
    const message = error instanceof Error ? error.message : "Failed to load bootstrap data.";
    console.error("Bootstrap error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
