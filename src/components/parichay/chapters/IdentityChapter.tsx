"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Eye,
  Target,
  BookOpen,
  TreePine,
  Heart,
  Leaf,
  Shield,
  UserCircle,
  Users,
  GraduationCap,
  Flame,
  ArrowRight,
  Sparkles,
  Quote,
} from "lucide-react";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";
import { PerspectiveCard } from "../effects/PerspectiveCard";

/* ─────────── Animations ─────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ─────────── Data ─────────── */
const MISSION_POINTS = [
  {
    en: "Restructure national life in every field based on Hindu life values.",
    hi: "हिंदू जीवन मूल्यों के आधार पर राष्ट्रीय जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्संरचना।",
  },
  {
    en: "Build a powerful intellectual system and think-tank network.",
    hi: "बुद्धि विशेषज्ञ मंडलों (थिंक-टैंक) का शक्तिशाली व सशक्त वैचारिक तंत्र खड़ा करना।",
  },
  {
    en: "Awaken civic consciousness and prepare the social environment.",
    hi: "भारतीय नागरिकों में जीवबोध जागृत करने हेतु वातावरण तैयार करना।",
  },
  {
    en: "Prepare India for intellectual leadership on the global stage.",
    hi: "प्रज्ञा के क्षेत्र में वैचारिक नेतृत्व करने की दिशा में भारत को तैयार करना।",
  },
];

const PANCH_PARIVARTAN = [
  {
    icon: Heart,
    titleEn: "Social Harmony",
    titleHi: "सामाजिक समरसता",
    descEn: "Eliminating caste-based discrimination and fostering unity across all sections of society.",
    descHi: "जाति-भेद और ऊँच-नीच की भावना को समाप्त करके समाज में सभी वर्गों के बीच एकता और सद्भाव।",
    color: "from-rose-500/20 to-orange-500/20",
    border: "border-rose-500/30",
    iconColor: "text-rose-500",
  },
  {
    icon: TreePine,
    titleEn: "Family Strengthening",
    titleHi: "कुटुंब प्रबोधन",
    descEn: "Reviving family values, nurturing cultural upbringing in children, and protecting families from modern fragmentation.",
    descHi: "पारिवारिक मूल्यों को बढ़ावा देना, बच्चों में संस्कारों का विकास और परिवारों को आधुनिक चुनौतियों से बचाना।",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-500",
  },
  {
    icon: Leaf,
    titleEn: "Environment Conservation",
    titleHi: "पर्यावरण संरक्षण",
    descEn: "Treating nature as Mother Earth and promoting eco-friendly living through water, air, and soil protection.",
    descHi: "प्रकृति को माता मानकर जल, वायु व मिट्टी के संरक्षण के प्रति जागरूकता और पर्यावरण-अनुकूल जीवनशैली।",
    color: "from-sky-500/20 to-cyan-500/20",
    border: "border-sky-500/30",
    iconColor: "text-sky-500",
  },
  {
    icon: Shield,
    titleEn: "Citizen Duties",
    titleHi: "नागरिक कर्तव्य",
    descEn: "Making every citizen aware of their constitutional duties alongside rights — nation-building and law-abiding citizenship.",
    descHi: "हर नागरिक अपने अधिकारों के साथ-साथ कर्तव्यों के प्रति सजग रहे — राष्ट्रनिर्माण में योगदान और संविधान का पालन।",
    color: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/30",
    iconColor: "text-amber-500",
  },
  {
    icon: UserCircle,
    titleEn: "Self-Awareness",
    titleHi: "स्व का बोध",
    descEn: "Cultural consciousness, Swadeshi pride, and reducing unnecessary dependence on foreign goods and ideas.",
    descHi: "संस्कृति, सभ्यता और स्वदेशी उत्पादों के प्रति जागरूकता — आत्मनिर्भरता को बढ़ावा और फिजूलखर्ची में कमी।",
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
    iconColor: "text-violet-500",
  },
];

const AAYAMS = [
  { icon: Flame, en: "Youth", hi: "युवा" },
  { icon: Heart, en: "Women", hi: "महिला" },
  { icon: BookOpen, en: "Research", hi: "शोध" },
  { icon: Lightbulb, en: "Thought", hi: "चिंतन" },
];

