import { ErrorBoundary } from "@/components/ErrorBoundary";
import Scholars from "@/components/pages/Scholars";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/scholars");
  return <ErrorBoundary><Scholars /></ErrorBoundary>;
}
