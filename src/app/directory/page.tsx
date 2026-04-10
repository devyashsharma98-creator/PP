import { ErrorBoundary } from "@/components/ErrorBoundary";
import Directory from "@/components/pages/Directory";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/directory");
  return <ErrorBoundary><Directory /></ErrorBoundary>;
}
