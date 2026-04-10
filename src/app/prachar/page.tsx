import { ErrorBoundary } from "@/components/ErrorBoundary";
import Prachar from "@/components/pages/Prachar";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/prachar");
  return <ErrorBoundary><Prachar /></ErrorBoundary>;
}
