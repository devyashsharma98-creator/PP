"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionValue, useAnimationFrame } from "framer-motion";
import { Compass, Network, Shield } from "lucide-react";
import { institutionCards } from "./data";

/* Rolling text band */
function RollingTextBand({ text, speed = 0.35 }: { text: string; speed?: number }) {
  const x = useMotionValue(0);
  const textWidth = text.length * 0.55;

  useAnimationFrame((time) => {
    const elapsed = time * 0.001 * speed;
    x.set(-(elapsed % textWidth));
  });

  return (
    <div className="overflow-hidden whitespace-nowrap py-3 border-y" style={{ borderColor: "hsl(38 15% 88% / 0.25)" }}>
      <motion.div style={{ x }} className="inline-flex whitespace-nowrap">
        {Array.from({ length: 14 }).map((_, i) => (
          <span key={i} className="mx-5 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(222 47% 11% / 0.06)" }}>
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

const iconMap = { Compass, Network, Shield };

function CardItem({ card, index }: { card: typeof institutionCards[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const Icon = iconMap[card.icon as keyof typeof iconMap];

  return (
    <motion.div ref={ref} style={{ y, opacity }} className="group relative">
      <div className="absolute left-0 top-0 bottom-0 w-px" style={{ backgroundColor: "hsl(38 15% 88% / 0.4)" }} />
      <motion.div 
        className="absolute left-0 top-0 w-px"
        style={{ backgroundColor: "hsl(24 94% 52% / 0.3)" }}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.2 + 0.3, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      />
      
      <div className="pl-8 pt-8 pb-12">
        <motion.p className="text-[9px] font-bold uppercase tracking-[0.35em] mb-10" style={{ color: "hsl(24 94% 52% / 0.25)" }}
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          transition={{ delay: index * 0.15 + 0.3 }}
        >
          {String(index + 1).padStart(2, "0")}
        </motion.p>

        <motion.div className="mb-8" whileHover={{ scale: 1.08 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <div className="w-11 h-11 flex items-center justify-center border transition-all duration-700 group-hover:border-primary/30 group-hover:bg-primary/5"
            style={{ borderColor: "hsl(38 15% 88%)", backgroundColor: "hsl(24 94% 52% / 0.03)" }}
          >
            <Icon className="h-5 w-5 transition-all duration-500 group-hover:text-primary group-hover:rotate-6" style={{ color: "hsl(24 94% 52% / 0.5)" }} />
          </div>
        </motion.div>

        <h3 className="text-2xl font-bold tracking-tight leading-tight mb-1 transition-colors duration-500 group-hover:text-primary/80" style={{ color: "hsl(222 47% 11%)" }}>
          {card.titleEn}
        </h3>
        <p className="font-devanagari text-base mb-8 transition-colors duration-500 group-hover:text-primary/60" style={{ color: "hsl(222 47% 11% / 0.35)" }}>
          {card.titleHi}
        </p>
        
        <p className="text-sm leading-relaxed mb-3" style={{ color: "hsl(220 12% 44% / 0.7)" }}>{card.bodyEn}</p>
        <p className="font-devanagari text-sm leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.3)" }}>{card.bodyHi}</p>
      </div>
    </motion.div>
  );
}

/* Mobile card */
function MobileCard({ card, index }: { card: typeof institutionCards[number]; index: number }) {
  const Icon = iconMap[card.icon as keyof typeof iconMap];
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ delay: index * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex-shrink-0 w-[280px] p-6 border relative overflow-hidden"
      style={{ backgroundColor: "hsl(0 0% 100% / 0.6)", borderColor: "hsl(38 15% 88% / 0.4)" }}
    >
      <div className="absolute top-0 left-6 right-6 h-px" style={{ background: "linear-gradient(90deg, hsl(24 94% 52% / 0.35), transparent)" }} />
      
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 flex items-center justify-center border flex-shrink-0"
          style={{ borderColor: "hsl(38 15% 88%)", backgroundColor: "hsl(24 94% 52% / 0.03)" }}
        >
          <Icon className="h-4 w-4" style={{ color: "hsl(24 94% 52% / 0.5)" }} />
        </div>
        <p className="text-[8px] font-bold uppercase tracking-[0.3em] mt-2" style={{ color: "hsl(24 94% 52% / 0.25)" }}>
          {String(index + 1).padStart(2, "0")}
        </p>
      </div>
      
      <h3 className="text-lg font-bold tracking-tight mb-0.5" style={{ color: "hsl(222 47% 11%)" }}>{card.titleEn}</h3>
      <p className="font-devanagari text-sm mb-4" style={{ color: "hsl(222 47% 11% / 0.35)" }}>{card.titleHi}</p>
      <p className="text-xs leading-relaxed mb-2" style={{ color: "hsl(220 12% 44% / 0.65)" }}>{card.bodyEn}</p>
      <p className="font-devanagari text-xs leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.28)" }}>{card.bodyHi}</p>
    </motion.div>
  );
}

export function InstitutionalFraming() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end start"] });
  const bgOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <>
      <section ref={sectionRef} className="relative py-24 sm:py-44" id="work">
        <motion.div className="absolute inset-0 pointer-events-none"
          style={{ opacity: bgOpacity, background: "radial-gradient(ellipse 50% 40% at 50% 50%, hsl(24 94% 52% / 0.015), transparent)" }}
        />

        <div className="mx-auto max-w-7xl px-5 sm:px-6 relative z-10">
          <div className="mb-16 sm:mb-32">
            <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}>
              <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
                <motion.div className="h-px w-10 sm:w-14" style={{ backgroundColor: "hsl(24 94% 52% / 0.3)" }}
                  initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                />
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.35em]" style={{ color: "hsl(24 94% 52% / 0.5)" }}>
                  Institutional Concept <span className="font-devanagari tracking-[0.15em] sm:tracking-[0.2em]" style={{ color: "hsl(24 94% 52% / 0.3)" }}>संस्थागत परिचय</span>
                </p>
              </div>

              <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight leading-[0.95] mb-6 sm:mb-8" style={{ color: "hsl(222 47% 11%)" }}>
                <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }} className="block">
                  A forum with
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 60, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.45, ease: [0.16, 1, 0.3, 1] }} className="block" style={{ color: "hsl(24 94% 52%)", fontStyle: "italic" }}>
                  organised depth
                </motion.span>
              </h2>

              <motion.p className="font-devanagari text-lg sm:text-xl mb-8 sm:mb-10" style={{ color: "hsl(222 47% 11% / 0.35)" }}
                initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }}
              >
                वैचारिक मंच, संगठनात्मक गहराई के साथ
              </motion.p>

              <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                <motion.p className="text-sm leading-relaxed" style={{ color: "hsl(220 12% 44% / 0.65)" }}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.7 }}
                >
                  Pragya Pravah sits between civilisational reflection and coordinated action. We develop discourse, nurture research, and translate thought into institutional form.
                </motion.p>
                <motion.p className="font-devanagari text-sm leading-relaxed" style={{ color: "hsl(222 47% 11% / 0.3)" }}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.85 }}
                >
                  प्रज्ञा प्रवाह केवल सांस्कृतिक भावभूमि नहीं है। यह ऐसा बौद्धिक मंच है जो विमर्श गढ़ता है, शोध को पोषित करता है और विचार को संगठित सार्वजनिक कार्य तक ले जाता है।
                </motion.p>
              </div>
            </motion.div>
          </div>

          <div className="hidden sm:grid gap-0 lg:grid-cols-3">
            {institutionCards.map((card, index) => (
              <CardItem key={card.titleEn} card={card} index={index} />
            ))}
          </div>

          <div className="sm:hidden">
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 snap-x snap-mandatory" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
              {institutionCards.map((card, index) => (
                <div key={card.titleEn} className="snap-start">
                  <MobileCard card={card} index={index} />
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {institutionCards.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "hsl(24 94% 52% / 0.15)" }} />
              ))}
            </div>
          </div>
        </div>
      </section>
      <RollingTextBand text="बौद्धिक मंच  •  संगठित कार्य  •  भारतीय ज्ञान-दृष्टि  •  " speed={0.3} />
    </>
  );
}
