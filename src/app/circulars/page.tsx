import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CircularsPanel } from "@/components/pages/dashboard/circulars/CircularsPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/circulars");
  return <ErrorBoundary><CircularsPanel /></ErrorBoundary>;
}
