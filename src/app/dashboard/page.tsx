"use client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Dashboard from "@/components/pages/Dashboard";
export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
