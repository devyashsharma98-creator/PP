import { ErrorBoundary } from "@/components/ErrorBoundary";
import { TaskBoardPanel } from "@/components/pages/dashboard/tasks/TaskBoardPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/task-board");
  return <ErrorBoundary><TaskBoardPanel /></ErrorBoundary>;
}
