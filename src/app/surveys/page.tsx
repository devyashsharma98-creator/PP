import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SurveysPanel } from "@/components/pages/dashboard/surveys/SurveysPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/surveys");
  return <ErrorBoundary><SurveysPanel /></ErrorBoundary>;
}
