"use client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ContentFeed from "@/components/pages/ContentFeed";
export default function Page() { return <ErrorBoundary><ContentFeed /></ErrorBoundary>; }
