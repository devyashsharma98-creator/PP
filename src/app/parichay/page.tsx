"use client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ParichayPage from "@/components/parichay/ParichayPage";
export default function Page() {
  return (
    <ErrorBoundary>
      <ParichayPage />
    </ErrorBoundary>
  );
}
