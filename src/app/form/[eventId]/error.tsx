"use client";

import { useT } from "@/lib/useT";

export default function FormError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold">{t("Event not available", "कार्यक्रम उपलब्ध नहीं")}</h2>
      <p className="text-muted-foreground text-sm">{error.message || t("This registration form could not be loaded.", "यह पंजीकरण फ़ॉर्म लोड नहीं किया जा सका।")}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
      >
        {t("Try again", "पुनः प्रयास करें")}
      </button>
    </div>
  );
}
