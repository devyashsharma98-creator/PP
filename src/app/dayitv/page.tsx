import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dayitv from "@/components/pages/Dayitv";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/dayitv");
  return <ErrorBoundary><Dayitv /></ErrorBoundary>;
}
