"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, BookOpen, Flame, MessagesSquare,
  Megaphone, Compass, Sparkles, Star,
  Heart, Home, Leaf, Shield, Zap, ChevronRight,
  Lightbulb, Network, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

// ── Sacred Mandala SVG ────────────────────────────────────────────────────────
function Mandala({ className }: { className?: string }) {
  const petals8 = [0, 45, 90, 135, 180, 225, 270, 315];
  const rays16 = Array.from({ length: 16 }, (_, i) => i * 22.5);
  
  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="116" stroke="currentColor" strokeWidth="0.5" opacity="0.15" />
      {petals8.map((angle, i) => (
        <ellipse key={i} cx="120" cy="62" rx="14" ry="52"
          fill="currentColor" fillOpacity="0.04"
          stroke="currentColor" strokeOpacity="0.2" strokeWidth="0.6"
          transform={`rotate(${angle} 120 120)`} />
      ))}
      <circle cx="120" cy="120" r="68" stroke="currentColor" strokeWidth="0.5" opacity="0.2" />
      {rays16.map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x1 = +(120 + 30 * Math.cos(rad)).toFixed(4), y1 = +(120 + 30 * Math.sin(rad)).toFixed(4);
        const x2 = +(120 + 43 * Math.cos(rad)).toFixed(4), y2 = +(120 + 43 * Math.sin(rad)).toFixed(4);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" />;
      })}
      <circle cx="120" cy="120" r="28" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.6" />
      <circle cx="120" cy="120" r="4" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}

// ── Sutra Divider ────────────────────────────────────────────────────────────
function SutraDivider() {
  return (
    <div className="flex items-center gap-6 my-8">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
      <span className="text-primary/40 text-sm">✦</span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent via-primary/30 to-transparent" />
    </div>
  );
}

// ── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/10 text-primary text-[10px] tracking-[0.22em] uppercase font-bold">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const LAKSHYA = [
  {
    num: "०१", titleEn: "Age-appropriate Reconstruction", titleHi: "युगानुकूल पुनर्रचना",
    hi: "उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्रचना की दिशा एवं सूत्रों की खोज करना।",
    en: "Discovering directions for age-appropriate reconstruction of national life in every sphere based on elevated Hindu life values.",
  },
  {
    num: "०२", titleEn: "Global Network", titleHi: "वैश्विक तंत्र",
    hi: "भारतीयत्व एवं समग्र मानवता में विश्वास रखने वाले विचारशील लोगों का, समूहों का एवं प्रबुद्ध विशेषज्ञ मंडलों (Think Tanks) का शक्तिशाली व सक्रिय वैश्विक तंत्र खड़ा करना।",
    en: "Building a powerful global network of thinkers, groups and enlightened Think Tanks who believe in Bharatiyatva and universal humanity.",
  },
  {
    num: "०३", titleEn: "Awakening 'Swa'", titleHi: "स्व बोध जागरण",
    hi: "भारतीय नागरिकों में 'स्व' बोध जागृत करने हेतु वातावरण तैयार करना।",
    en: "Creating an environment to awaken 'Swa' Bodh — self-awareness and civilisational consciousness — among Indian citizens.",
  },
  {
    num: "०४", titleEn: "Intellectual Leadership", titleHi: "वैश्विक नेतृत्व",
    hi: "प्रज्ञा के क्षेत्र में वैश्विक नेतृत्व करने की दिशा में भारत को तैयार करना।",
    en: "Preparing India for global leadership in the field of Pragya — intellectual wisdom and knowledge.",
  },
];

const UDDESHYA = [
  {
    icon: Network,
    hi: "शोध", en: "Research",
    descHi: "भूराजनीति, दर्शन, संस्कृति, साहित्य, इतिहास, पर्यावरण आदि पर गहन शोध एवं विश्लेषण। समाधान-उन्मुख अध्ययन समूह।",
    descEn: "Deep research on geopolitics, philosophy, culture, literature and history. Solution-oriented study groups.",
  },
  {
    icon: BookOpen,
    hi: "सामग्री निर्माण", en: "Content Creation",
    descHi: "विश्वस्तरीय पत्रिका, पुस्तकें, शोध प्रबंध, दृश्य/श्रव्य सामग्री एवं पॉडकास्ट का निर्माण।",
    descEn: "World-class journals, books, research papers, audio/video content and podcasts for intellectual outreach.",
  },
  {
    icon: Megaphone,
    hi: "प्रसार एवं जागरण", en: "Outreach & Awakening",
    descHi: "संगोष्ठी, कार्यशाला, विचार संगम के माध्यम से व्यापक जन जागरण एवं वैश्विक प्रज्ञावान तंत्र का निर्माण।",
    descEn: "Mass awakening through seminars, workshops and Vichar Sangam — building a global network of prajna-minded people.",
  },
];

