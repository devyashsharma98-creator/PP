import { ErrorBoundary } from "@/components/ErrorBoundary";
import CampusUnits from "@/components/pages/CampusUnits";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/ikai");
  return <ErrorBoundary><CampusUnits /></ErrorBoundary>;
}
