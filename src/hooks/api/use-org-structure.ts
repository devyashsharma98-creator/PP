"use client";

import { useQuery } from "@tanstack/react-query";

const API_BASE = "/api/v1";

export interface OrgStructureUnit {
  id: string;
  name: string;
  nameHi: string | null;
  code: string;
  unitKind: string;
}

export interface OrgStructureDepartment {
  id: string;
  name: string;
  nameHi: string | null;
  code: string;
  departmentKind: string;
  unitId: string | null;
}

export interface OrgStructureResponse {
  org: {
    name: string | null;
    nameHi: string | null;
    orgCode: string | null;
  };
  units: OrgStructureUnit[];
  departments: OrgStructureDepartment[];
  heads: Record<string, string>;
}

async function fetchOrgStructure(): Promise<OrgStructureResponse> {
  const res = await fetch(`${API_BASE}/org/structure`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to load org structure");
  }
  return data.data as OrgStructureResponse;
}

export function useOrgStructure() {
  return useQuery({
    queryKey: ["org-structure"],
    queryFn: fetchOrgStructure,
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: 1,
  });
}
