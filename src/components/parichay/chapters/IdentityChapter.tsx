"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Eye,
  Flame,
  Heart,
  Leaf,
  Lightbulb,
  Shield,
  Target,
  TreePine,
  UserCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { STORY_STAGES, type StoryVisual } from "../story-content";

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.56, delay: i * 0.08, ease: "easeOut" as const },
  }),
};

const visualTone: Record<StoryVisual["tone"], string> = {
  earth: "border-stone-500/30 bg-stone-500/10 text-stone-800",
  saffron: "border-primary/30 bg-primary/10 text-primary",
  ink: "border-slate-700/25 bg-slate-700/10 text-slate-900",
  leaf: "border-emerald-700/25 bg-emerald-700/10 text-emerald-800",
  steel: "border-sky-900/25 bg-sky-900/10 text-sky-950",
};

const MISSION_POINTS = [
  {
    en: "Restructure national life in every field based on Hindu life values.",
    hi: "हिंदू जीवन मूल्यों के आधार पर राष्ट्रीय जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्संरचना।",
  },
  {
    en: "Build a powerful intellectual system and think-tank network.",
    hi: "बुद्धि-विशेषज्ञ मंडलों का शक्तिशाली और सशक्त वैचारिक तंत्र खड़ा करना।",
  },
  {
    en: "Awaken civic consciousness and prepare the social environment.",
    hi: "भारतीय नागरिकों में जीवबोध जागृत करने के लिए वातावरण तैयार करना।",
  },
  {
    en: "Prepare India for intellectual leadership on the global stage.",
    hi: "प्रज्ञा के क्षेत्र में वैचारिक नेतृत्व की दिशा में भारत को तैयार करना।",
  },
];

const PANCH_PARIVARTAN: Array<{
  icon: LucideIcon;
  titleEn: string;
  titleHi: string;
  descEn: string;
  descHi: string;
  accent: string;
}> = [
  {
    icon: Heart,
    titleEn: "Social Harmony",
    titleHi: "सामाजिक समरसता",
    descEn: "Reducing discrimination and fostering unity across society.",
    descHi: "भेदभाव घटाकर समाज में एकता और सद्भाव को बल देना।",
    accent: "text-rose-700 border-rose-700/25 bg-rose-700/10",
  },
  {
    icon: TreePine,
    titleEn: "Family Strengthening",
    titleHi: "कुटुंब प्रबोधन",
    descEn: "Nurturing family values and cultural upbringing.",
    descHi: "परिवार मूल्यों और संस्कारमय वातावरण को सशक्त करना।",
    accent: "text-emerald-800 border-emerald-800/25 bg-emerald-800/10",
  },
  {
    icon: Leaf,
    titleEn: "Environment Conservation",
    titleHi: "पर्यावरण संरक्षण",
    descEn: "Promoting water, air, soil, and nature-conscious living.",
    descHi: "जल, वायु, मिट्टी और प्रकृति-सम्मत जीवन के प्रति जागरूकता।",
    accent: "text-sky-800 border-sky-800/25 bg-sky-800/10",
  },
  {
    icon: Shield,
    titleEn: "Citizen Duties",
    titleHi: "नागरिक कर्तव्य",
    descEn: "Balancing rights with constitutional and social responsibility.",
    descHi: "अधिकारों के साथ संवैधानिक और सामाजिक कर्तव्य का बोध।",
    accent: "text-amber-800 border-amber-800/25 bg-amber-800/10",
  },
  {
    icon: UserCircle,
    titleEn: "Self-Awareness",
    titleHi: "स्व का बोध",
    descEn: "Strengthening cultural consciousness and Swadeshi confidence.",
    descHi: "सांस्कृतिक चेतना, स्वदेशी गौरव और आत्मविश्वास को बल देना।",
    accent: "text-violet-800 border-violet-800/25 bg-violet-800/10",
  },
];

const AAYAMS = [
  { icon: Flame, en: "Youth", hi: "युवा" },
  { icon: Heart, en: "Women", hi: "महिला" },
  { icon: BookOpen, en: "Research", hi: "शोध" },
  { icon: Lightbulb, en: "Thought", hi: "चिंतन" },
];

