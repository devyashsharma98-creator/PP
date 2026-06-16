"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/useT";
import { useAppContext } from "@/context/AppContext";
import { PragyaLogo } from "@/components/PragyaLogo";

export function HeroChapter() {
  const t = useT();
  const { lang } = useAppContext();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, -100]);

  return (
    <motion.section
      ref={sectionRef}
      className="relative flex min-h-[88dvh] items-center justify-center overflow-hidden bg-background py-20"
      style={{ opacity }}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-accent/20" />
        <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] animate-pulse" />
        <div className="absolute -right-1/4 -bottom-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-5xl px-6 text-center md:px-10"
        style={{ scale, y }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl" />
            <PragyaLogo className="relative h-20 w-20 text-primary md:h-28 md:w-28" />
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-4 text-[11px] font-bold uppercase tracking-[0.3em] text-primary"
        >
          {t("Bhopal Vibhag", "भोपाल विभाग")}
        </motion.p>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mb-6 text-5xl font-bold leading-[0.95] tracking-tighter text-foreground md:text-7xl lg:text-8xl"
        >
          <span className="block">{t("Pragya Pravah", "प्रज्ञा प्रवाह")}</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className={`mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl ${lang === "hi" ? "font-devanagari" : ""}`}
        >
          {t(
            "Public interface for publication, dissemination, discourse, and reporting.",
            "प्रज्ञा प्रवाह लेखन, प्रसार, विमर्श और संस्थागत वृत्त को एक संयत सार्वजनिक पटल पर एकत्र करता है।"
          )}
        </motion.p>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-16 flex flex-col items-center gap-2"
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
      </motion.div>
    </motion.section>
  );
}
