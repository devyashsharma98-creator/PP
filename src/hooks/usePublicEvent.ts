"use client";

import { useEffect, useState } from "react";
import type { GatividhiEvent } from "@/context/AppContext";

interface UsePublicEventResult {
  event: GatividhiEvent | null;
  loading: boolean;
  error: string | null;
  setEvent: React.Dispatch<React.SetStateAction<GatividhiEvent | null>>;
}

export function usePublicEvent(
  eventId: string,
  contextEvent: GatividhiEvent | undefined,
): UsePublicEventResult {
  const [publicEvent, setPublicEvent] = useState<GatividhiEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contextEvent) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/public/events/${eventId}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Failed to load event.");
        }
        return res.json() as Promise<{ event: GatividhiEvent }>;
      })
      .then((data) => {
        if (!cancelled) setPublicEvent(data.event);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load event.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contextEvent, eventId]);

  return {
    event: contextEvent ?? publicEvent,
    loading,
    error,
    setEvent: setPublicEvent,
  };
}
