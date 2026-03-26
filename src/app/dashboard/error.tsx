"use client";
export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">{error.message || "Failed to load dashboard."}</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90">Try again</button>
    </div>
  );
}
