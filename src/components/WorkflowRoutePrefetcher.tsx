"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAppContext } from "@/context/AppContext";
import { getWorkflowPrefetchRoutes } from "@/lib/app/workflow-prefetch";

export function WorkflowRoutePrefetcher() {
  const pathname = usePathname();
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppContext();

  useEffect(() => {
    if (!authReady) return;
    for (const route of getWorkflowPrefetchRoutes(pathname, isAuthenticated)) {
      router.prefetch(route);
    }
  }, [authReady, isAuthenticated, pathname, router]);

  return null;
}
