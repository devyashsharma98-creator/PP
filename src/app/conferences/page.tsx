import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ConferencesPanel } from "@/components/pages/dashboard/conferences/ConferencesPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/conferences");
  return <ErrorBoundary><ConferencesPanel /></ErrorBoundary>;
}
