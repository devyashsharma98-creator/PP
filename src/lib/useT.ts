"use client";
import { useCallback } from "react";
import { useAppContext } from "@/context/AppContext";

function looksLikeBrokenHindi(value: string) {
  return /[ÃÂà]/.test(value) && /[¤¥]/.test(value);
}

export function repairBrokenHindi(value: string) {
  if (!looksLikeBrokenHindi(value)) return value;

  try {
    const bytes = Uint8Array.from(Array.from(value, (char) => char.charCodeAt(0) & 0xff));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return decoded.includes("�") ? value : decoded;
  } catch {
    return value;
  }
}

export function pickLang(en: string, hi: string | undefined | null, lang: "en" | "hi") {
  if (lang !== "hi") return en;
  return repairBrokenHindi(hi ?? en);
}

export function useT() {
  const { lang } = useAppContext();
  return useCallback((en: string, hi: string): string => lang === 'hi' ? repairBrokenHindi(hi) : en, [lang]);
}
