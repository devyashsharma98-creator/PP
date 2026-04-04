"use client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ELibrary from "@/components/pages/ELibrary";
export default function Page() { return <ErrorBoundary><ELibrary /></ErrorBoundary>; }
