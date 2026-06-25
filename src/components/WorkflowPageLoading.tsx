import { Skeleton } from "@/components/Skeletons";
import { cn } from "@/lib/utils";

export function WorkflowPageLoading({ title = "Loading workspace", compact = false }: { title?: string; compact?: boolean }) {
  return (
    <div className="space-y-5 md:space-y-6" aria-busy="true" aria-live="polite">
      <section className="institution-panel overflow-hidden p-5 md:p-7">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="section-seal w-fit">Workspace</div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-12 w-36 rounded-2xl" />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: compact ? 3 : 6 }).map((_, index) => (
          <div key={index} data-workflow-loading-card className="institution-panel-muted space-y-4 p-5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </section>

      <section className={cn("grid gap-4", compact ? "md:grid-cols-2" : "lg:grid-cols-[1.35fr_0.65fr]") }>
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </section>
    </div>
  );
}
