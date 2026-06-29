"use client";
import { use } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import VishayDetail from "@/components/pages/VishayDetail";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ErrorBoundary><VishayDetail vishayId={id} /></ErrorBoundary>;
}
