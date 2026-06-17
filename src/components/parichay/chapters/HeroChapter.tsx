"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, LogIn } from "lucide-react";
import { PragyaLogo } from "@/components/PragyaLogo";
import { ERP_FLOW_STEPS } from "../story-content";

const orbitPoints = [
  { x: 50, y: 12 },
  { x: 88, y: 41 },
  { x: 74, y: 86 },
  { x: 26, y: 86 },
  { x: 12, y: 41 },
];

export function HeroChapter() {
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.52], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.52], [1, 0.97]);
  const y = useTransform(scrollYProgress, [0, 0.52], [0, -56]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative isolate flex min-h-[92dvh] items-center overflow-hidden bg-[hsl(var(--parchment-bg))] py-16 text-[hsl(var(--parchment-ink))] md:py-20"
      style={{ opacity }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--parchment-rule)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--parchment-rule)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "linear-gradient(90deg, black 0%, black 70%, transparent 100%)",
          }}
        />
        <div className="absolute -right-28 top-6 h-[34rem] w-[34rem] rounded-full border border-[hsl(var(--parchment-rule)/0.72)]" />
        <div className="absolute -right-10 top-24 h-[22rem] w-[22rem] rounded-full border border-[hsl(var(--primary)/0.18)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-[linear-gradient(180deg,transparent,hsl(var(--background)))]" />
      </div>

      <motion.div
        className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-5 md:grid-cols-[0.86fr_1fr] md:px-10"
        style={{ scale, y }}
      >
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mb-8 flex items-center gap-4"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-[hsl(var(--primary)/0.22)] bg-[hsl(var(--background)/0.72)] shadow-[0_20px_44px_-32px_hsl(var(--primary)/0.65)] md:h-20 md:w-20">
              <PragyaLogo className="h-12 w-12 text-primary md:h-14 md:w-14" />
            </span>
            <span>
              <span className="block text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                Bhopal Vibhag
              </span>
              <span className="mt-1 block font-devanagari text-sm font-semibold leading-6 tracking-normal text-[hsl(var(--parchment-ink-soft))]">
                भोपाल विभाग
              </span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
            className="space-y-4"
          >
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[hsl(var(--parchment-accent))]">
              Story to System
            </p>
            <h1 className="text-5xl font-bold leading-none tracking-normal md:text-7xl lg:text-8xl">
              Pragya Pravah
              <span className="mt-3 block font-devanagari text-4xl font-semibold leading-tight tracking-normal text-[hsl(var(--parchment-ink-soft))] md:text-6xl">
                प्रज्ञा प्रवाह
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, delay: 0.32, ease: "easeOut" }}
            className="mt-7 grid max-w-2xl gap-4 text-base leading-8 text-[hsl(var(--parchment-ink-soft))] md:text-lg"
          >
            <p>
              A public intellectual movement organized through study,
              publication, dissemination, discourse, reporting, and an ERP
              console for continuity.
            </p>
            <p className="font-devanagari text-lg leading-9 tracking-normal text-[hsl(var(--parchment-ink))] md:text-xl">
              अध्ययन, प्रकाशन, प्रसार, विमर्श, वृत्त और निरंतरता के लिए ERP
              कंसोल से संगठित सार्वजनिक वैचारिक प्रवाह।
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.5, ease: "easeOut" }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="#our-work"
              className="group inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore Work
              <span className="font-devanagari normal-case tracking-normal">
                कार्य देखें
              </span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-[hsl(var(--parchment-rule))] bg-[hsl(var(--background)/0.76)] px-6 py-3 text-sm font-bold uppercase tracking-[0.14em] text-[hsl(var(--parchment-ink))] transition-colors hover:border-primary/40 hover:bg-background"
            >
              <LogIn className="h-4 w-4" />
              Sign In
              <span className="font-devanagari normal-case tracking-normal">
                प्रवेश
              </span>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.76, delay: 0.42, ease: "easeOut" }}
          className="relative min-h-[34rem] overflow-hidden rounded-lg border border-[hsl(var(--parchment-rule))] bg-[hsl(var(--background)/0.7)] p-4 shadow-[0_32px_90px_-60px_hsl(var(--parchment-ink)/0.45)] md:min-h-[40rem] md:p-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,hsl(var(--primary)/0.12),transparent_38%)]" />
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage:
                "linear-gradient(90deg, hsl(var(--parchment-rule)) 1px, transparent 1px), linear-gradient(hsl(var(--parchment-rule)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative flex items-start justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                ERP Operating Mandala
              </p>
              <p className="mt-1 font-devanagari text-sm font-semibold leading-6 tracking-normal text-[hsl(var(--parchment-ink-soft))]">
                विचार से अभिलेख तक संचालन-तंत्र
              </p>
            </div>
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Live System
            </span>
          </div>

          <div className="relative mx-auto mt-8 aspect-square max-w-[36rem]">
            <svg
              viewBox="0 0 100 100"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="hero-flow" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="hsl(var(--parchment-accent))" stopOpacity="0.62" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--parchment-rule))" strokeWidth="0.35" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(var(--primary))" strokeOpacity="0.32" strokeWidth="0.42" />
              <circle cx="50" cy="50" r="18" fill="none" stroke="hsl(var(--parchment-accent))" strokeOpacity="0.36" strokeWidth="0.3" />
              <path
                d="M50 12 C72 15 88 28 88 41 C88 63 81 78 74 86 C55 92 37 91 26 86 C15 70 10 54 12 41 C15 27 29 15 50 12Z"
                fill="none"
                stroke="url(#hero-flow)"
                strokeWidth="0.6"
                strokeLinecap="round"
              />
              {orbitPoints.map((point, index) => (
                <g key={`${point.x}-${point.y}`}>
                  <line
                    x1="50"
                    y1="50"
                    x2={point.x}
                    y2={point.y}
                    stroke="hsl(var(--parchment-ink))"
                    strokeOpacity="0.16"
                    strokeWidth="0.28"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={index === 4 ? 2.4 : 2}
                    fill="hsl(var(--background))"
                    stroke="hsl(var(--primary))"
                    strokeWidth="0.52"
                  />
                </g>
              ))}
            </svg>

            <div className="absolute left-1/2 top-1/2 flex h-36 w-36 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-[hsl(var(--primary)/0.24)] bg-[hsl(var(--background)/0.92)] text-center shadow-[0_22px_70px_-50px_hsl(var(--primary)/0.82)] md:h-44 md:w-44">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Pragya
              </span>
              <span className="mt-1 font-devanagari text-2xl font-semibold leading-tight tracking-normal text-[hsl(var(--parchment-ink))]">
                प्रज्ञा
              </span>
              <span className="mt-2 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--parchment-ink-soft))]">
                ERP Console
              </span>
            </div>

            {ERP_FLOW_STEPS.map((step, index) => {
              const point = orbitPoints[index];

              return (
                <div
                  key={step.id}
                  className="absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[hsl(var(--parchment-rule))] bg-[hsl(var(--background)/0.9)] px-3 py-2 shadow-[0_18px_46px_-38px_hsl(var(--parchment-ink)/0.45)] md:w-40"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {String(index + 1).padStart(2, "0")} / {step.moduleEn}
                  </p>
                  <p className="mt-1 font-devanagari text-sm font-semibold leading-6 tracking-normal text-[hsl(var(--parchment-ink))]">
                    {step.moduleHi}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[hsl(var(--parchment-ink-soft))]">
                    {step.titleEn}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.05 }}
        className="absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--parchment-ink-soft))]">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-primary/70" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
