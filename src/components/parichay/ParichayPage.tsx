"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { ScrollProgress } from "./layout/ScrollProgress";
import { HeroChapter } from "./chapters/HeroChapter";
import { WorkstreamsChapter } from "./chapters/WorkstreamsChapter";
import { PublicOutputChapter } from "./chapters/PublicOutputChapter";
import { JoinChapter } from "./chapters/JoinChapter";
import { EnterChapter } from "./chapters/EnterChapter";

gsap.registerPlugin(ScrollTrigger);

const CHAPTER_LABELS = [
  { en: "Pragya Pravah", hi: "प्रज्ञा प्रवाह" },
  { en: "Our Work", hi: "हमारा कार्य" },
  { en: "Public Output", hi: "सार्वजनिक सामग्री" },
  { en: "Join", hi: "जुड़ें" },
  { en: "Enter", hi: "प्रवेश" },
];

export default function ParichayPage() {
  const { lang } = useAppContext();
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const isMobile = window.innerWidth < 768;

    const lenis = new Lenis({
      duration: prefersReducedMotion ? 0 : 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: !prefersReducedMotion,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", (e: { progress: number; scroll: number; limit: number }) => {
      setProgress(e.progress);
      ScrollTrigger.update();
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Set up global ScrollTrigger sync
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    // Chapter tracking
    const chapters = containerRef.current?.querySelectorAll("[data-chapter]");
    if (chapters) {
      chapters.forEach((chapter, index) => {
        ScrollTrigger.create({
          trigger: chapter,
          start: "top center",
          end: "bottom center",
          onEnter: () => setActiveChapter(index),
          onEnterBack: () => setActiveChapter(index),
        });
      });
    }

    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  const scrollToChapter = (index: number) => {
    const chapters = containerRef.current?.querySelectorAll("[data-chapter]");
    if (chapters && chapters[index]) {
      lenisRef.current?.scrollTo(chapters[index] as HTMLElement, {
        offset: 0,
        duration: 1.5,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative" suppressHydrationWarning>
      <ScrollProgress
        progress={progress}
        activeChapter={activeChapter}
        chapters={CHAPTER_LABELS.map((c) => t(c.en, c.hi))}
        onChapterClick={scrollToChapter}
      />

      <main className="relative">
        <section data-chapter="0">
          <HeroChapter />
        </section>

        <section data-chapter="1">
          <WorkstreamsChapter />
        </section>

        <section data-chapter="2">
          <PublicOutputChapter />
        </section>

        <section data-chapter="3">
          <JoinChapter />
        </section>

        <section data-chapter="4">
          <EnterChapter />
        </section>
      </main>
    </div>
  );
}
