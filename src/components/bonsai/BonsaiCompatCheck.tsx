"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export function BonsaiCompatCheck() {
  const [dismissed, setDismissed] = useState(true); // start hidden, reveal after check

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      "gpu" in navigator &&
      navigator.gpu !== null;
    if (!supported) {
      const key = "bonsai_compat_dismissed";
      if (!sessionStorage.getItem(key)) {
        setDismissed(false);
      }
    }
  }, []);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-3 flex items-start gap-2.5 text-xs">
      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-700 dark:text-amber-300">
          Lekhan Sahayak requires Chrome or Edge 113+
        </p>
        <p className="text-amber-800/80 dark:text-amber-200/70 mt-0.5">
          Your current browser does not support WebGPU. AI writing assistance is unavailable.
        </p>
      </div>
      <button
        onClick={() => {
          sessionStorage.setItem("bonsai_compat_dismissed", "1");
          setDismissed(true);
        }}
        className="text-amber-600/60 hover:text-amber-600 shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
