"use client";

import { useContext } from "react";
import { BonsaiContext } from "@/context/BonsaiContext";

export function useBonsaiLLM() {
  const ctx = useContext(BonsaiContext);
  if (!ctx) throw new Error("useBonsaiLLM must be used inside BonsaiProvider");
  return ctx;
}