const AAYAMS = [
  { name: "युवा आयाम", en: "Yuva Aayam", icon: Flame },
  { name: "महिला आयाम", en: "Mahila Aayam", icon: Heart },
  { name: "शोध आयाम", en: "Shodh Aayam", icon: GraduationCap },
  { name: "प्रचार आयाम", en: "Prachar Aayam", icon: Megaphone },
  { name: "विमर्श आयाम", en: "Vimarsh Aayam", icon: MessagesSquare },
];

const PANCH = [
  { num: "१", hi: "सामाजिक समरसता", en: "Social Harmony", icon: Heart },
  { num: "२", hi: "कुटुंब प्रबोधन", en: "Family Awakening", icon: Home },
  { num: "३", hi: "पर्यावरण संरक्षण", en: "Environmental Protection", icon: Leaf },
  { num: "४", hi: "नागरिक कर्तव्य", en: "Civic Duty", icon: Shield },
  { num: "५", hi: "स्व का बोध", en: "Swa Bodh", icon: Zap },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function Parichay() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";

  return (
    <div className="bg-background text-foreground selection:bg-primary/20">
      
      {/* ── Editorial Hero ────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden border-b border-border/40 bg-[hsl(220_32%_8%)] text-white px-4 md:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,_hsl(27_100%_50%_/_0.12)_0%,_transparent_50%)]" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none">
          <Mandala className="w-[800px] h-[800px] animate-spin-slow" />
        </div>
        
        <div className="max-w-7xl mx-auto w-full relative z-10 py-24">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} className="space-y-10">
              <SectionLabel icon={Compass} label={isHi ? "संगठन परिचय" : "Organisation Overview"} />
              <div className="space-y-6">
                <h1 className="font-devanagari text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] tracking-tight">
                  प्रज्ञा प्रवाह
                </h1>
                <p className="max-w-2xl text-xl md:text-2xl font-medium text-primary leading-relaxed">
                  {isHi 
                    ? "भारत-केंद्रित चिंतन, संवाद और संगठित कार्य का वैश्विक तंत्र।" 
                    : "A global network for Bharat-centered thought, discourse, and organized action."}
                </p>
                <p className="max-w-2xl text-base md:text-lg text-white/60 leading-relaxed">
                  {isHi
                    ? "अखिल भारतीय चिंतन शिविर (नवंबर २०२४) में परिभाषित — संगठन की दृष्टि, लक्ष्य, उद्देश्य और आयामों का समग्र परिचय।"
                    : "Defined at the All-India Chintan Shivir (November 2024) — a complete introduction to the organisation's vision, mission, and operational dimensions."}
                </p>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button asChild size="lg" className="h-14 rounded-full px-10 text-base shadow-xl shadow-primary/20">
                  <Link href="/dashboard">
                    {isHi ? "कार्यप्रवाह देखें" : "View Operations"}
                    <ArrowRight className="ml-3 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 rounded-full px-10 text-base border-white/20 hover:bg-white/5 text-white">
                  <Link href="/vimarsh">
                    {isHi ? "विमर्श पढ़ें" : "Read Vimarsh"}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── High-Impact Vision ───────────────────────────────────────────── */}
      <section className="parchment-panel py-24 md:py-32 px-4 border-b border-border/40">
        <div className="max-w-5xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-12">
            <SectionLabel icon={Sparkles} label={isHi ? "दृष्टि · Vision" : "Vision"} />
            <div className="space-y-10">
              <h2 className="font-devanagari text-4xl md:text-6xl font-bold leading-tight tracking-tight text-foreground max-w-4xl mx-auto">
                प्रज्ञा आधारित हिंदू जीवन मूल्यों से प्रेरित,{" "}
                <span className="text-primary italic font-serif underline decoration-primary/20 decoration-8 underline-offset-8">
                  लोक कल्याणकारी
                </span>{" "}
                वैश्विक समाज रचना।
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-3xl mx-auto">
                Building a welfare-oriented global society inspired by Pragya-based Hindu life values.
              </p>
            </div>
            <div className="pt-12">
              <div className="mx-auto w-px h-24 bg-gradient-to-b from-primary/60 to-transparent" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stepped Mission ──────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-20">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-8 lg:sticky lg:top-32 h-fit">
              <SectionLabel icon={Compass} label={isHi ? "लक्ष्य · Mission" : "Mission"} />
              <h3 className="text-4xl md:text-5xl font-bold tracking-tight">
                {isHi ? "प्रज्ञा प्रवाह के चार लक्ष्य" : "Four Core Objectives"}
              </h3>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-md">
                {isHi
                  ? "लक्ष्य वे चार दिशाएँ हैं जो इस दृष्टि तक पहुँचने के मार्ग हैं।"
                  : "These four pillars constitute the directional path toward our civilisational vision."}
              </p>
            </motion.div>

            <div className="space-y-12">
              {LAKSHYA.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="group relative pl-16 pb-12 border-l border-border/60 last:border-0 last:pb-0"
                >
                  <div className="absolute left-[-21px] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-primary text-primary font-bold text-sm shadow-[0_0_15px_rgba(255,100,0,0.2)]">
                    {item.num}
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold group-hover:text-primary transition-colors">{item.titleEn}</h4>
                      <p className="font-devanagari text-xl font-semibold text-foreground/80">{item.titleHi}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 pt-2">
                      <p className="text-sm md:text-base leading-relaxed text-muted-foreground">
                        {item.en}
                      </p>
                      <p className="font-devanagari text-sm md:text-base leading-relaxed text-foreground/70">
                        {item.hi}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Asymmetric Goals ─────────────────────────────────────────────── */}
      <section className="pravah-lattice-bg py-24 md:py-32 px-4 border-y border-border/40 bg-muted/20">
        <div className="max-w-7xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-20">
            <SectionLabel icon={GraduationCap} label={isHi ? "उद्देश्य · Goals" : "Goals"} />
            <h3 className="mt-8 text-4xl md:text-5xl font-bold tracking-tight">
              {isHi ? "कार्य के तीन उद्देश्य" : "Three Pillars of Action"}
            </h3>
          </motion.div>

          <div className="grid gap-12">
            {UDDESHYA.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={cn(
                  "flex flex-col lg:flex-row items-stretch gap-8 lg:gap-16",
                  i % 2 === 1 && "lg:flex-row-reverse"
                )}
              >
                <div className="flex-1 rounded-[3rem] border border-border/60 bg-background/80 p-8 md:p-12 shadow-sm flex flex-col justify-center space-y-6 group hover:border-primary/40 transition-all">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <g.icon className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-3xl font-bold">{g.en}</h4>
                    <p className="font-devanagari text-2xl font-semibold text-foreground/80">{g.hi}</p>
                  </div>
                </div>
                <div className="flex-1 flex flex-col justify-center space-y-8 py-4">
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {g.descEn}
                  </p>
                  <p className="font-devanagari text-lg leading-relaxed text-foreground/70">
                    {g.descHi}
                  </p>
                  <div className="w-24 h-px bg-primary/40" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dimensions ───────────────────────────────────────────────────── */}
      <section className="py-24 md:py-32 px-4 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto relative">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 opacity-[0.03] pointer-events-none">
            <Mandala className="w-[600px] h-[600px]" />
          </div>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-16">
            <SectionLabel icon={Network} label={isHi ? "आयाम · Dimensions" : "Dimensions"} />
            <h3 className="mt-8 text-4xl md:text-5xl font-bold tracking-tight">
              {isHi ? "संगठन के आयाम" : "Organisational Dimensions"}
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {AAYAMS.map((a, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.5 }}
                className="group rounded-3xl border border-border/60 bg-card/30 p-8 flex flex-col items-center text-center space-y-6 transition-all hover:border-primary/40 hover:bg-card/50"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <a.icon className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="font-devanagari text-xl font-bold">{a.name}</h4>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{a.en}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Five Transformations ─────────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 px-4 bg-[hsl(220_28%_10%)] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_hsl(27_100%_50%_/_0.1)_0%,_transparent_70%)]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-20">
            <SectionLabel icon={Star} label={isHi ? "पंच परिवर्तन" : "Pancha Parivartan"} />
            <h3 className="mt-8 text-4xl md:text-5xl font-bold tracking-tight">
              {isHi ? "पाँच सामाजिक परिवर्तन" : "Five Social Transformations"}
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-5 gap-4">
            {PANCH.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="group relative rounded-3xl border border-white/10 bg-white/5 p-8 flex flex-col items-center text-center space-y-6 transition-all hover:border-primary/40 hover:bg-white/10"
              >
                <div className="text-5xl font-bold text-primary/20 font-devanagari absolute top-4 left-4 group-hover:text-primary/40 transition-colors">
                  {p.num}
                </div>
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary z-10">
                  <p.icon className="w-8 h-8" />
                </div>
                <div className="z-10">
                  <h4 className="font-devanagari text-xl font-bold">{p.hi}</h4>
                  <p className="text-xs text-white/40 uppercase tracking-widest mt-1">{p.en}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Editorial Conclusion ────────────────────────────────────────── */}
      <section className="px-4 py-32 border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="mx-auto w-24 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
          <p className="text-sm uppercase tracking-[0.4em] font-bold text-primary">Pragya Pravah</p>
          <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Giving institutional strength to <br />
            <span className="italic font-serif text-primary">Bharat-centred thought.</span>
          </h2>
          <div className="pt-8 flex justify-center">
            <Button asChild size="lg" className="h-16 rounded-full px-12 text-lg shadow-2xl shadow-primary/30">
              <Link href="/dashboard">
                {isHi ? "कार्यप्रवाह में प्रवेश करें" : "Enter Operational Workflow"}
                <ArrowRight className="ml-3 h-6 w-6" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