function DualHeading({
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
    <div className="max-w-3xl">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
        {eyebrowEn}
      </p>
      <p className="mt-1 font-devanagari text-sm font-semibold leading-6 tracking-normal text-[hsl(var(--parchment-ink-soft))]">
        {eyebrowHi}
      </p>
      <h2 className="mt-4 text-4xl font-bold leading-tight tracking-normal text-[hsl(var(--parchment-ink))] md:text-6xl">
        {titleEn}
        <span className="mt-2 block font-devanagari text-3xl font-semibold leading-snug tracking-normal text-[hsl(var(--parchment-ink-soft))] md:text-5xl">
          {titleHi}
        </span>
      </h2>
    </div>
  );
}

function StorySeal({ visual, index }: { visual: StoryVisual; index: number }) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-lg border",
        visualTone[visual.tone]
      )}
    >
      <svg viewBox="0 0 160 160" className="absolute inset-0 h-full w-full transition-transform duration-700 ease-out group-hover:rotate-12">
        <circle cx="80" cy="80" r="64" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.2" />
        <circle cx="80" cy="80" r="44" fill="none" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.4" />
        <path
          d="M31 86 C48 46 105 38 128 76 C111 116 54 124 31 86Z"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.36"
          strokeWidth="1.6"
        />
        <path
          d="M80 25 L91 66 L133 80 L91 94 L80 135 L69 94 L27 80 L69 66Z"
          fill="currentColor"
          fillOpacity="0.08"
          stroke="currentColor"
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <text x="80" y="78" textAnchor="middle" className="fill-current text-[18px] font-bold">
          {visual.glyphEn}
        </text>
        <text x="80" y="103" textAnchor="middle" className="fill-current font-devanagari text-[20px] font-semibold">
          {visual.glyphHi}
        </text>
      </svg>
      <span className="absolute left-3 top-3 text-[10px] font-bold uppercase tracking-[0.16em]">
        {String(index + 1).padStart(2, "0")}
      </span>
      <span className="absolute bottom-3 left-3 right-3 text-[10px] font-semibold uppercase tracking-[0.12em]">
        {visual.ringLabel}
      </span>
    </div>
  );
}

