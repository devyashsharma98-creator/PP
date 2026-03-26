"use client";
import { useCallback } from "react";
import { useAppContext } from "@/context/AppContext";

export function useT() {
  const { lang } = useAppContext();
  return useCallback((en: string, hi: string): string => lang === 'hi' ? hi : en, [lang]);
}
