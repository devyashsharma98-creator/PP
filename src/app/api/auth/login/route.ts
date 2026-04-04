import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { createSessionToken, NEON_SESSION_COOKIE } from "@/lib/neon/session";
import { getDatabaseUrl, isDatabaseConfigured } from "@/lib/neon/env";

const dbUrl = getDatabaseUrl();
const sql = dbUrl ? neon(dbUrl) : null;

export async function POST(req: NextRequest) {
  if (!isDatabaseConfigured || !sql) {
    return NextResponse.json({ error: "Neon database is not configured." }, { status: 503 });
  }

  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const expectedPassword = process.env.APP_LOGIN_PASSWORD || "Password123!";
    if (password !== expectedPassword) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const profileRows = await sql`
      select id, email, is_active
      from public.profiles
      where lower(email) = ${email}
      limit 1
    `;
    const profile = (profileRows as Array<{ id: string; email: string | null; is_active: boolean }>)[0];
    if (!profile || !profile.is_active) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = createSessionToken(profile.id, profile.email ?? email);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(NEON_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
