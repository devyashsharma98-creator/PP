import { ErrorBoundary } from "@/components/ErrorBoundary";
import UserManagement from "@/components/pages/UserManagement";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function UsersPage() {
  await requirePageSession("/users");

  return <ErrorBoundary><UserManagement /></ErrorBoundary>;
}
