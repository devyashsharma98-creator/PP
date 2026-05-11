"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import { BonsaiProvider } from "@/context/BonsaiContext";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      if (
        process.env.NODE_ENV === "production" &&
        process.env.NEXT_PUBLIC_TEST_ENV !== "true"
      ) {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("Service Worker registration failed:", err);
        });
      } else {
        // Unregister service workers in dev to prevent stale caches
        navigator.serviceWorker.getRegistrations().then((regs) => {
          regs.forEach((reg) => reg.unregister());
        });
      }
    }
  }, []);

  return (
    <BonsaiProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <MotionConfig reducedMotion="user">
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <AppProvider>
                {children}
              </AppProvider>
            </TooltipProvider>
          </QueryClientProvider>
        </MotionConfig>
      </ThemeProvider>
    </BonsaiProvider>
  );
}
