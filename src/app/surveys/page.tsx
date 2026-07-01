import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SurveysPanel } from "@/components/pages/dashboard/surveys/SurveysPanel";
import { SurveyFillForm } from "@/components/pages/dashboard/surveys/SurveyFillForm";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  await requirePageSession("/surveys");
  const sp = await searchParams;
  const surveyId = sp?.s ?? null;
  if (surveyId) {
    return <ErrorBoundary><SurveyFillForm surveyId={surveyId} /></ErrorBoundary>;
  }
  return <ErrorBoundary><SurveysPanel /></ErrorBoundary>;
}
