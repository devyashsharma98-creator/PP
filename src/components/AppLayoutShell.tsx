"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";
import { Skeleton } from "@/components/Skeletons";
import { useAppContext } from "@/context/AppContext";

const FULL_BLEED_PUBLIC_PATHS = new Set(["/login"]);
const PADDED_PUBLIC_PATHS = new Set(["/parichay", "/vimarsh"]);

type RootHomeMode = "public" | "internal";

export function AppLayoutShell({
  children,
  rootHomeMode = "public",
}: {
  children: React.ReactNode;
  rootHomeMode?: RootHomeMode;
}) {
  const pathname = usePathname();
  const { authReady, viewer } = useAppContext();
  const isAuthenticated = Boolean(viewer);

  const treatRootAsPublic = pathname === "/" && !isAuthenticated && rootHomeMode === "public";
  const isFullBleedPublicRoute = FULL_BLEED_PUBLIC_PATHS.has(pathname) || treatRootAsPublic;
  const isPaddedPublicRoute = PADDED_PUBLIC_PATHS.has(pathname);

  if (isFullBleedPublicRoute) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen overflow-x-hidden">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  if (isPaddedPublicRoute) {
    return (
      <main id="main-content" tabIndex={-1} className="min-h-screen overflow-x-hidden bg-background">
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
              <p className="section-seal">Internal institutional console</p>
              <h1 className="text-2xl font-semibold tracking-tight">Loading dashboard context...</h1>
              <p className="text-sm text-muted-foreground">
                Securing access and preparing the correct dayitva lane.
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
