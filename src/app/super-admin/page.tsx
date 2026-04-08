"use client";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import UserManagement from "@/components/pages/UserManagement";

export default function SuperAdminPage() {
  return (
    <ErrorBoundary>
      <UserManagement />
    </ErrorBoundary>
  );
}
