"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { Navbar } from "@/components/Navbar";
import { PageTransition } from "@/components/PageTransition";

const FULL_BLEED_PUBLIC_PATHS = new Set(["/", "/login"]);
const PADDED_PUBLIC_PATHS = new Set(["/parichay", "/directory", "/vimarsh"]);

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFullBleedPublicRoute = FULL_BLEED_PUBLIC_PATHS.has(pathname);
  const isPaddedPublicRoute = PADDED_PUBLIC_PATHS.has(pathname);

  if (isFullBleedPublicRoute) {
    return (
      <main className="min-h-screen overflow-x-hidden">
        <PageTransition>{children}</PageTransition>
      </main>
    );
  }

  if (isPaddedPublicRoute) {
    return (
      <main className="min-h-screen overflow-x-hidden bg-background">
        <PageTransition>
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 md:py-8">
            {children}
          </div>
        </PageTransition>
      </main>
    );
  }

  return (
    <>
      <div className="app-frame flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="app-main-shell flex-1 overflow-y-auto px-4 pb-20 pt-5 md:px-6 md:pb-6 md:pt-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}
