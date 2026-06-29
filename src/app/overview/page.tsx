import { requirePageSession } from "@/lib/server/require-page-session";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Overview from "@/components/pages/Overview";

export default async function OverviewPage() {
  await requirePageSession("/overview");
  return <ErrorBoundary><Overview /></ErrorBoundary>;
}
