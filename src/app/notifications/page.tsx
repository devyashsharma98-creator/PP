import { ErrorBoundary } from "@/components/ErrorBoundary";
import { NotificationsPanel } from "@/components/pages/dashboard/notifications/NotificationsPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/notifications");
  return <ErrorBoundary><NotificationsPanel /></ErrorBoundary>;
}