/* ─────────── Component ─────────── */
export function IdentityChapter() {
  const t = useT();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = true;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background py-16 md:py-24"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/3 top-1/4 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -right-1/3 bottom-1/4 h-[400px] w-[400px] rounded-full bg-accent/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-10">
        {/* ────── Section Header ────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="mb-14 text-center md:mb-16"
        >
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
            {t("Introduction", "परिचय")}
          </p>
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            {t("Who We Are", "हम कौन हैं")}
          </h2>
          <p className="mx-auto max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t(
              "Pragya Pravah is a collective of intellectuals who believe in Indianness and seek to restructure national life on the foundation of Hindu life values.",
              "प्रज्ञा प्रवाह उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्संरचना की दिशा एवं सूत्रों की खोज करने वाले विचारशील लोगों का समूह है।"
            )}
          </p>
        </motion.div>

        {/* ────── Etymology Card ────── */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mb-12 md:mb-14"
        >
          <PerspectiveCard intensity={4}>
            <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/50 p-8 backdrop-blur-sm md:p-12">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

              <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:gap-12">
                {/* Sanskrit Quote Block */}
                <div className="flex-shrink-0">
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5 md:mx-0">
                    <Quote className="h-10 w-10 text-primary" />
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <p className="mb-3 font-devanagari text-2xl font-bold leading-relaxed text-foreground md:text-3xl">
                    प्रज्ञानं ब्रह्म
                  </p>
                  <p className="mb-4 text-sm italic text-muted-foreground">
                    {t("Knowledge is Brahma — Rigveda", "प्रज्ञानं ब्रह्म — ऋग्वेद")}
                  </p>
                  <div className="space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                    <p>
                      {t(
                        "The word 'Pragya' is formed from 'Pra' (special, complete, ahead) and 'Jña' (to know). It signifies not ordinary intellect, but deep and pure knowledge attained through study, practice, and contemplation.",
                        "'प्रज्ञा' शब्द 'प्र' (विशेष, पूर्ण, आगे) और 'ज्ञ' (जानना) से बना है। यह केवल सामान्य बुद्धि नहीं, बल्कि अध्ययन, अभ्यास और चिंतन से प्राप्त गहरा एवं शुद्ध ज्ञान है।"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </PerspectiveCard>
        </motion.div>

        {/* ────── Vision & Mission ────── */}
        <div className="mb-12 grid gap-6 md:mb-14 md:grid-cols-2">
          {/* Vision */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
          >
            <PerspectiveCard intensity={5}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
                <div className="relative">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary">
                    <Eye className="h-6 w-6" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {t("Vision", "दृष्टि")}
                  </h3>
                  <p className="font-devanagari text-lg leading-relaxed text-foreground/90">
                    {t(
                      "A society restructured for public welfare, inspired by Hindu life values.",
                      "हिंदू जीवन मूल्यों से प्रेरित लोक कल्याणकारी वैचारिक समाज रचना।"
                    )}
                  </p>
                </div>
              </div>
            </PerspectiveCard>
          </motion.div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            <PerspectiveCard intensity={5}>
              <div className="relative h-full overflow-hidden rounded-2xl border border-border/40 bg-card p-8 transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                <div className="relative">
                  <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary">
                    <Target className="h-6 w-6" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                    {t("Mission", "लक्ष्य")}
                  </h3>
                  <ul className="space-y-3">
                    {MISSION_POINTS.map((m, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground md:text-base">
                        <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/60" />
                        <span>{t(m.en, m.hi)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </PerspectiveCard>
          </motion.div>
        </div>

        {/* ────── Panch Parivartan ────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.45 }}
          className="mb-14 md:mb-16"
        >
          <div className="mb-10 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
              <Sparkles className="h-3 w-3" />
              {t("Five Transformations", "पंच परिवर्तन")}
            </div>
            <h3 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("Panch Parivartan", "पंच परिवर्तन")}
            </h3>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {PANCH_PARIVARTAN.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.titleEn} variants={fadeUp} custom={i}>
                  <PerspectiveCard intensity={4}>
                    <div
                      className={cn(
                        "group relative h-full overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-500",
                        "hover:shadow-xl hover:shadow-primary/5",
                        item.border
                      )}
                    >
                      <div
                        className={cn(
                          "absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br opacity-30 blur-2xl transition-opacity duration-500 group-hover:opacity-60",
                          item.color
                        )}
                      />
                      <div className="relative">
                        <div
                          className={cn(
                            "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-opacity-10 transition-transform duration-500 group-hover:scale-110",
                            item.border,
                            item.iconColor
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="mb-2 text-lg font-bold tracking-tight text-foreground">
                          {t(item.titleEn, item.titleHi)}
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          {t(item.descEn, item.descHi)}
                        </p>
                      </div>
                    </div>
                  </PerspectiveCard>
                </motion.div>
              );
            })}

            {/* Center the 5th item on larger screens when needed, but grid handles it */}
          </motion.div>
        </motion.div>

        {/* ────── Work Dimensions ────── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
              {t("Dimensions", "आयाम")}
            </p>
            <h3 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t("Four Pillars of Work", "कार्य के चार आयाम")}
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {AAYAMS.map((aayam, i) => {
              const Icon = aayam.icon;
              return (
                <motion.div
                  key={aayam.en}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.5, delay: 0.7 + i * 0.1 }}
                >
                  <div className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card p-6 text-center transition-all duration-500 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition-transform duration-500 group-hover:scale-110">
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="font-devanagari text-lg font-bold text-foreground">
                        {aayam.hi}
                      </p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {aayam.en}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
