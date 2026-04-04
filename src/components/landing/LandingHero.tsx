"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeepMandala } from "./shared";
import { useAppContext } from "@/context/AppContext";
import { ScrollProgress } from "./animations";

/* Magnetic button - follows cursor on hover */
function MagneticButton({ children, href, className = "" }: { children: React.ReactNode; href: string; className?: string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  const springX = useSpring(x, { stiffness: 200, damping: 25 });
  const springY = useSpring(y, { stiffness: 200, damping: 25 });

  const handleMove = (e: React.MouseEvent) => {
    if (isTouch || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.2);
    y.set((e.clientY - centerY) * 0.2);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div style={{ x: springX, y: springY }}>
      <Link
        ref={ref}
        href={href}
        className={className}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        {children}
      </Link>
    </motion.div>
  );
}

export function LandingHero() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const springProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  // Hero parallax
  const heroY = useTransform(springProgress, [0, 1], [0, -150]);
  const heroOpacity = useTransform(springProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(springProgress, [0, 0.6], [1, 0.92]);

  // Text split animation on scroll
  const word1Y = useTransform(springProgress, [0, 0.3], [0, -40]);
  const word2Y = useTransform(springProgress, [0, 0.3], [0, -20]);
  const word3Y = useTransform(springProgress, [0, 0.3], [0, 0]);

  // Mandala parallax layers
  const mandala1Y = useTransform(springProgress, [0, 1], [0, -300]);
  const mandala1Rotate = useTransform(springProgress, [0, 1], [0, 90]);
  const mandala2Y = useTransform(springProgress, [0, 1], [0, -500]);
  const mandala2Rotate = useTransform(springProgress, [0, 1], [0, -72]);

  return (
    <>
      <ScrollProgress />
      <section ref={containerRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* === ATMOSPHERIC LAYERS === */}
        <div className="absolute inset-0 pointer-events-none" 
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 20%, hsl(24 94% 52% / 0.05), transparent)" }} 
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 40% at 15% 85%, hsl(222 47% 11% / 0.03), transparent)" }}
        />

        {/* === PARALLAX MANDALAS === */}
        <motion.div style={{ y: mandala1Y, rotate: mandala1Rotate }} className="absolute -right-48 -top-48 text-primary/[0.035] pointer-events-none z-0 hidden sm:block">
          <DeepMandala className="h-[700px] w-[700px]" />
        </motion.div>
        <motion.div style={{ y: mandala2Y, rotate: mandala2Rotate }} className="absolute -left-32 -bottom-32 text-primary/[0.02] pointer-events-none z-0 hidden sm:block">
          <DeepMandala className="h-[500px] w-[500px]" />
        </motion.div>

        {/* Mobile-only mandala */}
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, -150]), rotate: mandala1Rotate }} className="absolute -right-16 -top-16 text-primary/[0.04] pointer-events-none z-0 sm:hidden">
          <DeepMandala className="h-[250px] w-[250px]" />
        </motion.div>

        {/* === MAIN CONTENT === */}
        <motion.div 
          style={{ opacity: heroOpacity, y: heroY, scale: heroScale }}
          className="relative z-10 mx-auto w-full px-5 sm:px-6 max-w-7xl pt-24 sm:pt-28 pb-16 sm:pb-20"
        >
          {/* Eyebrow */}
          <motion.div 
            className="inline-flex items-center gap-2.5 mb-6 sm:mb-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.span 
              className="h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center border"
              style={{ borderColor: "hsl(24 94% 52% / 0.2)", backgroundColor: "hsl(24 94% 52% / 0.06)" }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-primary" />
            </motion.span>
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.35em] sm:tracking-[0.4em]" style={{ color: "hsl(24 94% 52% / 0.55)" }}>
              Pragya Pravah <span className="font-devanagari tracking-[0.2em]" style={{ color: "hsl(24 94% 52% / 0.35)" }}>प्रज्ञा प्रवाह</span>
            </p>
          </motion.div>

          {/* === MASSIVE HEADLINE === */}
          <div className="space-y-0 sm:space-y-2">
            <h1 className="leading-[0.85] sm:leading-[0.88]" style={{ fontSize: "clamp(3rem, 14vw, 10rem)" }}>
              <motion.span
                style={{ y: word1Y, color: "hsl(222 47% 11%)" }}
                initial={{ opacity: 0, y: 120, filter: "blur(14px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.4, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                Civilisational
              </motion.span>
              <motion.span
                style={{ y: word2Y, color: "hsl(222 47% 11%)" }}
                initial={{ opacity: 0, y: 120, filter: "blur(14px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.55, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                thought.
              </motion.span>
              <motion.span
                style={{ y: word3Y, color: "hsl(24 94% 52%)", fontStyle: "italic" }}
                initial={{ opacity: 0, y: 120, filter: "blur(14px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.7, duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                className="block"
              >
                Organised action.
              </motion.span>
            </h1>
          </div>

          {/* Animated underline */}
          <motion.div 
            className="h-px mt-4 sm:mt-6 mb-6 sm:mb-8 max-w-xs sm:max-w-sm"
            style={{ background: "linear-gradient(90deg, hsl(24 94% 52% / 0.5), hsl(24 94% 52% / 0.05))" }}
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1, originX: 0 }}
            transition={{ delay: 1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Hindi tagline + description */}
          <div className="space-y-4 sm:space-y-6 max-w-xl">
            <motion.p 
              className="font-devanagari text-base sm:text-lg leading-relaxed"
              style={{ color: "hsl(222 47% 11% / 0.5)" }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              भारत-केंद्रित चिंतन, संवाद और संगठित कार्य का समकालीन संस्थागत मंच।
            </motion.p>
            <motion.p 
              className="text-sm leading-relaxed"
              style={{ color: "hsl(220 12% 44%)" }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 1 }}
            >
              A Bharatiya intellectual forum converting philosophical reflection into disciplined review, research, publication, and coordinated public outreach.
            </motion.p>
          </div>

          {/* CTAs with magnetic effect */}
          <motion.div 
            className="flex flex-wrap gap-3 pt-4 sm:pt-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <MagneticButton href="/parichay" className="inline-block flex-1 sm:flex-none">
              <Button size="lg" className="h-11 sm:h-14 rounded-none bg-navy text-background hover:bg-primary transition-all duration-500 px-5 sm:px-8 group w-full" style={{ backgroundColor: "hsl(222 47% 11%)", boxShadow: "0 8px 32px -8px hsl(222 47% 11% / 0.2)" }}>
                <span className="flex flex-col items-start gap-0.5">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em]">{isHi ? "दृष्टि समझें" : "The Vision"}</span>
                  <span className="font-devanagari text-[8px] sm:text-[9px]" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{isHi ? "The Vision" : "दृष्टि समझें"}</span>
                </span>
                <ArrowRight className="ml-2 sm:ml-3 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </MagneticButton>
            <MagneticButton href="/login" className="inline-block flex-1 sm:flex-none">
              <Button size="lg" variant="outline" className="h-11 sm:h-14 rounded-none px-5 sm:px-8 hover:bg-card transition-all duration-500 group w-full" style={{ borderColor: "hsl(38 15% 88%)", backgroundColor: "transparent" }}>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]" style={{ color: "hsl(222 47% 11% / 0.55)" }}>{isHi ? "प्रणाली" : "Console"}</span>
                <ArrowRight className="ml-2 sm:ml-3 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1" style={{ opacity: 0.3 }} />
              </Button>
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-6 left-1/2 -translate-x-1/2 sm:bottom-8 hidden sm:flex flex-col items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
        >
          <p className="text-[7px] uppercase tracking-[0.4em]" style={{ color: "hsl(220 12% 44% / 0.25)" }}>Scroll</p>
          <motion.div 
            className="w-px h-12"
            style={{ background: "linear-gradient(to bottom, hsl(24 94% 52% / 0.2), transparent)" }}
            animate={{ scaleY: [1, 0.3, 1], opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* Mobile scroll indicator */}
        <motion.div 
          className="absolute bottom-5 left-1/2 -translate-x-1/2 sm:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <motion.div 
            className="w-5 h-9 rounded-full border flex items-start justify-center p-1.5"
            style={{ borderColor: "hsl(220 12% 44% / 0.15)" }}
          >
            <motion.div 
              className="w-1 h-1.5 rounded-full"
              style={{ backgroundColor: "hsl(24 94% 52% / 0.3)" }}
              animate={{ y: [0, 6, 0], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* === ROLLING TEXT BAND === */}
      <div className="overflow-hidden whitespace-nowrap py-3 sm:py-4 border-y" style={{ borderColor: "hsl(38 15% 88% / 0.3)" }}>
        <motion.div
          className="inline-flex whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 35, ease: "linear" } }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="mx-4 sm:mx-6 text-base sm:text-lg font-bold tracking-[0.15em] uppercase" style={{ color: "hsl(24 94% 52% / 0.1)" }}>
              प्रज्ञा प्रवाह  •  विमर्श  •  शोध  •  प्रचार  •  समन्वय  •  युवा  • 
            </span>
          ))}
        </motion.div>
      </div>
    </>
  );
}
