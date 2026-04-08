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

const SESSION_COOKIE = "pp_neon_session";

function isStaticAsset(pathname: string) {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/assets/") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  );
}

function isPublicPath(pathname: string) {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isApiPath(pathname: string) {
  return pathname.startsWith("/api/");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth checks for static assets and public paths
  if (isStaticAsset(pathname) || isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // For API routes, let the route handler deal with auth (returns 401)
  if (isApiPath(pathname)) {
    return NextResponse.next();
  }

  // For protected pages: check if session cookie exists
  const sessionCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const demoFallback = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK === "true";

  // If no session cookie AND demo fallback is disabled, redirect to login
  if (!sessionCookie && !demoFallback) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
