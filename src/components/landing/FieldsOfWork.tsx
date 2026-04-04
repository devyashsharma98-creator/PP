"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useAnimationFrame } from "framer-motion";
import { ArrowRight, MessagesSquare, BookOpen, Megaphone, Flame } from "lucide-react";
import { workstreams } from "./data";
import { useAppContext } from "@/context/AppContext";

/* Rolling text band - right direction */
function RollingTextBand({ text, speed = 0.3 }: { text: string; speed?: number }) {
  const x = useMotionValue(0);
  const textWidth = text.length * 0.55;

  useAnimationFrame((time) => {
    const elapsed = time * 0.001 * speed;
    x.set(elapsed % textWidth);
  });

  return (
    <div className="overflow-hidden whitespace-nowrap py-3 border-y" style={{ borderColor: "hsl(38 15% 88% / 0.25)" }}>
      <motion.div style={{ x }} className="inline-flex whitespace-nowrap">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mx-5 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(24 94% 52% / 0.1)" }}>
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const iconMap = { MessagesSquare, BookOpen, Megaphone, Flame };

function WorkstreamCard({ stream, index }: { stream: typeof workstreams[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.96, 1]);
  const Icon = iconMap[stream.icon as keyof typeof iconMap];

  return (
    <motion.div ref={ref} style={{ y, opacity, scale }} className="group relative">
      <div className="relative p-8 sm:p-12 overflow-hidden transition-all duration-700 border"
        style={{ backgroundColor: "hsl(0 0% 100% / 0.5)", borderColor: "hsl(38 15% 88% / 0.35)" }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
          style={{ background: "linear-gradient(135deg, hsl(24 94% 52% / 0.03), transparent)" }}
        />

        <motion.span className="absolute -bottom-8 -right-6 font-bold select-none pointer-events-none leading-none hidden sm:block"
          style={{ fontSize: "clamp(100px, 12vw, 160px)", color: "hsl(222 47% 11% / 0.018)", fontFamily: "var(--font-display)" }}
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.3, duration: 1 }}
        >
          {String(index + 1).padStart(2, "0")}
        </motion.span>

        <div className="relative z-10">
          <div className="mb-8 sm:mb-10">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7 transition-all duration-500 group-hover:text-primary group-hover:scale-110" style={{ color: "hsl(24 94% 52% / 0.45)" }} />
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-1 transition-colors duration-500 group-hover:text-primary/80" style={{ color: "hsl(222 47% 11%)" }}>
            {stream.titleEn}
          </h3>
          <p className="font-devanagari text-lg sm:text-xl mb-6 sm:mb-8 pb-6 sm:pb-8 transition-colors duration-500 group-hover:text-primary/50" style={{ color: "hsl(222 47% 11% / 0.3)", borderBottom: "1px solid hsl(38 15% 88% / 0.35)" }}>
            {stream.titleHi}
          </p>

          <div className="space-y-3 mb-8 sm:mb-10">
            <p className="text-sm leading-relaxed" style={{ color: "hsl(220 12% 44% / 0.65)" }}>{stream.bodyEn}</p>
            <p className="font-devanagari text-sm leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.28)" }}>{stream.bodyHi}</p>
          </div>

          <Link href={stream.href} className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] transition-all duration-300 group/link" style={{ color: "hsl(24 94% 52% / 0.45)" }}>
            <span className="h-px w-8 sm:w-10 mr-3 sm:mr-4 transition-all duration-500 group-hover/link:w-14 sm:group-hover/link:w-18" style={{ backgroundColor: "hsl(24 94% 52% / 0.2)" }} />
            {stream.ctaEn}
            <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* Mobile card */
