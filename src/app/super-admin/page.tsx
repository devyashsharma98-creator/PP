import { ErrorBoundary } from "@/components/ErrorBoundary";
import UserManagement from "@/components/pages/UserManagement";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function SuperAdminPage() {
  await requirePageSession("/super-admin");

  return (
    <ErrorBoundary>
      <UserManagement />
    </ErrorBoundary>
  );
}
