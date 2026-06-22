import { ErrorBoundary } from "@/components/ErrorBoundary";
import { VolunteersPanel } from "@/components/pages/dashboard/volunteers/VolunteersPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/volunteers");
  return <ErrorBoundary><VolunteersPanel /></ErrorBoundary>;
}
