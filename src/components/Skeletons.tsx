"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

/** Shimmering skeleton placeholder for loading states */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted/60",
                className
            )}
        />
    );
}

/** Card-shaped skeleton — matches glass-card dimensions */
export function CardSkeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("rounded-xl border border-border/40 bg-card p-5 space-y-3", className)}>
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/5" />
                    <Skeleton className="h-3 w-2/5" />
                </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
        </div>
    );
}

/** KPI stat skeleton */
export function KpiSkeleton() {
    return (
        <div className="rounded-xl border border-border/40 bg-card p-5">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-14" />
                </div>
                <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
            <Skeleton className="h-1 w-full mt-3 rounded-full" />
        </div>
    );
}

/** Grid of card skeletons */
export function PageSkeleton({ cards = 6 }: { cards?: number }) {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: cards }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
}
