import { Suspense } from "react";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TaskBoardPanel } from "@/components/pages/dashboard/tasks/TaskBoardPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Carry the deep link through sign-in: a reminder links to an exact task.
  await requirePageSession("/task-board", { search: await searchParams });
  return (
    <ErrorBoundary>
      {/* The panel reads its selection and filters from the query string. */}
      <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
        <TaskBoardPanel />
      </Suspense>
    </ErrorBoundary>
  );
}
