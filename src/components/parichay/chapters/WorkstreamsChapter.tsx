"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  ScrollText,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ERP_FLOW_STEPS } from "../story-content";

interface Workstream {
  id: string;
  href: string;
  icon: LucideIcon;
  titleEn: string;
  titleHi: string;
  summaryEn: string;
  summaryHi: string;
  responsibilityEn: string;
  responsibilityHi: string;
}

const WORKSTREAMS: Workstream[] = [
  {
    id: "aalekh",
    href: "/aalekh",
    icon: BookOpenText,
    titleEn: "Aalekh",
    titleHi: "आलेख",
    summaryEn:
      "Publication desk for essays, research notes, draft review, and article readiness.",
    summaryHi:
      "लेख, शोध-टिप्पणी, प्रारूप समीक्षा और प्रकाशन-योग्य सामग्री का कक्ष।",
    responsibilityEn: "Drafts, review, readiness",
    responsibilityHi: "प्रारूप, समीक्षा, तैयारी",
  },
  {
    id: "prachar",
    href: "/prachar",
    icon: Share2,
    titleEn: "Prachar",
    titleHi: "प्रचार",
    summaryEn:
      "Dissemination desk for campaign circulation, platform discipline, and reach tracking.",
    summaryHi:
      "अभियान प्रसार, मंच-अनुशासन और पहुंच के अभिलेख का कक्ष।",
    responsibilityEn: "Circulation, campaign rhythm",
    responsibilityHi: "प्रसार, अभियान लय",
  },
  {
    id: "vimarsh",
    href: "/vimarsh",
    icon: Users,
    titleEn: "Vimarsh",
    titleHi: "विमर्श",
    summaryEn:
      "Discourse desk for forums, review sessions, study circles, and public discussion.",
    summaryHi:
      "मंच, समीक्षा सत्र, अध्ययन-वृत्त और सार्वजनिक संवाद का कक्ष।",
    responsibilityEn: "Forums, sessions, dialogue",
    responsibilityHi: "मंच, सत्र, संवाद",
  },
  {
    id: "vritt",
    href: "/dashboard",
    icon: ScrollText,
    titleEn: "Vritt",
    titleHi: "वृत्त",
    summaryEn:
      "Reporting desk for event records, attendance, media, follow-through, and dashboard review.",
    summaryHi:
      "आयोजन अभिलेख, उपस्थिति, मीडिया, अनुवर्तन और डैशबोर्ड समीक्षा का कक्ष।",
    responsibilityEn: "Record, evidence, review",
    responsibilityHi: "अभिलेख, प्रमाण, समीक्षा",
  },
];

function BilingualTitle({
  eyebrowEn,
  eyebrowHi,
  titleEn,
  titleHi,
}: {
  eyebrowEn: string;
  eyebrowHi: string;
  titleEn: string;
  titleHi: string;
}) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
        {eyebrowEn}
      </p>
      <p className="mt-1 font-devanagari text-sm font-semibold leading-6 tracking-normal text-muted-foreground">
        {eyebrowHi}
      </p>
      <h2 className="mt-4 text-4xl font-bold leading-tight tracking-normal text-foreground md:text-6xl">
        {titleEn}
        <span className="mt-2 block font-devanagari text-3xl font-semibold leading-snug tracking-normal text-foreground/80 md:text-5xl">
          {titleHi}
        </span>
      </h2>
    </div>
  );
}

