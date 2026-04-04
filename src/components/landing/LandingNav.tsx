"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "./BrandLogo";
import { useAppContext } from "@/context/AppContext";

const navLinks = [
  { href: "#vision", labelEn: "Vision", labelHi: "दृष्टि" },
  { href: "#work", labelEn: "Work", labelHi: "कार्य" },
  { href: "#paths", labelEn: "Paths", labelHi: "मार्ग" },
  { href: "#console", labelEn: "Console", labelHi: "प्रणाली" },
];

export function LandingNav() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  if (pathname !== "/") return null;

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled ? "bg-background/90 backdrop-blur-xl shadow-sm" : "bg-transparent"
        }`}
        style={scrolled ? { borderBottom: "1px solid hsl(38 15% 88% / 0.3)" } : {}}
      >
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandLogo size="sm" />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Landing navigation">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-primary transition-colors duration-300"
              >
                {isHi ? link.labelHi : link.labelEn}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="h-8 rounded-none border-border/20 bg-transparent text-[10px] tracking-[0.15em] hover:bg-card/50 hover:border-primary/20 transition-all duration-500">
              <Link href="/login">
                <span>{isHi ? "प्रवेश" : "Enter"}</span>
                <ArrowRight className="ml-2 h-3 w-3 opacity-40" />
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 -mr-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X className="h-5 w-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Menu className="h-5 w-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div 
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            role="dialog" 
            aria-modal="true"
          >
            {/* Backdrop */}
            <div className="absolute inset-0" style={{ backgroundColor: "hsl(38 40% 96.5%)" }} />
            
            {/* Decorative mandala */}
            <motion.div 
              className="absolute -right-20 -bottom-20 pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <svg viewBox="0 0 240 240" className="h-64 w-64 text-primary/[0.04]" fill="none">
                <circle cx="120" cy="120" r="112" stroke="currentColor" strokeWidth="0.8" />
                <circle cx="120" cy="120" r="78" stroke="currentColor" strokeWidth="1" />
                {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
                  <ellipse key={a} cx="120" cy="62" rx="12" ry="48" fill="currentColor" fillOpacity="0.04" stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.5" transform={`rotate(${a} 120 120)`} />
                ))}
                <circle cx="120" cy="120" r="16" fill="currentColor" fillOpacity="0.15" />
              </svg>
            </motion.div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full pt-16">
              <nav className="flex-1 flex flex-col px-6 pt-8" aria-label="Mobile navigation">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="py-5 text-xl font-bold tracking-tight border-b transition-colors"
                    style={{ color: "hsl(222 47% 11% / 0.8)", borderColor: "hsl(38 15% 88% / 0.3)" }}
                  >
                    <span>{isHi ? link.labelHi : link.labelEn}</span>
                    <span className="font-devanagari text-base ml-2 font-normal" style={{ color: "hsl(222 47% 11% / 0.35)" }}>
                      {isHi ? link.labelEn : link.labelHi}
                    </span>
                  </motion.a>
                ))}

                <motion.div 
                  className="mt-8 space-y-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Button asChild size="lg" className="w-full h-14 rounded-none bg-navy text-background hover:bg-primary transition-all duration-500" style={{ backgroundColor: "hsl(222 47% 11%)" }}>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <span className="text-sm font-bold uppercase tracking-[0.15em]">{isHi ? "प्रणाली में प्रवेश" : "Enter Console"}</span>
                      <ArrowRight className="ml-3 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="w-full h-14 rounded-none hover:bg-card/50 transition-all duration-500" style={{ borderColor: "hsl(38 15% 88%)", backgroundColor: "transparent" }}>
                    <Link href="/parichay" onClick={() => setMobileOpen(false)}>
                      <span className="text-sm font-bold uppercase tracking-[0.15em]" style={{ color: "hsl(222 47% 11% / 0.5)" }}>{isHi ? "दृष्टि समझें" : "The Vision"}</span>
                    </Link>
                  </Button>
                </motion.div>
              </nav>

              {/* Bottom brand */}
              <motion.div 
                className="px-6 pb-8 pt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-[9px] tracking-[0.2em]" style={{ color: "hsl(220 12% 44% / 0.3)" }}>
                  Pragya Pravah • Bhopal Vibhag
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
