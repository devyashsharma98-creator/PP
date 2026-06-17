"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ScrollProgressProps {
  progress: number;
  activeChapter: number;
  chapters: string[];
  onChapterClick: (index: number) => void;
}

export function ScrollProgress({
  progress,
  activeChapter,
  chapters,
  onChapterClick,
}: ScrollProgressProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 md:left-6 lg:left-8 md:block" suppressHydrationWarning>
      <div className="relative flex flex-col items-start gap-4">
        {/* Progress track */}
        <div className="absolute left-[5px] top-1 bottom-1 w-[2px] bg-border/20" />
        <motion.div
          className="absolute left-[5px] top-1 w-[2px] bg-gradient-to-b from-primary to-[hsl(var(--parchment-accent))] origin-top"
          style={{ height: `${progress * 98}%`, bottom: "4px" }}
        />

        {/* Chapter dots */}
        {chapters.map((label, index) => (
          <button
            key={index}
            onClick={() => onChapterClick(index)}
            className="group relative flex items-center gap-4 py-1 text-left focus:outline-none"
            aria-label={`Go to ${label}`}
          >
            <div className="relative flex h-3 w-3 items-center justify-center">
              {/* Glowing animated layout ring */}
              {index === activeChapter && (
                <motion.div
                  className="absolute -inset-1 z-0 rounded-full border border-primary/40 bg-primary/10"
                  layoutId="activeDotRing"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <motion.div
                className={cn(
                  "relative z-10 h-2.5 w-2.5 rounded-full border-2 transition-all duration-300",
                  index === activeChapter
                    ? "border-primary bg-primary scale-110"
                    : "border-border/60 bg-background hover:border-primary/60"
                )}
                whileHover={{ scale: 1.3 }}
              />
            </div>
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-[0.18em] transition-all duration-300 whitespace-nowrap",
                index === activeChapter
                  ? "opacity-100 translate-x-0 text-primary"
                  : "opacity-0 -translate-x-2 group-hover:opacity-75 group-hover:translate-x-0 text-foreground"
              )}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
