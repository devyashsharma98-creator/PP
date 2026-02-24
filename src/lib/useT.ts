"use client";
import { useAppContext } from "@/context/AppContext";
// Inline bilingual helper: t('English string', 'हिन्दी स्ट्रिंग')
export function useT() {
  const { lang } = useAppContext();
  return (en: string, hi: string): string => lang === 'hi' ? hi : en;
}
