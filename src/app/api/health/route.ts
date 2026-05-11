import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const health: Record<string, string | number> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "pragya-pravah-app",
    version: process.env.npm_package_version || "1.0.0",
    node_env: process.env.NODE_ENV || "unknown",
  };

  const statusCode = health.status === "ok" ? 200 : 503;
  return NextResponse.json(health, { status: statusCode });
}
