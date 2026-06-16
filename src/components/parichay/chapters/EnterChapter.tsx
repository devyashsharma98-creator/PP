"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/useT";
import { ParticleField } from "../effects/ParticleField";

export function EnterChapter() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = true;

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[64dvh] items-center justify-center overflow-hidden bg-background py-16 md:py-24"
    >
      {/* Particle background */}
      <ParticleField />

      {/* Gradient orbs */}
      <div className="absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-1/3 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="relative z-10 mx-auto max-w-2xl px-6 text-center"
      >
        <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
          {t("Member Access", "सदस्य प्रवेश")}
        </p>

        <h2 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          {t("Enter", "प्रवेश")}
        </h2>

        <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
          {t(
            "Existing karyakartas and institutional members can access the console directly.",
            "विद्यमान कार्यकर्ता और संस्थागत सदस्य सीधे कंसोल तक पहुँच सकते हैं।"
          )}
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/20"
          >
            {t("Sign In", "प्रवेश करें")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>

          <Link
            href="/guide"
            className="inline-flex items-center gap-2 rounded-full border border-border/40 px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-foreground transition-all hover:border-primary/30 hover:bg-accent"
          >
            {t("How to Join", "कैसे जुड़ें")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
