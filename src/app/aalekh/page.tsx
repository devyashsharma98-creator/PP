import { ErrorBoundary } from "@/components/ErrorBoundary";
import Aalekh from "@/components/pages/Aalekh";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function AalekhPage() {
  await requirePageSession("/aalekh");

  return <ErrorBoundary><Aalekh /></ErrorBoundary>;
}
