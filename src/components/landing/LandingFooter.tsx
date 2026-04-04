"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, Mail, MapPin, ChevronDown } from "lucide-react";
import { DeepMandala } from "./shared";
import { BrandLogo } from "./BrandLogo";
import { useAppContext } from "@/context/AppContext";

const quickLinks = [
  { href: "/parichay", labelEn: "About", labelHi: "परिचय" },
  { href: "/vimarsh", labelEn: "Vimarsh", labelHi: "विमर्श" },
  { href: "/library", labelEn: "E-Library", labelHi: "ई-पुस्तकालय" },
  { href: "/prachar", labelEn: "Prachar", labelHi: "प्रचार" },
  { href: "/directory", labelEn: "Directory", labelHi: "निर्देशिका" },
];

const institutionalLinks = [
  { href: "/dashboard", labelEn: "Dashboard", labelHi: "डैशबोर्ड" },
  { href: "/login", labelEn: "Console Login", labelHi: "प्रणाली प्रवेश" },
];

function MobileAccordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.04)" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4">
        <span className="text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: "hsl(24 94% 52% / 0.4)" }}>{title}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="h-4 w-4" style={{ color: "hsl(0 0% 100% / 0.15)" }} />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden pb-4">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingFooter() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start end", "end end"] });
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 0.3], [60, 0]);

  return (
    <footer ref={sectionRef} className="relative overflow-hidden" style={{ backgroundColor: "hsl(222 47% 11%)" }} id="footer">
      <div className="absolute inset-0 opacity-[0.02] bg-noise pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, hsl(24 94% 52% / 0.25), transparent)" }} />

      {/* Rolling text band */}
      <div className="relative overflow-hidden whitespace-nowrap border-b" style={{ borderColor: "hsl(222 47% 11% / 0.7)" }}>
        <motion.div className="inline-flex whitespace-nowrap py-4"
          animate={{ x: ["0%", "-50%"] }} transition={{ x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" } }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="mx-6 text-sm font-bold tracking-[0.2em] uppercase" style={{ color: "hsl(24 94% 52% / 0.06)" }}>प्रज्ञा प्रवाह  •  </span>
          ))}
        </motion.div>
      </div>

      {/* Closing statement */}
      <motion.div className="relative z-10 mx-auto max-w-5xl px-5 pt-20 pb-16 text-center space-y-8 sm:px-6 sm:pt-28 sm:pb-24 sm:space-y-12" style={{ opacity, y }}>
        <motion.div initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}>
          <DeepMandala className="h-14 w-14 sm:h-20 sm:w-20 mx-auto mb-6 sm:mb-10 text-background/[0.035]" />
        </motion.div>

        <div className="space-y-5 sm:space-y-8">
          <motion.h2 className="text-2xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]" style={{ color: "hsl(0 0% 100% / 0.85)" }}
            initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Giving institutional strength to{" "}
            <br className="hidden sm:block" />
            <span style={{ color: "hsl(24 94% 52%)", fontStyle: "italic" }}>Bharat-centred thought.</span>
          </motion.h2>

          <motion.p className="font-devanagari text-lg sm:text-2xl font-medium" style={{ color: "hsl(0 0% 100% / 0.25)" }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }}
          >
            भारत-केंद्रित चिंतन को समकालीन समाज में संस्थागत शक्ति देना।
          </motion.p>
        </div>

        <motion.div className="pt-8 sm:pt-12" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.6 }}>
          <Link href="/directory" className="inline-flex items-center gap-3 sm:gap-4 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.25em] sm:tracking-[0.3em] transition-colors duration-500 group" style={{ color: "hsl(0 0% 100% / 0.2)" }}>
            <span className="h-px w-10 sm:w-14 transition-all duration-500 group-hover:w-16 sm:group-hover:w-20" style={{ backgroundColor: "hsl(0 0% 100% / 0.06)" }} />
            Connect <span className="font-devanagari tracking-[0.15em] sm:tracking-[0.2em]" style={{ color: "hsl(0 0% 100% / 0.12)" }}>संवाद से जुड़ें</span>
            <ArrowRight className="h-3 sm:h-3.5 w-3 sm:w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </motion.div>

      {/* Desktop footer */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 hidden sm:block" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.04)" }}>
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <BrandLogo size="md" />
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: "hsl(0 0% 100% / 0.25)" }}>
              A Bharatiya intellectual forum converting philosophical reflection into disciplined institutional action.
            </p>
            <p className="font-devanagari text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.18)" }}>
              दार्शनिक चिंतन को अनुशासित संस्थागत कार्य में परिवर्तित करने वाला भारतीय बौद्धिक मंच।
            </p>
          </div>

          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-6" style={{ color: "hsl(24 94% 52% / 0.4)" }}>{isHi ? "त्वरित लिंक" : "Quick Links"}</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex items-center gap-2 text-sm transition-all duration-300 group" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
                    <span>{isHi ? link.labelHi : link.labelEn}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: "hsl(24 94% 52%)" }} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-6" style={{ color: "hsl(24 94% 52% / 0.4)" }}>{isHi ? "संस्थागत" : "Institutional"}</h3>
            <ul className="space-y-3">
              {institutionalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="inline-flex items-center gap-2 text-sm transition-all duration-300 group" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
                    <span>{isHi ? link.labelHi : link.labelEn}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: "hsl(24 94% 52%)" }} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-[9px] font-bold uppercase tracking-[0.3em] mb-6" style={{ color: "hsl(24 94% 52% / 0.4)" }}>{isHi ? "संपर्क" : "Contact"}</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(24 94% 52% / 0.35)" }} />
                <span>Bhopal Vibhag, Madhya Pradesh, India</span>
              </li>
              <li className="flex items-center gap-3 text-sm" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
                <Mail className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(24 94% 52% / 0.35)" }} />
                <a href="mailto:contact@pragyapravah.org" className="transition-colors hover:text-primary/80">contact@pragyapravah.org</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.03)" }}>
          <p className="text-[9px]" style={{ color: "hsl(0 0% 100% / 0.12)" }}>
            &copy; {new Date().getFullYear()} Pragya Pravah, Bhopal Vibhag. {isHi ? "सर्वाधिकार सुरक्षित।" : "All rights reserved."}
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-[9px] transition-colors hover:text-primary/60" style={{ color: "hsl(0 0% 100% / 0.12)" }}>{isHi ? "गोपनीयता" : "Privacy"}</Link>
            <Link href="/terms" className="text-[9px] transition-colors hover:text-primary/60" style={{ color: "hsl(0 0% 100% / 0.12)" }}>{isHi ? "नियम" : "Terms"}</Link>
          </div>
        </div>
      </div>

      {/* Mobile footer */}
      <div className="relative z-10 px-5 pb-8 sm:hidden" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.04)" }}>
        <div className="py-6" style={{ borderBottom: "1px solid hsl(0 0% 100% / 0.04)" }}>
          <BrandLogo size="sm" />
          <p className="text-xs mt-4 leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.22)" }}>
            A Bharatiya intellectual forum converting philosophical reflection into disciplined institutional action.
          </p>
        </div>

        <MobileAccordion title={isHi ? "त्वरित लिंक" : "Quick Links"}>
          <ul className="space-y-3 pl-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm flex items-center gap-2" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
                  <span>{isHi ? link.labelHi : link.labelEn}</span>
                  <ArrowRight className="h-3 w-3" style={{ color: "hsl(24 94% 52% / 0.25)" }} />
                </Link>
              </li>
            ))}
          </ul>
        </MobileAccordion>

        <MobileAccordion title={isHi ? "संस्थागत" : "Institutional"}>
          <ul className="space-y-3 pl-2">
            {institutionalLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm flex items-center gap-2" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
                  <span>{isHi ? link.labelHi : link.labelEn}</span>
                  <ArrowRight className="h-3 w-3" style={{ color: "hsl(24 94% 52% / 0.25)" }} />
                </Link>
              </li>
            ))}
          </ul>
        </MobileAccordion>

        <MobileAccordion title={isHi ? "संपर्क" : "Contact"}>
          <ul className="space-y-3 pl-2">
            <li className="flex items-start gap-3 text-sm" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(24 94% 52% / 0.35)" }} />
              <span>Bhopal Vibhag, MP, India</span>
            </li>
            <li className="flex items-center gap-3 text-sm" style={{ color: "hsl(0 0% 100% / 0.28)" }}>
              <Mail className="h-4 w-4 flex-shrink-0" style={{ color: "hsl(24 94% 52% / 0.35)" }} />
              <a href="mailto:contact@pragyapravah.org" className="transition-colors">contact@pragyapravah.org</a>
            </li>
          </ul>
        </MobileAccordion>

        <div className="flex flex-col items-center gap-3 pt-6 mt-2" style={{ borderTop: "1px solid hsl(0 0% 100% / 0.03)" }}>
          <p className="text-[8px]" style={{ color: "hsl(0 0% 100% / 0.1)" }}>&copy; {new Date().getFullYear()} Pragya Pravah, Bhopal Vibhag.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-[8px]" style={{ color: "hsl(0 0% 100% / 0.1)" }}>{isHi ? "गोपनीयता" : "Privacy"}</Link>
            <Link href="/terms" className="text-[8px]" style={{ color: "hsl(0 0% 100% / 0.1)" }}>{isHi ? "नियम" : "Terms"}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
