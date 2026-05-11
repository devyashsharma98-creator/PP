"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { BookOpenText, Share2, Users, ScrollText, ArrowRight, type LucideIcon } from "lucide-react";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";
import { PerspectiveCard } from "../effects/PerspectiveCard";

interface Workstream {
  id: string;
  href: string;
  icon: LucideIcon;
  titleEn: string;
  titleHi: string;
  summaryEn: string;
  summaryHi: string;
}

const WORKSTREAMS: Workstream[] = [
  {
    id: "aalekh",
    href: "/aalekh",
    icon: BookOpenText,
    titleEn: "Aalekh",
    titleHi: "आलेख",
    summaryEn: "Publication desk for essays, research notes, and review-ready article drafting.",
    summaryHi: "दीर्घ लेखन, शोध टिप्पणी और प्रकाशन-योग्य वैचारिक सामग्री।",
  },
  {
    id: "prachar",
    href: "/prachar",
    icon: Share2,
    titleEn: "Prachar",
    titleHi: "प्रचार",
    summaryEn: "Dissemination desk for campaign circulation, distribution discipline, and reach tracking.",
    summaryHi: "अभियान प्रसार, सार्वजनिक वितरण और पहुँच की उत्तरदायी व्यवस्था।",
  },
  {
    id: "vimarsh",
    href: "/vimarsh",
    icon: Users,
    titleEn: "Vimarsh",
    titleHi: "विमर्श",
    summaryEn: "Discourse desk for forums, review sessions, and study-led public discussion.",
    summaryHi: "सार्वजनिक क्षेत्र में विमर्श, संवाद और अध्ययन-आधारित चर्चा।",
  },
  {
    id: "vritt",
    href: "/dashboard",
    icon: ScrollText,
    titleEn: "Vritt",
    titleHi: "वृत्त",
    summaryEn: "Reporting desk for event records, attendance updates, and operational follow-through.",
    summaryHi: "संस्थागत वृत्त, आयोजन-लय और सार्वजनिक कार्य का संक्षिप्त अभिलेख।",
  },
];

export function WorkstreamsChapter() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] bg-background py-20 md:py-32"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            {t("Workstream overview", "सार्वजनिक कार्य-क्षेत्र")}
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t("Our Work", "हमारा कार्य")}
          </h2>
        </motion.div>

        {/* Workstream cards grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {WORKSTREAMS.map((stream, index) => {
            const Icon = stream.icon;
            return (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <PerspectiveCard>
                  <Link
                    href={stream.href}
                    className={cn(
                      "group relative block overflow-hidden rounded-2xl border border-border/40 bg-card p-8 transition-all duration-500",
                      "hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
                    )}
                  >
                    {/* Hover glow */}
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">
                      <div className="mb-6 flex items-start justify-between">
                        <span className="inline-flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:border-primary/40">
                          <Icon className="h-6 w-6" />
                        </span>
                        <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                      </div>

                      <h3 className="mb-3 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        {t(stream.titleEn, stream.titleHi)}
                      </h3>

                      <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                        {t(stream.summaryEn, stream.summaryHi)}
                      </p>
                    </div>
                  </Link>
                </PerspectiveCard>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
