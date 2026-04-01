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

  // Skip auth checks for static assets, public paths, or demo/Neon mode
  if (
    isStaticAsset(pathname) ||
    isPublicPath(pathname) ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK === "true" ||
    process.env.NEON_DATABASE_URL
  ) {
    return NextResponse.next();
  }

  // Legacy Supabase auth (when Supabase is configured)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  try {
    const { createServerClient } = await import("@supabase/ssr");
    const response = NextResponse.next({
      request: { headers: req.headers },
    });

    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) return response;

    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("returnTo", `${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(redirectUrl);
  } catch {
    // If Supabase import fails, just allow through
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
