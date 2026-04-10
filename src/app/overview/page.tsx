import { ErrorBoundary } from "@/components/ErrorBoundary";
import Launchpad from "@/components/pages/Launchpad";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function OverviewPage() {
  await requirePageSession("/overview");

  return (
    <ErrorBoundary>
      <Launchpad />
    </ErrorBoundary>
  );
}
