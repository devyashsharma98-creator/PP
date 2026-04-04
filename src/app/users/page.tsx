"use client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import UserManagement from "@/components/pages/UserManagement";
export default function UsersPage() {
  return <ErrorBoundary><UserManagement /></ErrorBoundary>;
}
