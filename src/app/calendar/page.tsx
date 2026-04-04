"use client";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import AnnualCalendar from "@/components/pages/AnnualCalendar";
export default function Page() { return <ErrorBoundary><AnnualCalendar /></ErrorBoundary>; }
