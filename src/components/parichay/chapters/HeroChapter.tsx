"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, LogIn } from "lucide-react";
import { PragyaLogo } from "@/components/PragyaLogo";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { ERP_FLOW_STEPS, STORY_STAGES } from "../story-content";

export function HeroChapter() {
  const t = useT();
  const { lang } = useAppContext();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -72]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative flex min-h-[92dvh] items-center justify-center overflow-hidden bg-background py-20"
      style={{ opacity }}
    >
      <div className="absolute inset-0 bg-[hsl(var(--parchment-bg))]">
        <Image
          src={STORY_STAGES[4].image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center opacity-55 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--background))_0%,hsl(var(--background)/0.94)_34%,hsl(var(--background)/0.68)_66%,hsl(var(--background)/0.36)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_38%,hsl(var(--primary)/0.18),transparent_34%)]" />
      </div>

      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      <motion.div
        className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 md:grid-cols-[minmax(0,0.92fr)_minmax(22rem,0.72fr)] md:px-10"
        style={{ scale, y }}
      >
        <div>
          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 flex items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/15 blur-2xl" />
              <PragyaLogo className="relative h-16 w-16 text-primary md:h-20 md:w-20" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
                {t("Bhopal Vibhag", "भोपाल विभाग")}
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
                {t("Story to system", "कथा से व्यवस्था")}
              </p>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mb-6 max-w-4xl text-5xl font-bold leading-[0.94] tracking-tighter text-foreground md:text-7xl lg:text-8xl"
          >
            <span className="block">{t("Pragya Pravah", "प्रज्ञा प्रवाह")}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className={`max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl ${
              lang === "hi" ? "font-devanagari" : ""
            }`}
          >
            {t(
              "A public intellectual movement organized through publication, dissemination, discourse, field reporting, and an ERP console for continuity.",
              "प्रकाशन, प्रसार, विमर्श, क्षेत्रीय वृत्त और निरंतरता के लिए ERP कंसोल से संगठित सार्वजनिक वैचारिक प्रवाह।"
            )}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.62 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Link
              href="#our-work"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-primary px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-primary-foreground transition-all hover:bg-primary/90"
            >
              {t("Explore Work", "कार्य देखें")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-border/70 bg-background/75 px-6 py-3 text-sm font-bold uppercase tracking-[0.15em] text-foreground backdrop-blur transition-all hover:border-primary/40 hover:bg-background"
            >
              <LogIn className="h-4 w-4" />
              {t("Sign In", "प्रवेश")}
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.7 }}
          className="relative rounded-[1.75rem] border border-border/70 bg-background/80 p-4 shadow-[0_28px_90px_-52px_hsl(var(--navy)/0.55)] backdrop-blur-md md:p-5"
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                {t("ERP operating flow", "ERP संचालन प्रवाह")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {t(
                  "How an idea moves through the institution.",
                  "संस्था में विचार कैसे आगे बढ़ता है।"
                )}
              </p>
            </div>
            <span className="hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary sm:inline-flex">
              {t("Live system", "सक्रिय तंत्र")}
            </span>
          </div>

          <div className="grid gap-2">
            {ERP_FLOW_STEPS.map((step, index) => (
              <div
                key={step.id}
                className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 rounded-2xl border border-border/60 bg-card/82 px-3 py-3"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold uppercase tracking-[0.16em] text-foreground">
                    {t(step.moduleEn, step.moduleHi)}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {t(step.titleEn, step.titleHi)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          {t("Scroll to explore", "नीचे स्क्रॉल करें")}
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-primary/60" />
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