function MobileWorkCard({ stream, index }: { stream: typeof workstreams[number]; index: number }) {
  const Icon = iconMap[stream.icon as keyof typeof iconMap];
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 w-[300px] p-6 border relative overflow-hidden"
      style={{ backgroundColor: "hsl(0 0% 100% / 0.6)", borderColor: "hsl(38 15% 88% / 0.4)" }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, hsl(24 94% 52% / 0.3), transparent)" }} />
      
      <div className="flex items-center justify-between mb-5">
        <Icon className="h-5 w-5" style={{ color: "hsl(24 94% 52% / 0.45)" }} />
        <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(220 12% 44% / 0.12)" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      
      <h3 className="text-xl font-bold tracking-tight mb-0.5" style={{ color: "hsl(222 47% 11%)" }}>{stream.titleEn}</h3>
      <p className="font-devanagari text-sm mb-4" style={{ color: "hsl(222 47% 11% / 0.3)" }}>{stream.titleHi}</p>
      <p className="text-xs leading-relaxed mb-2" style={{ color: "hsl(220 12% 44% / 0.6)" }}>{stream.bodyEn}</p>
      <p className="font-devanagari text-xs leading-relaxed mb-5" style={{ color: "hsl(222 47% 11% / 0.25)" }}>{stream.bodyHi}</p>
      
      <Link href={stream.href} className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.25em]" style={{ color: "hsl(24 94% 52% / 0.4)" }}>
        {stream.ctaEn}
        <ArrowRight className="ml-2 h-3 w-3" />
      </Link>
    </motion.div>
  );
}

export function FieldsOfWork() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <RollingTextBand text="विमर्श  •  शोध  •  प्रचार  •  युवा  •  " speed={0.25} />
      <section ref={sectionRef} className="relative py-24 sm:py-44 border-t" style={{ borderColor: "hsl(38 15% 88% / 0.25)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(180deg, hsl(38 40% 96.5%), hsl(24 94% 52% / 0.012), hsl(38 40% 96.5%))" }}
        />

        <div className="mx-auto max-w-7xl px-5 sm:px-6 relative z-10">
          <div className="text-center mb-16 sm:mb-32">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                <motion.div className="h-px w-10 sm:w-14" style={{ backgroundColor: "hsl(24 94% 52% / 0.25)" }}
                  initial={{ scaleX: 0, originX: 1 }} whileInView={{ scaleX: 1, originX: 0 }} viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.35em]" style={{ color: "hsl(24 94% 52% / 0.45)" }}>
                  Fields of Work <span className="font-devanagari tracking-[0.15em] sm:tracking-[0.2em]" style={{ color: "hsl(24 94% 52% / 0.28)" }}>कार्य के आयाम</span>
                </p>
                <motion.div className="h-px w-10 sm:w-14" style={{ backgroundColor: "hsl(24 94% 52% / 0.25)" }}
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-6 sm:mb-8" style={{ color: "hsl(222 47% 11%)" }}>
                <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="block">
                  Disciplined
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.45, ease: [0.16, 1, 0.3, 1] }} className="block" style={{ color: "hsl(24 94% 52%)", fontStyle: "italic" }}>
                  workstreams
                </motion.span>
              </h2>

              <motion.p className="font-devanagari text-lg sm:text-xl mb-8 sm:mb-10" style={{ color: "hsl(222 47% 11% / 0.3)" }}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }}
              >
                विमर्श, शोध और प्रसार के आयाम
              </motion.p>

              <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 text-left">
                <motion.p className="text-sm leading-relaxed" style={{ color: "hsl(220 12% 44% / 0.6)" }}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.7 }}
                >
                  Each aayam represents an active field of coordination, moving vision into different forms of organised public presence.
                </motion.p>
                <motion.p className="font-devanagari text-sm leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.28)" }}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.85 }}
                >
                  प्रत्येक आयाम केवल नाम नहीं है, बल्कि विचार, समन्वय और संस्थागत कार्य का सक्रिय क्षेत्र है।
                </motion.p>
              </div>
            </motion.div>
          </div>

          <div className="hidden sm:grid gap-6 sm:grid-cols-2">
            {workstreams.map((stream, index) => (
              <WorkstreamCard key={stream.titleEn} stream={stream} index={index} />
            ))}
          </div>

          <div className="sm:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {workstreams.map((stream, index) => (
                <div key={stream.titleEn} className="snap-start">
                  <MobileWorkCard stream={stream} index={index} />
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {workstreams.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "hsl(24 94% 52% / 0.12)" }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
