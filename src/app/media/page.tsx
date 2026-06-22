import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MediaLibraryPanel } from "@/components/pages/dashboard/media/MediaLibraryPanel";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/media");
  return <ErrorBoundary><MediaLibraryPanel /></ErrorBoundary>;
}
