import { NextResponse } from "next/server";
import { NEON_SESSION_COOKIE } from "@/lib/neon/session";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(NEON_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

