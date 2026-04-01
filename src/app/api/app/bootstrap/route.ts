import { NextResponse } from "next/server";
import { getDemoAuthContext } from "@/lib/neon/auth";
import { getBootstrapPayload } from "@/lib/neon/repository";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);

export async function GET() {
  if (!isNeonConfigured) {
    return NextResponse.json(
      { error: "Neon database is not configured." },
      { status: 503 },
    );
  }

  try {
    const auth = await getDemoAuthContext();
    const data = await getBootstrapPayload(auth);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load bootstrap data.";
    console.error("Bootstrap error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
