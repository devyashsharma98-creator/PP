"use client";

import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api/v1";

export interface DirectoryMember {
  id: string;
  displayName: string | null;
  displayNameHi: string | null;
  email: string;
  phone: string | null;
  primaryRoleCode: string | null;
  primaryRoleName: string | null;
  primaryRoleNameHi: string | null;
  roles: Array<{ code: string; name: string; nameHi: string | null }>;
  unitName: string | null;
  departmentName: string | null;
  departmentCode: string | null;
}

async function fetchDirectory(): Promise<DirectoryMember[]> {
  const res = await fetch(`${API_BASE}/directory`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load directory");
  }
  return data.data as DirectoryMember[];
}

export function useDirectory() {
  return useQuery({
    queryKey: ["directory"],
    queryFn: fetchDirectory,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
    meta: {
      errorMessage: "Directory load failed",
    },
  });
}
