import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PrajnaDashboard } from "@/components/pages/PrajnaDashboard";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function DashboardPage() {
  await requirePageSession("/dashboard");

  return (
    <ErrorBoundary>
      <PrajnaDashboard />
    </ErrorBoundary>
  );
}
