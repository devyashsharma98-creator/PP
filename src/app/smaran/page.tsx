import { ErrorBoundary } from "@/components/ErrorBoundary";
import Smaran from "@/components/pages/Smaran";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/smaran");
  return <ErrorBoundary><Smaran /></ErrorBoundary>;
}
