import { ErrorBoundary } from "@/components/ErrorBoundary";
import AnnualCalendar from "@/components/pages/AnnualCalendar";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/calendar");
  return <ErrorBoundary><AnnualCalendar /></ErrorBoundary>;
}