export function IdentityChapter() {
  const sectionRef = useRef<HTMLElement>(null);
  // amount: "some" — fire when any part enters view. A fractional amount like
  // 0.12 is unreachable on tall sections (12% can exceed the viewport height),
  // which left the whole chapter stuck at opacity 0.
  const isInView = useInView(sectionRef, { once: true, amount: "some" });

  return (
    <section
      id="who-we-are"
      ref={sectionRef}
      className="relative overflow-hidden bg-background py-16 md:py-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--parchment-bg))_42%,hsl(var(--background)))]" />
      <div className="relative mx-auto max-w-7xl px-5 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="mb-14 grid gap-8 md:grid-cols-[0.84fr_1fr] md:items-end"
        >
          <DualHeading
            eyebrowEn="Introduction"
            eyebrowHi="परिचय"
            titleEn="Who We Are"
            titleHi="हम कौन हैं"
          />
          <div className="grid gap-4 text-base leading-8 text-muted-foreground md:text-lg">
            <p>
              Pragya Pravah is a collective of intellectuals who believe in
              Indianness and seek to restructure national life on the foundation
              of Hindu life values.
            </p>
            <p className="font-devanagari text-lg leading-9 tracking-normal text-foreground/90">
              प्रज्ञा प्रवाह उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र
              जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्संरचना की दिशा खोजने
              वाले विचारशील लोगों का समूह है।
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="group mb-16 grid gap-6 rounded-lg border border-border/70 bg-card/75 p-6 shadow-[0_22px_70px_-52px_hsl(var(--navy)/0.36)] transition-all duration-300 hover:border-primary/30 hover:shadow-[0_22px_60px_-40px_hsl(var(--primary)/0.12)] md:grid-cols-[0.42fr_1fr] md:p-8"
        >
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:border-primary/30 group-hover:bg-primary/15">
              <Eye className="h-6 w-6 transition-transform duration-500 group-hover:rotate-12" />
            </span>
            <div>
              <p className="font-devanagari text-3xl font-semibold leading-tight tracking-normal text-foreground">
                प्रज्ञानं ब्रह्म
              </p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                Knowledge as discipline
              </p>
            </div>
          </div>
          <div className="grid gap-4 text-sm leading-7 text-muted-foreground md:text-base">
            <p>
              The word Pragya points to refined knowledge: not information
              alone, but insight formed through study, practice, and
              contemplation.
            </p>
            <p className="font-devanagari text-base leading-8 tracking-normal text-foreground/90">
              प्रज्ञा सामान्य बुद्धि नहीं, बल्कि अध्ययन, अभ्यास और चिंतन से
              प्राप्त गहरा और शुद्ध ज्ञान है।
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 34 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 0.14 }}
          className="mb-16"
        >
          <div className="mb-8 grid gap-5 md:grid-cols-[0.75fr_1fr] md:items-end">
            <DualHeading
              eyebrowEn="Origin to operation"
              eyebrowHi="मूल से संचालन"
              titleEn="The story behind the system"
              titleHi=" व्यवस्था के पीछे की कथा"
            />
            <p className="max-w-2xl text-base leading-8 text-muted-foreground md:text-lg">
              The ERP is the continuity layer for study, publication, public
              discourse, and field accountability.
              <span className="mt-2 block font-devanagari text-lg leading-9 tracking-normal text-foreground/80">
                ERP अध्ययन, प्रकाशन, सार्वजनिक विमर्श और क्षेत्रीय
                उत्तरदायित्व की निरंतरता का तंत्र है।
              </span>
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-5">
            {STORY_STAGES.map((stage, index) => (
              <motion.article
                key={stage.id}
                variants={fadeUp}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                custom={index}
                className="group grid gap-4 rounded-lg border border-border/70 bg-card/90 p-4 shadow-[0_18px_52px_-44px_hsl(var(--navy)/0.36)] transition-all duration-300 hover:border-primary/40 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_hsl(var(--primary)/0.15)]"
              >
                <StorySeal visual={stage.visual} index={index} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                    {stage.labelEn}
                  </p>
                  <p className="mt-1 font-devanagari text-xs font-semibold leading-5 tracking-normal text-muted-foreground">
                    {stage.labelHi}
                  </p>
                  <h3 className="mt-4 text-lg font-bold leading-snug tracking-normal text-foreground">
                    {stage.titleEn}
                    <span className="mt-1 block font-devanagari text-lg font-semibold leading-7 tracking-normal text-foreground/80">
                      {stage.titleHi}
                    </span>
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {stage.summaryEn}
                  </p>
                  <p className="mt-2 font-devanagari text-sm leading-7 tracking-normal text-foreground/78">
                    {stage.summaryHi}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>

        <div className="mb-16 grid gap-5 md:grid-cols-2">
          <motion.section
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="group relative overflow-hidden rounded-lg border border-border/70 bg-card/90 p-6 shadow-[0_18px_50px_-40px_hsl(var(--navy)/0.3)] transition-all duration-300 hover:border-primary/30 md:p-8"
          >
            {/* Scholar Mandala Watermark */}
            <svg viewBox="0 0 100 100" className="absolute -bottom-6 -right-6 h-28 w-28 opacity-[0.04] text-primary pointer-events-none transition-transform duration-700 group-hover:rotate-45" aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
              <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="0.3" />
            </svg>

            <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
              <Eye className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
            </span>
            <h3 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">
              Vision
              <span className="block font-devanagari text-2xl font-semibold tracking-normal text-foreground/80">
                दृष्टि
              </span>
            </h3>
            <p className="mt-5 text-base leading-8 text-muted-foreground">
              A society restructured for public welfare, inspired by Hindu life
              values.
            </p>
            <p className="mt-2 font-devanagari text-lg leading-9 tracking-normal text-foreground/90">
              हिंदू जीवन मूल्यों से प्रेरित लोक-कल्याणकारी वैचारिक समाज रचना।
            </p>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="group relative overflow-hidden rounded-lg border border-border/70 bg-card/90 p-6 shadow-[0_18px_50px_-40px_hsl(var(--navy)/0.3)] transition-all duration-300 hover:border-primary/30 md:p-8"
          >
            {/* Scholar Mandala Watermark */}
            <svg viewBox="0 0 100 100" className="absolute -bottom-6 -right-6 h-28 w-28 opacity-[0.04] text-primary pointer-events-none transition-transform duration-700 group-hover:rotate-45" aria-hidden="true">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 3" />
              <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="16" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 1" />
              <path d="M50 10 L50 90 M10 50 L90 50" stroke="currentColor" strokeWidth="0.3" />
            </svg>

            <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/15">
              <Target className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
            </span>
            <h3 className="text-2xl font-bold tracking-normal text-foreground md:text-3xl">
              Mission
              <span className="block font-devanagari text-2xl font-semibold tracking-normal text-foreground/80">
                लक्ष्य
              </span>
            </h3>
            <div className="mt-5 grid gap-4">
              {MISSION_POINTS.map((point) => (
                <div key={point.en} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-3">
                  <ArrowRight className="mt-1 h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-0.5" />
                  <p className="text-sm leading-6 text-muted-foreground md:text-base">
                    {point.en}
                    <span className="mt-1 block font-devanagari text-sm leading-7 tracking-normal text-foreground/80 md:text-base">
                      {point.hi}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.62, delay: 0.28 }}
          className="mb-16"
        >
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Five Transformations
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              Panch Parivartan
              <span className="block font-devanagari text-3xl font-semibold tracking-normal text-foreground/80">
                पंच परिवर्तन
              </span>
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PANCH_PARIVARTAN.map((item, i) => {
              const Icon = item.icon;
              const bgAccent = item.accent.includes("text-rose-700") ? "bg-rose-700" :
                               item.accent.includes("text-emerald-800") ? "bg-emerald-800" :
                               item.accent.includes("text-sky-800") ? "bg-sky-800" :
                               item.accent.includes("text-amber-800") ? "bg-amber-800" :
                               item.accent.includes("text-violet-800") ? "bg-violet-800" : "bg-primary";
              return (
                <motion.article
                  key={item.titleEn}
                  variants={fadeUp}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  custom={i}
                  className="group relative overflow-hidden rounded-lg border border-border/70 bg-card/90 p-5 shadow-[0_18px_50px_-40px_hsl(var(--navy)/0.3)] transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_15px_30px_-15px_hsl(var(--primary)/0.12)]"
                >
                  {/* Left border accent line on hover */}
                  <span className={cn("absolute left-0 top-0 bottom-0 w-[3px] scale-y-0 origin-bottom transition-transform duration-300 group-hover:scale-y-100", bgAccent)} />

                  <span className={cn("mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-all duration-300 group-hover:scale-105", item.accent)}>
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  </span>
                  <h4 className="text-base font-bold leading-6 tracking-normal text-foreground">
                    {item.titleEn}
                    <span className="block font-devanagari text-base font-semibold tracking-normal text-foreground/80">
                      {item.titleHi}
                    </span>
                  </h4>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.descEn}
                    <span className="mt-1 block font-devanagari leading-7 tracking-normal text-foreground/75">
                      {item.descHi}
                    </span>
                  </p>
                </motion.article>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.62, delay: 0.34 }}
        >
          <div className="mb-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              Dimensions
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-normal text-foreground md:text-4xl">
              Four Pillars of Work
              <span className="block font-devanagari text-3xl font-semibold tracking-normal text-foreground/80">
                कार्य के चार आयाम
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {AAYAMS.map((aayam, i) => {
              const Icon = aayam.icon;
              return (
                <motion.div
                  key={aayam.en}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.45, delay: 0.4 + i * 0.06 }}
                  className="group rounded-lg border border-border/70 bg-card/90 p-6 text-center shadow-[0_12px_30px_-15px_hsl(var(--navy)/0.15)] transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_hsl(var(--primary)/0.15)]"
                >
                  <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/15 group-hover:border-primary/30">
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                  </span>
                  <p className="font-devanagari text-xl font-semibold leading-8 tracking-normal text-foreground">
                    {aayam.hi}
                  </p>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
                    {aayam.en}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
