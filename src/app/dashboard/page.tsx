import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/components/pages/Dashboard";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function DashboardPage() {
  await requirePageSession("/dashboard");

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
