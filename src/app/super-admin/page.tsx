import { ErrorBoundary } from "@/components/ErrorBoundary";
import SuperAdminDashboard from "@/components/pages/super-admin/SuperAdminDashboard";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function SuperAdminPage() {
  await requirePageSession("/super-admin");

  return (
    <ErrorBoundary>
      <SuperAdminDashboard />
    </ErrorBoundary>
  );
}
