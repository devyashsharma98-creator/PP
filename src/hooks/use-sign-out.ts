"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** Clears server session (best-effort) and returns the user to the public landing page. */
export function useSignOut() {
  const router = useRouter();

  return useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Best-effort
    } finally {
      router.push("/parichay");
      router.refresh();
    }
  }, [router]);
}
