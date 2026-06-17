"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Network, LogIn } from "lucide-react";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

interface Path {
  icon: typeof BookOpen;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
}

const PATHS: Path[] = [
  {
    icon: BookOpen,
    titleEn: "Review public output",
    titleHi: "अध्ययन और योगदान",
    bodyEn: "Begin with current articles, dissemination material, discussion themes, and published field reports.",
    bodyHi: "प्रकाशित सामग्री, वर्तमान विषयों और लेखन-आधारित सार्वजनिक कार्य से आरम्भ करें।",
  },
  {
    icon: Network,
    titleEn: "Connect with a workstream",
    titleHi: "कार्य-प्रवाह से जुड़ें",
    bodyEn: "Move into Aalekh, Prachar, Vimarsh, or Vritt according to your institutional role and working context.",
    bodyHi: "अपने कार्य-संदर्भ के अनुसार आलेख, विमर्श, प्रचार या वृत्त से जुड़ें।",
  },
  {
    icon: LogIn,
    titleEn: "Use member access",
    titleHi: "संस्थागत कक्ष में प्रवेश",
    bodyEn: "Existing karyakartas and members can enter the console directly for ongoing work, review, and reporting.",
    bodyHi: "विद्यमान कार्यकर्ता और सदस्य बिना विपणन-शैली पृष्ठ से गुज़रे सीधे प्रवेश कर सकते हैं।",
  },
];

export function JoinChapter() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = true;

  return (
    <section
      ref={sectionRef}
      className="relative bg-background py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center md:mb-14"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            {t("Participation", "भागीदारी")}
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t("Join the Flow", "प्रवाह में शामिल हों")}
          </h2>
        </motion.div>

        {/* Path cards */}
        <div className="space-y-6">
          {PATHS.map((path, index) => {
            const Icon = path.icon;
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 44 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: index * 0.15 }}
              >
                <div
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-8 md:p-10 transition-all duration-500",
                    "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
                  )}
                >
                  {/* Background glass effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
                    <div
                      className={cn(
                        "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 text-primary transition-transform duration-500 group-hover:scale-110",
                        !isEven && "md:order-2"
                      )}
                    >
                      <Icon className="h-7 w-7" />
                    </div>

                    <div className={cn(!isEven && "md:order-1 md:text-right")}>
                      <h3 className="mb-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        {t(path.titleEn, path.titleHi)}
                      </h3>
                      <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
                        {t(path.bodyEn, path.bodyHi)}
                      </p>
                    </div>

                    <div className={cn("ml-auto shrink-0", !isEven && "md:order-3")}>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/40 text-muted-foreground transition-all duration-300 group-hover:border-primary/40 group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
