"use client";
import { useCallback } from "react";
import { useAppContext } from "@/context/AppContext";
import type { Lang } from "@/lib/app/contracts";

/**
 * Legacy guard for double-encoded UTF-8 mojibake.
 *
 * NOTE: The root fix is ensuring the database client (Neon/Postgres)
 * connects with `client_encoding = 'UTF8'`. All new data should be
 * stored and retrieved correctly without repair. This function is
 * kept as a safety net for legacy rows that may still be corrupted.
 */
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

/** Server-supplied Hindi (or English fallback) with mojibake repair when UI is Hindi. */
export function displayBilingualHi(primaryEn: string, hi: string | null | undefined, lang: Lang): string {
  if (lang !== "hi") return primaryEn;
  const trimmed = hi != null ? hi.trim() : "";
  if (!trimmed) return primaryEn;
  return repairBrokenHindi(trimmed);
}

export function useT() {
  const { lang } = useAppContext();
  return useCallback((en: string, hi: string): string => lang === 'hi' ? repairBrokenHindi(hi) : en, [lang]);
}
