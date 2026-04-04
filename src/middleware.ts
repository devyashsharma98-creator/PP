import { NextRequest, NextResponse } from "next/server";

const PUBLIC_EXACT_PATHS = new Set([
  "/",
  "/login",
  "/parichay",
  "/directory",
  "/history",
  "/vimarsh",
  "/library",
  "/feed",
]);

const PUBLIC_PREFIXES = ["/form/", "/vote/", "/api/public/"];

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth checks for static assets and public paths
  if (isStaticAsset(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // All other paths are open — auth handled per-route via JWT cookies
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
