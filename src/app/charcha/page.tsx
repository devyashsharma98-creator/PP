import { Suspense } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import VimarshCharcha from "@/components/pages/VimarshCharcha";
import { requirePageSession } from "@/lib/server/require-page-session";

export default async function Page() {
  await requirePageSession("/charcha");
  return (
    <ErrorBoundary>
      <Suspense>
        <VimarshCharcha />
      </Suspense>
    </ErrorBoundary>
  );
}
