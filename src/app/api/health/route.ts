import { NextResponse } from "next/server";
import { getDatabaseUrl } from "@/lib/neon/env";

export async function GET() {
  const dbUrl = getDatabaseUrl();
  const dbStatus = dbUrl ? "configured" : "MISSING";
  
  return NextResponse.json({
    status: "healthy",
    deployment: "hostinger-optimized",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_CONFIG: dbStatus,
      // Masking the secret
      DATABASE_PREFIX: dbUrl ? dbUrl.substring(0, 15) + "..." : null,
      PORT: process.env.PORT || "default-3000",
    },
    timestamp: new Date().toISOString(),
  });
}
