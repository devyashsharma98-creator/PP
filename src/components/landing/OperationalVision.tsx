"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useAnimationFrame } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeepMandala } from "./shared";
import { operationsSteps } from "./data";
import { useAppContext } from "@/context/AppContext";

/* Rolling text band */
function RollingTextBand({ text, speed = 0.3 }: { text: string; speed?: number }) {
  const x = useMotionValue(0);
  const textWidth = text.length * 0.55;
  useAnimationFrame((time) => {
    x.set((time * 0.001 * speed) % textWidth);
  });
  return (
    <div className="overflow-hidden whitespace-nowrap py-3 border-y" style={{ borderColor: "hsl(38 15% 88% / 0.25)" }}>
      <motion.div style={{ x }} className="inline-flex whitespace-nowrap">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mx-5 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(24 94% 52% / 0.08)" }}>{text}</span>
        ))}
      </motion.div>
    </div>
  );
}

export function OperationalVision() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <RollingTextBand text="समीक्षा  •  प्रकाशन  •  प्रचार  •  समन्वय  •  " speed={0.25} />
      <section ref={sectionRef} className="relative py-24 sm:py-44 overflow-hidden" id="console">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, hsl(222 47% 11% / 0.015) 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="mx-auto max-w-7xl px-5 sm:px-6 relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start sm:gap-16">
            <div className="space-y-12 sm:space-y-16">
              <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
                <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                  <motion.div className="h-px w-10 sm:w-14" style={{ backgroundColor: "hsl(24 94% 52% / 0.25)" }}
                    initial={{ scaleX: 0, originX: 1 }} whileInView={{ scaleX: 1, originX: 0 }} viewport={{ once: true }}
                    transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.35em]" style={{ color: "hsl(24 94% 52% / 0.45)" }}>
                    Operational Vision <span className="font-devanagari tracking-[0.15em] sm:tracking-[0.2em]" style={{ color: "hsl(24 94% 52% / 0.28)" }}>कार्य से प्रणाली तक</span>
                  </p>
                </div>

                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[0.95] mb-6 sm:mb-8" style={{ color: "hsl(222 47% 11%)" }}>
                  <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="block">
                    The flow of
                  </motion.span>
                  <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.45, ease: [0.16, 1, 0.3, 1] }} className="block" style={{ color: "hsl(24 94% 52%)", fontStyle: "italic" }}>
                    mission
                  </motion.span>
                </h2>

                <motion.p className="font-devanagari text-lg sm:text-xl mb-8 sm:mb-10" style={{ color: "hsl(222 47% 11% / 0.3)" }}
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }}
                >
                  संगठित कार्य-रूप
                </motion.p>

                <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                  <motion.p className="text-sm leading-relaxed" style={{ color: "hsl(220 12% 44% / 0.6)" }}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.7 }}
                  >
                    Our institutional workflows convert philosophical vision into daily operations across review, publication, and coordination.
                  </motion.p>
                  <motion.p className="font-devanagari text-sm leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.25)" }}
                    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.85 }}
                  >
                    विमर्श, समीक्षा, प्रकाशन और प्रचार किस प्रकार वास्तविक संस्थागत कार्यप्रवाह में चलते हैं।
                  </motion.p>
                </div>
              </motion.div>

              <div className="space-y-0 pl-2" style={{ borderLeft: "2px solid hsl(24 94% 52% / 0.06)" }}>
                {operationsSteps.map((step, index) => (
                  <motion.div key={step.step}
                    initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: index * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative pl-8 sm:pl-10 py-7 sm:py-9 group"
                  >
                    <motion.div className="absolute -left-[8px] sm:-left-[9px] top-9 sm:top-11 flex h-[14px] sm:h-[16px] w-[14px] sm:w-[16px] items-center justify-center rounded-sm border-2 transition-all duration-500 group-hover:border-primary/35"
                      style={{ backgroundColor: "hsl(38 40% 96.5%)", borderColor: "hsl(24 94% 52% / 0.18)" }}
                      whileHover={{ scale: 1.4 }}
                    >
                      <div className="h-1 sm:h-1.5 w-1 sm:w-1.5 rounded-sm transition-colors duration-500 group-hover:bg-primary" style={{ backgroundColor: "hsl(24 94% 52% / 0.35)" }} />
                    </motion.div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <h4 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2 sm:gap-3 transition-colors duration-500 group-hover:text-primary/80" style={{ color: "hsl(222 47% 11%)" }}>
                        {step.titleEn}
                        <span style={{ color: "hsl(220 12% 44% / 0.12)" }}>|</span>
                        <span className="font-devanagari font-medium" style={{ color: "hsl(222 47% 11% / 0.3)" }}>{step.titleHi}</span>
                      </h4>
                      <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "hsl(220 12% 44% / 0.55)" }}>{step.bodyEn}</p>
                      <p className="font-devanagari text-xs sm:text-sm leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.25)" }}>{step.bodyHi}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:sticky lg:top-24"
            >
              <div className="relative p-6 sm:p-10 lg:p-12 overflow-hidden border shadow-xl"
                style={{ backgroundColor: "hsl(0 0% 100% / 0.55)", backdropFilter: "blur(12px)", borderColor: "hsl(38 15% 88% / 0.35)", boxShadow: "0 40px 80px -20px hsl(222 47% 11% / 0.05), 0 0 0 1px hsl(38 15% 88% / 0.15)" }}
              >
                <motion.div className="absolute -right-24 -bottom-24 pointer-events-none hidden sm:block" animate={{ rotate: 360 }} transition={{ duration: 70, repeat: Infinity, ease: "linear" }}>
                  <DeepMandala className="h-80 w-80 text-primary/[0.02]" />
                </motion.div>
                <motion.div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, hsl(24 94% 52% / 0.3), transparent)" }}
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                />

                <div className="relative z-10 space-y-8 sm:space-y-10">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2" style={{ color: "hsl(222 47% 11%)" }}>Experience the Console</h3>
                    <p className="font-devanagari text-sm sm:text-base leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.3)" }}>
                      देखें कि विचार किस प्रकार एक अनुशासित प्रणाली के माध्यम से समाज तक पहुँचते हैं।
                    </p>
                  </div>

                  <div className="space-y-3 sm:space-y-4">
                    {[
                      { num: "01", text: "A unified digital system for review and publication pipeline." },
                      { num: "02", text: "Real-time workflow coordination across all units." },
                      { num: "03", text: "Role-based access with disciplined institutional hierarchy." },
                    ].map((item, i) => (
                      <motion.div key={item.num}
                        initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        transition={{ delay: 0.5 + i * 0.15, duration: 0.8 }}
                        className="flex items-start gap-3 sm:gap-4 p-4 sm:p-5 border-l-2 transition-all duration-500"
                        style={{ borderLeftColor: "hsl(24 94% 52% / 0.12)", backgroundColor: "hsl(38 40% 96.5% / 0.35)" }}
                      >
                        <span className="font-bold mt-0.5 text-[8px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.25em] flex-shrink-0" style={{ color: "hsl(24 94% 52% / 0.35)" }}>{item.num}</span>
                        <p className="text-xs sm:text-sm leading-relaxed font-medium" style={{ color: "hsl(222 47% 11% / 0.65)" }}>{item.text}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-5 sm:pt-6" style={{ borderTop: "1px solid hsl(38 15% 88% / 0.35)" }}>
                    <Button asChild size="lg" className="h-11 sm:h-12 rounded-none px-5 sm:px-6 group w-full sm:w-auto" style={{ backgroundColor: "hsl(222 47% 11%)", boxShadow: "0 4px 16px -4px hsl(222 47% 11% / 0.15)" }}>
                      <Link href="/login">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">{isHi ? "डेमो प्रणाली" : "Enter Console"}</span>
                        <ArrowRight className="ml-2 sm:ml-3 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="h-11 sm:h-12 rounded-none px-5 sm:px-6 hover:bg-card/50 transition-all duration-500 w-full sm:w-auto" style={{ borderColor: "hsl(38 15% 88% / 0.35)", backgroundColor: "transparent" }}>
                      <Link href="/dashboard">
                        <span className="text-[9px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]" style={{ color: "hsl(222 47% 11% / 0.45)" }}>{isHi ? "कार्यप्रवाह" : "See Dashboard"}</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
