"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenText,
  ScrollText,
  Share2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";
import { PerspectiveCard } from "../effects/PerspectiveCard";
import { ERP_FLOW_STEPS } from "../story-content";

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
    summaryEn:
      "Publication desk for essays, research notes, draft review, and article readiness.",
    summaryHi:
      "लेख, शोध-टिप्पणी, प्रारूप समीक्षा और प्रकाशन-योग्य सामग्री का कक्ष।",
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
      "अभियान प्रसार, मंच-अनुशासन और पहुँच के अनुशासित अभिलेख का कक्ष।",
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
  },
];

export function WorkstreamsChapter() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = true;

  return (
    <section
      id="our-work"
      ref={sectionRef}
      className="relative scroll-mt-8 bg-background py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-12 text-center md:mb-14"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            {t("Workstream overview", "कार्य-प्रवाह परिचय")}
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t("Our Work", "हमारा कार्य")}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t(
              "The ERP connects public intellectual output with the operational record needed to sustain it.",
              "ERP सार्वजनिक वैचारिक सामग्री को उस संचालन अभिलेख से जोड़ता है जो कार्य की निरंतरता बनाए रखता है।"
            )}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="mb-12 overflow-hidden rounded-[1.75rem] border border-border/60 bg-card/90 p-5 shadow-[0_22px_64px_-42px_hsl(var(--navy)/0.38)] md:p-7"
        >
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                {t("Operating sequence", "संचालन क्रम")}
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {t(
                  "From idea to accountable record",
                  "विचार से उत्तरदायी अभिलेख तक"
                )}
              </h3>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              {t(
                "Each desk has a visible public role and an internal ERP responsibility.",
                "हर कक्ष की सार्वजनिक भूमिका और आंतरिक ERP जिम्मेदारी दोनों स्पष्ट रहती हैं।"
              )}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {ERP_FLOW_STEPS.map((step, index) => (
              <div key={step.id} className="relative">
                {index < ERP_FLOW_STEPS.length - 1 ? (
                  <div className="absolute left-[calc(100%-0.25rem)] top-8 z-0 hidden h-px w-4 bg-border md:block" />
                ) : null}
                <div className="relative z-10 h-full rounded-2xl border border-border/60 bg-background/78 p-4">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                      {t(step.moduleEn, step.moduleHi)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold tracking-tight text-foreground">
                    {t(step.titleEn, step.titleHi)}
                  </h4>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {t(step.summaryEn, step.summaryHi)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

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
                      "group relative block h-full overflow-hidden rounded-2xl border border-border/40 bg-card p-8 transition-all duration-500",
                      "hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5"
                    )}
                  >
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
