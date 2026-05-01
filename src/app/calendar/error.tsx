"use client";

import { useT } from "@/lib/useT";

export default function CalendarError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold">{t("Unable to load calendar", "कैलेंडर लोड करने में असफल")}</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
      >
        {t("Try again", "पुनः प्रयास करें")}
      </button>
    </div>
  );
}
