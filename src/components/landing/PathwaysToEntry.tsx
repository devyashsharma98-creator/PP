"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useAnimationFrame } from "framer-motion";
import { ArrowRight, Compass, BookOpen, Users } from "lucide-react";
import { audiencePaths } from "./data";
import { useAppContext } from "@/context/AppContext";

/* Rolling text band */
function RollingTextBand({ text, speed = 0.3 }: { text: string; speed?: number }) {
  const x = useMotionValue(0);
  const textWidth = text.length * 0.55;
  useAnimationFrame((time) => {
    x.set(-(time * 0.001 * speed % textWidth));
  });

  return (
    <div className="overflow-hidden whitespace-nowrap py-3 border-y" style={{ borderColor: "hsl(38 15% 88% / 0.25)" }}>
      <motion.div style={{ x }} className="inline-flex whitespace-nowrap">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mx-5 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(222 47% 11% / 0.05)" }}>{text}</span>
        ))}
      </motion.div>
    </div>
  );
}

const iconMap = { Compass, BookOpen, Users };

export function PathwaysToEntry() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <RollingTextBand text="आगंतुक  •  चिंतक  •  आयोजक  •  " speed={0.28} />
      <section ref={sectionRef} className="relative py-24 sm:py-44 overflow-hidden" id="paths">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 70% 50% at 30% 50%, hsl(222 47% 11% / 0.012), transparent)" }} />

        <div className="mx-auto max-w-7xl px-5 sm:px-6 relative z-10">
          <div className="text-center mb-16 sm:mb-32">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                <motion.div className="h-px w-10 sm:w-14" style={{ backgroundColor: "hsl(24 94% 52% / 0.25)" }}
                  initial={{ scaleX: 0, originX: 1 }} whileInView={{ scaleX: 1, originX: 0 }} viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.35em]" style={{ color: "hsl(24 94% 52% / 0.45)" }}>
                  Choose Your Path <span className="font-devanagari tracking-[0.15em] sm:tracking-[0.2em]" style={{ color: "hsl(24 94% 52% / 0.28)" }}>प्रवेश का मार्ग</span>
                </p>
                <motion.div className="h-px w-10 sm:w-14" style={{ backgroundColor: "hsl(24 94% 52% / 0.25)" }}
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-6 sm:mb-8" style={{ color: "hsl(222 47% 11%)" }}>
                <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="block">
                  Enter the
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.45, ease: [0.16, 1, 0.3, 1] }} className="block" style={{ color: "hsl(24 94% 52%)", fontStyle: "italic" }}>
                  institution
                </motion.span>
              </h2>

              <motion.p className="font-devanagari text-lg sm:text-xl" style={{ color: "hsl(222 47% 11% / 0.3)" }}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }}
              >
                स्वाभाविक प्रवेश-द्वार
              </motion.p>
            </motion.div>
          </div>

          {/* Desktop: asymmetric grid */}
          <div className="hidden lg:grid gap-6 lg:grid-cols-[1.2fr_1fr_1fr]">
            {audiencePaths.map((path, index) => {
              const Icon = iconMap[path.icon as keyof typeof iconMap];
              return (
                <motion.div key={path.titleEn}
                  initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative p-8 sm:p-10 border transition-all duration-700 hover:border-primary/15"
                  style={{ backgroundColor: index === 0 ? "hsl(0 0% 100% / 0.55)" : "transparent", borderColor: "hsl(38 15% 88% / 0.35)" }}
                >
                  <div className="absolute top-6 right-6 text-[9px] font-bold tracking-[0.25em]" style={{ color: "hsl(220 12% 44% / 0.1)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <motion.div className="mb-8 transition-all duration-500 group-hover:text-primary/50 group-hover:scale-105" style={{ color: "hsl(222 47% 11% / 0.2)" }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Icon className="h-6 w-6" />
                  </motion.div>
                  <h3 className="text-2xl font-bold tracking-tight mb-1 transition-colors duration-500 group-hover:text-primary/80" style={{ color: "hsl(222 47% 11%)" }}>{path.titleEn}</h3>
                  <p className="font-devanagari text-base mb-8 transition-colors duration-500 group-hover:text-primary/50" style={{ color: "hsl(222 47% 11% / 0.3)" }}>{path.titleHi}</p>
                  <div className="space-y-3 mb-10">
                    <p className="text-sm leading-relaxed" style={{ color: "hsl(220 12% 44% / 0.6)" }}>{path.bodyEn}</p>
                    <p className="font-devanagari text-sm leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.25)" }}>{path.bodyHi}</p>
                  </div>
                  <div className="pt-6" style={{ borderTop: "1px solid hsl(38 15% 88% / 0.3)" }}>
                    <Link href={path.href} className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.25em] transition-all duration-300 group/link" style={{ color: "hsl(24 94% 52% / 0.4)" }}>
                      {isHi ? path.ctaHi : path.ctaEn}
                      <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Tablet: 3-col */}
          <div className="hidden sm:grid lg:hidden gap-6 sm:grid-cols-3">
            {audiencePaths.map((path, index) => {
              const Icon = iconMap[path.icon as keyof typeof iconMap];
              return (
                <motion.div key={path.titleEn}
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative p-6 sm:p-8 border transition-all duration-700 hover:border-primary/15"
                  style={{ backgroundColor: "hsl(0 0% 100% / 0.4)", borderColor: "hsl(38 15% 88% / 0.35)" }}
                >
                  <div className="absolute top-4 right-4 text-[8px] font-bold tracking-[0.2em]" style={{ color: "hsl(220 12% 44% / 0.08)" }}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="mb-6 transition-all duration-500 group-hover:text-primary/50 group-hover:scale-105" style={{ color: "hsl(222 47% 11% / 0.2)" }}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-0.5" style={{ color: "hsl(222 47% 11%)" }}>{path.titleEn}</h3>
                  <p className="font-devanagari text-sm mb-6" style={{ color: "hsl(222 47% 11% / 0.3)" }}>{path.titleHi}</p>
                  <div className="space-y-2 mb-8">
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(220 12% 44% / 0.6)" }}>{path.bodyEn}</p>
                    <p className="font-devanagari text-xs leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.25)" }}>{path.bodyHi}</p>
                  </div>
                  <div className="pt-4" style={{ borderTop: "1px solid hsl(38 15% 88% / 0.3)" }}>
                    <Link href={path.href} className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.25em] transition-all duration-300 group/link" style={{ color: "hsl(24 94% 52% / 0.4)" }}>
                      {isHi ? path.ctaHi : path.ctaEn}
                      <ArrowRight className="ml-2 h-3 w-3 transition-transform duration-300 group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile: stacked */}
          <div className="sm:hidden space-y-4">
            {audiencePaths.map((path, index) => {
              const Icon = iconMap[path.icon as keyof typeof iconMap];
              return (
                <motion.div key={path.titleEn}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-30px" }}
                  transition={{ delay: index * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative p-5 border overflow-hidden"
                  style={{ backgroundColor: index === 0 ? "hsl(0 0% 100% / 0.65)" : index === 1 ? "hsl(0 0% 100% / 0.35)" : "transparent", borderColor: "hsl(38 15% 88% / 0.35)" }}
                >
                  <div className="absolute left-0 top-4 bottom-4 w-0.5" style={{ backgroundColor: index === 0 ? "hsl(24 94% 52% / 0.35)" : "hsl(24 94% 52% / 0.12)" }} />
                  <div className="flex items-start gap-3 mb-4 pl-3">
                    <div className="w-9 h-9 flex items-center justify-center border flex-shrink-0" style={{ borderColor: "hsl(38 15% 88% / 0.4)", backgroundColor: "hsl(24 94% 52% / 0.03)" }}>
                      <Icon className="h-4 w-4" style={{ color: "hsl(24 94% 52% / 0.45)" }} />
                    </div>
                    <p className="text-[8px] font-bold uppercase tracking-[0.25em] mt-1.5" style={{ color: "hsl(24 94% 52% / 0.2)" }}>{String(index + 1).padStart(2, "0")}</p>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-0.5 pl-3" style={{ color: "hsl(222 47% 11%)" }}>{path.titleEn}</h3>
                  <p className="font-devanagari text-sm mb-4 pl-3" style={{ color: "hsl(222 47% 11% / 0.3)" }}>{path.titleHi}</p>
                  <p className="text-xs leading-relaxed mb-2 pl-3" style={{ color: "hsl(220 12% 44% / 0.55)" }}>{path.bodyEn}</p>
                  <p className="font-devanagari text-xs leading-relaxed mb-5 pl-3" style={{ color: "hsl(222 47% 11% / 0.25)" }}>{path.bodyHi}</p>
                  <div className="pl-3 pt-3" style={{ borderTop: "1px solid hsl(38 15% 88% / 0.25)" }}>
                    <Link href={path.href} className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "hsl(24 94% 52% / 0.4)" }}>
                      {isHi ? path.ctaHi : path.ctaEn}
                      <ArrowRight className="ml-2 h-3 w-3" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
