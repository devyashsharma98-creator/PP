import { NextRequest, NextResponse } from "next/server";

const PUBLIC_EXACT_PATHS = new Set([
  "/login",
  "/parichay",
  "/history",
  "/vimarsh",
  "/library",
  "/feed",
]);

const PUBLIC_PREFIXES = ["/form/", "/vote/", "/api/public/"];

const SESSION_COOKIE = process.env.SESSION_COOKIE_NAME ?? "pp_session";
const NEON_SESSION_COOKIE = "pp_neon_session";

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

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip auth checks for static assets and public paths
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return noStore(NextResponse.next());
  }

  // For API routes, let the route handler deal with auth (returns 401)
  if (isApiPath(pathname)) {
    return NextResponse.next();
  }

  // For protected pages: check if session cookie exists
  const sessionCookie =
    req.cookies.get(SESSION_COOKIE)?.value ??
    req.cookies.get(NEON_SESSION_COOKIE)?.value;
  const demoFallback = process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK === "true";

  // If no session cookie AND demo fallback is disabled, redirect to login
  if (!sessionCookie && !demoFallback) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("returnTo", pathname);
    return noStore(NextResponse.redirect(loginUrl));
  }

  return noStore(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
