"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, useCallback } from "react";
import { useT } from "@/lib/useT";

export function ThemeToggle() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggle = useCallback(() => setTheme(theme === "dark" ? "light" : "dark"), [theme, setTheme]);

  if (!mounted) return null;

  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      aria-label={isDark ? t("Switch to light mode", "लाइट मोड पर स्विच करें") : t("Switch to dark mode", "डार्क मोड पर स्विच करें")}
      className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border/70 bg-background/80 transition-colors hover:border-primary/40"
      title={isDark ? t("Light Mode", "लाइट मोड") : t("Dark Mode", "डार्क मोड")}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Sun className="w-4 h-4 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
            <Moon className="w-4 h-4 text-muted-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
