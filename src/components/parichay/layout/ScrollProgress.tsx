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
    <div className="fixed left-4 top-1/2 z-50 hidden -translate-y-1/2 md:left-6 lg:left-8 md:block">
      <div className="relative flex flex-col items-center gap-3">
        {/* Progress track */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/30" />
        <motion.div
          className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-primary origin-top"
          style={{ height: `${progress * 100}%` }}
        />

        {/* Chapter dots */}
        {chapters.map((label, index) => (
          <button
            key={index}
            onClick={() => onChapterClick(index)}
            className="group relative flex items-center gap-3"
            aria-label={`Go to ${label}`}
          >
            <motion.div
              className={cn(
                "relative z-10 h-2.5 w-2.5 rounded-full border transition-colors duration-300",
                index === activeChapter
                  ? "border-primary bg-primary scale-125"
                  : "border-border/50 bg-background hover:border-primary/60"
              )}
              whileHover={{ scale: 1.4 }}
            />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wider transition-opacity duration-300",
                index === activeChapter
                  ? "opacity-100 text-primary"
                  : "opacity-0 group-hover:opacity-60 text-foreground"
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
