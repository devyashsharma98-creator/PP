"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/useT";
import { ParticleField } from "../effects/ParticleField";

export function EnterChapter() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: "some" });

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[64dvh] items-center justify-center overflow-hidden bg-background py-16 md:py-24"
    >
      {/* Particle background */}
      <ParticleField />

      {/* Large rotating mandala watermark centered behind text */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] opacity-[0.03] text-primary pointer-events-none animate-mandala-rotate" 
        aria-hidden="true" 
        style={{ transformOrigin: "50px 50px" }}
      >
        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="3 3" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 1" />
        <path d="M 50,5 L 50,95 M 5,50 L 95,50" stroke="currentColor" strokeWidth="0.2" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI) / 4;
          const x = 50 + 30 * Math.cos(angle);
          const y = 50 + 30 * Math.sin(angle);
          return <circle key={i} cx={x} cy={y} r="1" fill="currentColor" />;
        })}
      </svg>

      {/* Gradient orbs with drift animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px] animate-orb-drift" />
        <div className="absolute right-1/4 bottom-1/3 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[100px] animate-orb-drift" style={{ animationDelay: "-5s" }} />
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

        <h2 className="mb-6 text-5xl font-bold tracking-tight bg-gradient-to-r from-primary via-rose-600 to-primary bg-clip-text text-transparent md:text-6xl lg:text-7xl">
          {t("Enter", "प्रवेश")}
        </h2>

        <p className="mb-10 text-lg leading-relaxed text-muted-foreground">
          {t(
            "Existing karyakartas and institutional members can access the console directly.",
            "विद्यमान कार्यकर्ता और संस्थागत सदस्य सीधे कंसोल तक पहुँच सकते हैं।"
          )}
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          {/* Glowing wrapper for key CTA */}
          <div className="relative">
            <motion.div
              className="absolute -inset-0.5 rounded-full bg-primary/45 blur opacity-75 pointer-events-none"
              animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            />
            <Link
              href="/login"
              className="relative group inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-sm font-bold uppercase tracking-[0.15em] text-primary-foreground transition-all duration-300 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/20"
            >
              {t("Sign In", "प्रवेश करें")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <Link
            href="/guide"
            className="inline-flex items-center gap-2 rounded-full border border-border/40 bg-background/50 backdrop-blur-sm px-6 py-4 text-sm font-bold uppercase tracking-[0.15em] text-foreground transition-all hover:border-primary/30 hover:bg-accent"
          >
            {t("How to Join", "कैसे जुड़ें")}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
