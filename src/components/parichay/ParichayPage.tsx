"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";
import { PragyaLogo } from "@/components/PragyaLogo";
import { ScrollProgress } from "./layout/ScrollProgress";
import { HeroChapter } from "./chapters/HeroChapter";
import { IdentityChapter } from "./chapters/IdentityChapter";
import { WorkstreamsChapter } from "./chapters/WorkstreamsChapter";
import { PublicOutputChapter } from "./chapters/PublicOutputChapter";
import { JoinChapter } from "./chapters/JoinChapter";
import { EnterChapter } from "./chapters/EnterChapter";

gsap.registerPlugin(ScrollTrigger);

const CHAPTER_LABELS = [
  { en: "Pragya Pravah", hi: "प्रज्ञा प्रवाह" },
  { en: "Who We Are", hi: "हम कौन हैं" },
  { en: "Our Work", hi: "हमारा कार्य" },
  { en: "Public Output", hi: "सार्वजनिक सामग्री" },
  { en: "Join", hi: "जुड़ें" },
  { en: "Enter", hi: "प्रवेश" },
];

export default function ParichayPage() {
  const { lang, setLang } = useAppContext();
  const t = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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
        offset: -60, // offset for fixed top bar
        duration: 1.5,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative bg-background" suppressHydrationWarning>
      {/* Top Bar Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 md:px-10">
          <Link href="/" className="flex items-center gap-3 min-h-[44px]">
            <span className="flex h-8 w-8 items-center justify-center rounded border border-primary/20 bg-primary/5 text-primary">
              <PragyaLogo className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.16em] text-foreground">
              {t("Pragya Pravah", "प्रज्ञा प्रवाह")}
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-5 md:flex">
              {CHAPTER_LABELS.map((label, index) => (
                <button
                  key={index}
                  onClick={() => scrollToChapter(index)}
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.14em] transition-colors focus:outline-none",
                    index === activeChapter
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t(label.en, label.hi)}
                </button>
              ))}
            </nav>

            <div className="h-4 w-px bg-border/40 hidden md:block" />

            <div className="flex items-center gap-3">
              <button
                onClick={() => setLang(lang === "en" ? "hi" : "en")}
                className="rounded border border-primary/30 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary transition-all hover:bg-primary hover:text-primary-foreground min-h-[44px]"
              >
                {lang === "en" ? "हिन्दी" : "EN"}
              </button>
              <Link
                href="/login"
                className="rounded bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90 min-h-[44px] inline-flex items-center"
              >
                {t("Console", "कंसोल")}
              </Link>
            </div>
          </div>
        </div>
      </header>

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

        <div className="sutra-divider" />

        <section data-chapter="1">
          <IdentityChapter />
        </section>

        <div className="sutra-divider" />

        <section data-chapter="2">
          <WorkstreamsChapter />
        </section>

        <div className="sutra-divider" />

        <section data-chapter="3">
          <PublicOutputChapter />
        </section>

        <div className="sutra-divider" />

        <section data-chapter="4">
          <JoinChapter />
        </section>

        <div className="sutra-divider" />

        <section data-chapter="5">
          <EnterChapter />
        </section>
      </main>
    </div>
  );
}
