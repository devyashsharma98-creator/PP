import { ErrorBoundary } from "@/components/ErrorBoundary";
import Impact from "@/components/pages/Impact";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/impact");
  return <ErrorBoundary><Impact /></ErrorBoundary>;
}
