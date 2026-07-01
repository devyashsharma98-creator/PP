"use client";

import { useQuery } from "@tanstack/react-query";

interface ContributionMetrics {
  authored: number;
  published: number;
  reviews: number;
  events: number;
  circulars: number;
}

export interface MyImpactData {
  userId: string;
  metrics: ContributionMetrics;
  score: number;
  level: string;
  levelHi: string;
  rank: number;
  totalContributors: number;
}

export interface LeaderboardEntry {
  userId: string;
  name: string | null;
  nameHi: string | null;
  metrics: ContributionMetrics;
  score: number;
  level: string;
  levelHi: string;
}

async function fetchMyContributions(): Promise<MyImpactData> {
  const res = await fetch("/api/v1/contributions/me");
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Failed to load contributions");
  return json.data as MyImpactData;
}

async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch("/api/v1/contributions/leaderboard");
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Failed to load leaderboard");
  return json.data as LeaderboardEntry[];
}

export function useMyContributions() {
  return useQuery({
    queryKey: ["contributions", "me"],
    queryFn: fetchMyContributions,
    staleTime: 120_000,
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["contributions", "leaderboard"],
    queryFn: fetchLeaderboard,
    staleTime: 120_000,
  });
}
