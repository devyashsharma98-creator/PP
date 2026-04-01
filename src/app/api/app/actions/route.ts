import { NextRequest, NextResponse } from "next/server";
import { getDemoAuthContext } from "@/lib/neon/auth";

const isNeonConfigured = Boolean(process.env.NEON_DATABASE_URL);

export async function POST(req: NextRequest) {
  if (!isNeonConfigured) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  try {
    const _auth = await getDemoAuthContext();
    const _body = await req.json();
    // Demo mode: acknowledge action but don't persist
    return NextResponse.json({ ok: true, demo: true, message: "Action recorded (demo mode)" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "App action failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
