"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, useAnimationFrame } from "framer-motion";

/* Scroll progress bar */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, hsl(24 94% 52%), hsl(24 94% 52% / 0.6), transparent)",
      }}
    />
  );
}

/* Cursor-following glow effect - desktop only */
export function CursorGlow() {
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };
    const handleLeave = () => setIsVisible(false);
    const handleEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
    };
  }, [mouseX, mouseY, isVisible, isTouch]);

  if (isTouch || typeof window === "undefined") return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-30"
      style={{
        opacity: useTransform(mouseX, [-1000, 0], [0, 1]),
        background: useTransform(
          [mouseX, mouseY],
          ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, hsl(24 94% 52% / 0.025), transparent 40%)`
        ),
      }}
    />
  );
}

/* Smooth scroll provider with Lenis */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    import("lenis").then(({ default: Lenis }) => {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    });
  }, []);

  return <div ref={containerRef}>{children}</div>;
}

/* Scroll-driven text that shifts color based on scroll position */
export function ScrollTextReveal({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0.15, 1]);
  const y = useTransform(scrollYProgress, [0, 0.5], [30, 0]);

  return (
    <motion.span ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.span>
  );
}

/* Rolling text band - continuous horizontal scroll */
export function RollingTextBand({
  text,
  direction = "left",
  speed = 0.4,
  className = "",
}: {
  text: string;
  direction?: "left" | "right";
  speed?: number;
  className?: string;
}) {
  const x = useMotionValue(0);
  const textWidth = text.length * 0.55;

  useAnimationFrame((time) => {
    const elapsed = time * 0.001 * speed;
    const offset = direction === "left" ? -(elapsed % textWidth) : (elapsed % textWidth);
    x.set(offset);
  });

  return (
    <div className={`overflow-hidden whitespace-nowrap py-3 sm:py-4 border-y ${className}`} style={{ borderColor: "hsl(38 15% 88% / 0.25)" }}>
      <motion.div style={{ x }} className="inline-flex whitespace-nowrap">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mx-4 sm:mx-6 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(24 94% 52% / 0.08)" }}>
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* Counter animation that triggers on scroll */
export function CounterAnimation({
  target,
  suffix = "",
  prefix = "",
}: {
  target: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end center"],
  });

  const count = useTransform(scrollYProgress, [0, 1], [0, target]);
  const [rounded, setRounded] = useState(0);

  count.on("change", (latest) => setRounded(Math.round(latest)));

  return (
    <span ref={ref}>
      {prefix}
      {rounded}
      {suffix}
    </span>
  );
}

/* Parallax image/container */
export function ParallaxContainer({
  children,
  speed = 0.3,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [-50 * speed, 50 * speed]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
