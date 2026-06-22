import { ErrorBoundary } from "@/components/ErrorBoundary";
import PracharVishleshan from "@/components/pages/PracharVishleshan";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/prachar-vishleshan");
  return <ErrorBoundary><PracharVishleshan /></ErrorBoundary>;
}