export function WorkstreamsChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.12 });

  return (
    <section
      id="our-work"
      ref={sectionRef}
      className="relative scroll-mt-8 overflow-hidden bg-background py-16 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,hsl(var(--primary)/0.34),transparent)]" />
        <div className="absolute inset-0 pravah-lattice-bg opacity-60" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="mb-12 grid gap-6 md:grid-cols-[0.84fr_1fr] md:items-end"
        >
          <BilingualTitle
            eyebrowEn="Workstream overview"
            eyebrowHi="कार्य-प्रवाह परिचय"
            titleEn="Our Work"
            titleHi="हमारा कार्य"
          />
          <div className="grid gap-4 text-base leading-8 text-muted-foreground md:text-lg">
            <p>
              The ERP connects public intellectual output with the operational
              record needed to sustain it.
            </p>
            <p className="font-devanagari text-lg leading-9 tracking-normal text-foreground/90">
              ERP सार्वजनिक वैचारिक सामग्री को उस संचालन अभिलेख से जोड़ता है
              जो कार्य की निरंतरता बनाए रखता है।
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.12 }}
          className="mb-12 overflow-hidden rounded-lg border border-border/70 bg-card/90 shadow-[0_24px_76px_-54px_hsl(var(--navy)/0.42)]"
        >
          <div className="grid gap-0 lg:grid-cols-[0.44fr_1fr]">
            <div className="bg-[hsl(var(--sidebar-background))] p-6 text-sidebar-foreground md:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                Operating sequence
              </p>
              <h3 className="mt-4 text-3xl font-bold leading-tight tracking-normal text-white md:text-4xl">
                Idea to accountable record
                <span className="mt-2 block font-devanagari text-2xl font-semibold leading-snug tracking-normal text-white/80 md:text-3xl">
                  विचार से उत्तरदायी अभिलेख तक
                </span>
              </h3>
              <p className="mt-5 text-sm leading-7 text-sidebar-foreground/80">
                Each public desk has a visible role and an internal ERP
                responsibility.
              </p>
              <p className="mt-2 font-devanagari text-base leading-8 tracking-normal text-sidebar-foreground/90">
                हर कक्ष की सार्वजनिक भूमिका और आंतरिक ERP जिम्मेदारी दोनों
                स्पष्ट रहती हैं।
              </p>
            </div>

            <div className="relative p-5 md:p-7">
              <svg
                viewBox="0 0 900 120"
                className="pointer-events-none absolute left-8 right-8 top-16 hidden h-24 w-[calc(100%-4rem)] md:block"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--parchment-accent))" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M36 56 C170 10 250 102 380 56 C514 10 596 102 730 56 C790 34 836 36 864 56"
                  fill="none"
                  stroke="url(#flow-gradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={isInView ? { pathLength: 1 } : {}}
                  transition={{ duration: 2.2, ease: "easeInOut", delay: 0.2 }}
                />
              </svg>
              <div className="relative grid gap-3 md:grid-cols-5">
                {ERP_FLOW_STEPS.map((step, index) => (
                  <motion.article
                    key={step.id}
                    whileHover={{ y: -3, borderColor: "hsl(var(--primary) / 0.4)" }}
                    className="group relative rounded-lg border border-border/70 bg-background/90 p-4 shadow-[0_8px_20px_-10px_hsl(var(--navy)/0.15)] transition-all duration-300 hover:shadow-[0_12px_24px_-10px_hsl(var(--primary)/0.15)]"
                  >
                    <div className="mb-4 flex items-start justify-between gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-bold text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                        {index + 1}
                      </span>
                      <span className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        {step.moduleEn}
                        <span className="block font-devanagari text-xs font-semibold normal-case tracking-normal text-foreground/70">
                          {step.moduleHi}
                        </span>
                      </span>
                    </div>
                    <h4 className="text-sm font-bold leading-6 tracking-normal text-foreground">
                      {step.titleEn}
                      <span className="block font-devanagari text-sm font-semibold tracking-normal text-foreground/80">
                        {step.titleHi}
                      </span>
                    </h4>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {step.summaryEn}
                    </p>
                    <p className="mt-1 font-devanagari text-xs leading-6 tracking-normal text-foreground/75">
                      {step.summaryHi}
                    </p>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
          {WORKSTREAMS.map((stream, index) => {
            const Icon = stream.icon;

            return (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 44 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.56, delay: index * 0.08 }}
              >
                <Link
                  href={stream.href}
                  className={cn(
                    "group relative overflow-hidden grid h-full gap-5 rounded-lg border border-border/70 bg-card/90 p-5 shadow-[0_18px_50px_-40px_hsl(var(--navy)/0.3)] transition-all duration-300 hover:border-primary/40 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_hsl(var(--primary)/0.15)] md:grid-cols-[4.5rem_minmax(0,1fr)] md:p-6"
                  )}
                >
                  {/* Left border accent line on hover */}
                  <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary scale-y-0 origin-bottom transition-transform duration-300 group-hover:scale-y-100" />

                  <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15 group-hover:border-primary/30">
                    <Icon className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12" />
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-start justify-between gap-4">
                      <span>
                        <span className="block text-2xl font-bold leading-tight tracking-normal text-foreground md:text-3xl">
                          {stream.titleEn}
                        </span>
                        <span className="mt-1 block font-devanagari text-2xl font-semibold leading-9 tracking-normal text-foreground/80">
                          {stream.titleHi}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-primary" />
                    </span>

                    <span className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground md:text-base md:leading-7">
                      <span>{stream.summaryEn}</span>
                      <span className="font-devanagari leading-8 tracking-normal text-foreground/80">
                        {stream.summaryHi}
                      </span>
                    </span>

                    <span className="mt-5 grid gap-2 rounded-lg border border-border/70 bg-background/75 p-3 text-xs leading-5 md:grid-cols-[7.5rem_minmax(0,1fr)]">
                      <span className="font-bold uppercase tracking-[0.14em] text-primary">
                        ERP role
                      </span>
                      <span>
                        {stream.responsibilityEn}
                        <span className="block font-devanagari tracking-normal text-foreground/75">
                          {stream.responsibilityHi}
                        </span>
                      </span>
                    </span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
