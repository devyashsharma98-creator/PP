"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { Skeleton } from "@/components/Skeletons";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";

const FULL_BLEED_PUBLIC_PATHS = new Set(["/login", "/parichay"]);
const PADDED_PUBLIC_PATHS = new Set(["/vimarsh", "/library", "/feed", "/history", "/guide"]);
const PADDED_PUBLIC_PREFIXES = ["/form/", "/vote/"];

function isPaddedPublicPath(pathname: string) {
  return PADDED_PUBLIC_PATHS.has(pathname) || PADDED_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function AppLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { authReady, isAuthenticated, lang } = useAppContext();
  const t = useT();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isFullBleedPublicRoute = FULL_BLEED_PUBLIC_PATHS.has(pathname);
  const isGuestRootEntry = pathname === "/" && !isAuthenticated;
  const isPaddedPublicRoute = isPaddedPublicPath(pathname);

  // During SSR and initial hydration, render full-bleed to avoid any mismatch.
  // After mount, apply the correct layout based on the actual route.
  if (!mounted || isFullBleedPublicRoute || isGuestRootEntry) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen overflow-x-hidden bg-background" suppressHydrationWarning>
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  if (isPaddedPublicRoute) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen overflow-x-hidden bg-background" suppressHydrationWarning>
        <PageTransition>
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8 md:py-12 pb-32 md:pb-12">
            {children}
          </div>
        </PageTransition>
      </main>
    );
  }

  if (!authReady) {
    return (
      <main id="main-content" tabIndex={-1} className="app-main-shell min-h-screen overflow-y-auto px-4 pb-32 pt-8 md:px-6 md:pb-8 md:pt-12">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-5xl items-center justify-center">
          <div className="institution-panel w-full max-w-3xl space-y-6 px-6 py-8 md:px-8">
            <div className="space-y-2">
              <p className="section-seal">
                {t("Internal institutional console", "आंतरिक संस्थागत कंसोल")}
              </p>
              <h1 className={lang === "hi" ? "text-2xl font-semibold tracking-tight font-devanagari" : "text-2xl font-semibold tracking-tight"}>
                {t("Loading workspace…", "कार्यक्षेत्र लोड हो रहा है…")}
              </h1>
              <p className={lang === "hi" ? "text-sm text-muted-foreground font-devanagari leading-relaxed" : "text-sm text-muted-foreground leading-relaxed"}>
                {t(
                  "Securing your session and loading the correct role lane.",
                  "आपका सत्र सुरक्षित कर रहे हैं और सही भूमिका धारा तैयार कर रहे हैं।",
                )}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
              <Skeleton className="h-28 rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <div className="app-frame flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main id="main-content" tabIndex={-1} className="app-main-shell flex-1 overflow-y-auto px-4 pb-32 pt-6 md:px-6 md:pb-10 md:pt-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}
