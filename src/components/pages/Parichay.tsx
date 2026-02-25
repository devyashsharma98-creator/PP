"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BookOpen, Users, Flame, MessagesSquare,
  Megaphone, Eye, Globe, Compass, Sparkles, Star,
  Heart, Home, Leaf, Shield, Zap, Search, ChevronRight,
  Lightbulb, Network, GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";

// ── Sacred Mandala SVG ────────────────────────────────────────────────────────
function Mandala({ className }: { className?: string }) {
  const petals8 = [0, 45, 90, 135, 180, 225, 270, 315];
  const petals8offset = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];
  const rays16 = Array.from({ length: 16 }, (_, i) => i * 22.5);
  const dots12 = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="120" cy="120" r="116" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 6" opacity="0.25" />
      {dots12.map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        return <circle key={i} cx={+(120 + 108 * Math.cos(rad)).toFixed(4)} cy={+(120 + 108 * Math.sin(rad)).toFixed(4)} r="1.5" fill="currentColor" fillOpacity="0.3" />;
      })}
      {petals8.map((angle, i) => (
        <ellipse key={i} cx="120" cy="62" rx="13" ry="52"
          fill="currentColor" fillOpacity="0.07"
          stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.6"
          transform={`rotate(${angle} 120 120)`} />
      ))}
      <circle cx="120" cy="120" r="68" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {petals8offset.map((angle, i) => (
        <ellipse key={i} cx="120" cy="85" rx="8" ry="33"
          fill="currentColor" fillOpacity="0.1"
          stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.5"
          transform={`rotate(${angle} 120 120)`} />
      ))}
      <circle cx="120" cy="120" r="46" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />
      {rays16.map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x1 = +(120 + 30 * Math.cos(rad)).toFixed(4), y1 = +(120 + 30 * Math.sin(rad)).toFixed(4);
        const x2 = +(120 + 43 * Math.cos(rad)).toFixed(4), y2 = +(120 + 43 * Math.sin(rad)).toFixed(4);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />;
      })}
      <circle cx="120" cy="120" r="28" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.7" />
      {petals8.map((angle, i) => (
        <ellipse key={i} cx="120" cy="104" rx="4" ry="14"
          fill="currentColor" fillOpacity="0.15"
          stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.5"
          transform={`rotate(${angle} 120 120)`} />
      ))}
      <circle cx="120" cy="120" r="14" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeOpacity="0.7" strokeWidth="0.8" />
      <circle cx="120" cy="120" r="4" fill="currentColor" fillOpacity="0.6" />
    </svg>
  );
}

// ── Sutra Divider ────────────────────────────────────────────────────────────
function SutraDivider({ color = "orange" }: { color?: "orange" | "crimson" | "blue" | "violet" }) {
  const colorMap = {
    orange: "via-orange-500/40",
    crimson: "via-red-600/40",
    blue: "via-blue-500/40",
    violet: "via-violet-500/40",
  };
  return (
    <div className="flex items-center gap-3 my-2">
      <div className={`flex-1 h-px bg-gradient-to-r from-transparent ${colorMap[color]} to-transparent`} />
      <span className="text-orange-500/50 text-xs">✦</span>
      <div className={`flex-1 h-px bg-gradient-to-l from-transparent ${colorMap[color]} to-transparent`} />
    </div>
  );
}

// ── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-600 dark:text-orange-300 text-xs tracking-[0.18em] uppercase font-semibold">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────
const LAKSHYA = [
  {
    num: "०१", icon: Compass, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-l-orange-500",
    hi: "उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्रचना की दिशा एवं सूत्रों की खोज करना।",
    en: "Discovering directions for age-appropriate reconstruction of national life in every sphere based on elevated Hindu life values.",
    tag: "युगानुकूल पुनर्रचना",
  },
  {
    num: "०२", icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-l-blue-500",
    hi: "भारतीयत्व एवं समग्र मानवता में विश्वास रखने वाले विचारशील लोगों का, समूहों का एवं प्रबुद्ध विशेषज्ञ मंडलों (Think Tanks) का शक्तिशाली व सक्रिय वैश्विक तंत्र खड़ा करना।",
    en: "Building a powerful global network of thinkers, groups and enlightened Think Tanks who believe in Bharatiyatva and universal humanity.",
    tag: "वैश्विक तंत्र",
  },
  {
    num: "०३", icon: Sparkles, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-l-amber-500",
    hi: "भारतीय नागरिकों में 'स्व' बोध जागृत करने हेतु वातावरण तैयार करना।",
    en: "Creating an environment to awaken 'Swa' Bodh — self-awareness and civilisational consciousness — among Indian citizens.",
    tag: "स्व बोध जागरण",
  },
  {
    num: "०४", icon: Star, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-l-violet-500",
    hi: "प्रज्ञा के क्षेत्र में वैश्विक नेतृत्व करने की दिशा में भारत को तैयार करना।",
    en: "Preparing India for global leadership in the field of Pragya — intellectual wisdom and knowledge.",
    tag: "वैश्विक नेतृत्व",
  },
];

const UDDESHYA = [
  {
    icon: Search,
    hi: "शोध",
    en: "Research",
    color: "text-blue-500",
    border: "border-blue-500/30",
    bg: "bg-blue-500/8",
    desc: {
      hi: "भूराजनीति, दर्शन, संस्कृति, साहित्य, इतिहास, पर्यावरण आदि पर गहन शोध एवं विश्लेषण। समाधान-उन्मुख अध्ययन समूह।",
      en: "Deep research on geopolitics, philosophy, culture, literature and history. Solution-oriented study groups.",
    },
    points: [
      "राष्ट्रीय दृष्टिकोण से सभी विषयों पर विस्तृत शोध",
      "शोध हेतु लोगों को प्रेरित करना",
      "वैश्विक / राष्ट्रीय समस्याओं पर शोध द्वारा समाधान",
      "अध्ययन समूह (Study Groups) चलाना",
    ],
  },
  {
    icon: BookOpen,
    hi: "सामग्री निर्माण",
    en: "Content Creation",
    color: "text-orange-500",
    border: "border-orange-500/30",
    bg: "bg-orange-500/8",
    desc: {
      hi: "विश्वस्तरीय पत्रिका, पुस्तकें, शोध प्रबंध, दृश्य/श्रव्य सामग्री एवं पॉडकास्ट का निर्माण।",
      en: "World-class journals, books, research papers, audio/video content and podcasts for intellectual outreach.",
    },
    points: [
      "वैश्विक स्तर की पत्रिका (Journal) प्रकाशन",
      "भारतीयत्व विषयक विद्वत्तापूर्ण पुस्तकें एवं शोध प्रबंध",
      "भारत विरोधी कुप्रचार का तथ्यात्मक खंडन",
      "दृश्य/श्रव्य पॉडकास्ट एवं स्टूडियो निर्माण",
    ],
  },
  {
    icon: Megaphone,
    hi: "प्रचार, प्रसार एवं जागरण",
    en: "Outreach & Awakening",
    color: "text-emerald-500",
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/8",
    desc: {
      hi: "संगोष्ठी, कार्यशाला, विचार संगम के माध्यम से व्यापक जन जागरण एवं वैश्विक प्रज्ञावान तंत्र का निर्माण।",
      en: "Mass awakening through seminars, workshops and Vichar Sangam — building a global network of prajna-minded people.",
    },
    points: [
      "अध्ययनशील एवं चिंतक वर्ग तक विचार प्रेषण",
      "संगोष्ठी / सेमिनार / कार्यशाला / विचार संगम",
      "वैश्विक स्तर पर प्रज्ञावान लोगों का व्यापक तंत्र निर्माण",
      "पारंपरिक एवं आधुनिक प्रचार माध्यमों का विकास",
    ],
  },
];

const AAYAMS = [
  {
    name: "युवा आयाम", en: "Yuva Aayam", icon: Flame,
    desc: { hi: "स्वामी विवेकानंद की दृष्टि से युवा नेतृत्व और भारतीय मूल्यों का विकास", en: "Youth leadership through Bharatiya values and Swami Vivekananda's vision" },
    color: "text-orange-500", border: "border-orange-500/25", bg: "bg-orange-500/8",
    fromPdf: true,
  },
  {
    name: "महिला आयाम", en: "Mahila Aayam", icon: Users,
    desc: { hi: "शक्ति दर्शन — भारत की सभ्यता की आधारशक्ति", en: "Shakti philosophy — women as the civilisational force of Bharat" },
    color: "text-rose-500", border: "border-rose-500/25", bg: "bg-rose-500/8",
    fromPdf: true,
  },
  {
    name: "शोध आयाम", en: "Shodh Aayam", icon: BookOpen,
    desc: { hi: "भारतीय ज्ञान परंपरा — वैदिक विज्ञान और शोध", en: "Research grounded in Indian Knowledge Systems — IKS and Vedic sciences" },
    color: "text-blue-500", border: "border-blue-500/25", bg: "bg-blue-500/8",
    fromPdf: true,
  },
  {
    name: "प्रचार आयाम", en: "Prachar Aayam", icon: Megaphone,
    desc: { hi: "डिजिटल माध्यमों पर भारतीय विचारों का प्रसार", en: "Spreading Bharatiya thought across digital platforms and social media" },
    color: "text-emerald-500", border: "border-emerald-500/25", bg: "bg-emerald-500/8",
    fromPdf: true,
  },
  {
    name: "विमर्श आयाम", en: "Vimarsh Aayam", icon: MessagesSquare,
    desc: { hi: "मंडन और खंडन — 15 विषयों पर भारत-विरोधी विचारों का खंडन। यह प्रत्यक्ष PDF में उल्लिखित 'कार्य का स्वरूप — विमर्श' का डिजिटल एप आयाम है।", en: "मंडन and खंडन — counter anti-India narratives across 15 topics. This is the app's operational extension of the PDF's Vimarsh work-stream." },
    color: "text-violet-500", border: "border-violet-500/25", bg: "bg-violet-500/8",
    fromPdf: false,
  },
];

const PANCH = [
  {
    num: "१", hi: "सामाजिक समरसता", en: "Social Harmony", icon: Heart, color: "text-rose-500", border: "border-rose-500/25", bg: "bg-rose-500/8",
    desc: { hi: "जाति-भेद और ऊँच-नीच की भावना को समाप्त करके समाज में सभी वर्गों के बीच एकता और सद्भाव बढ़ाना।", en: "Ending caste discrimination and promoting unity and harmony among all sections of society." },
  },
  {
    num: "२", hi: "कुटुंब प्रबोधन", en: "Family Awakening", icon: Home, color: "text-amber-500", border: "border-amber-500/25", bg: "bg-amber-500/8",
    desc: { hi: "परिवार के मूल्यों को बढ़ावा देने और संयुक्त परिवार की परंपरा को मजबूत करने पर केंद्रित। बच्चों में संस्कारों का विकास और परिवारों को आधुनिक चुनौतियों से बचाना।", en: "Strengthening family values, joint family traditions and cultivating good values in children. Protecting families from modern challenges." },
  },
  {
    num: "३", hi: "पर्यावरण संरक्षण", en: "Environmental Protection", icon: Leaf, color: "text-emerald-500", border: "border-emerald-500/25", bg: "bg-emerald-500/8",
    desc: { hi: "प्रकृति को माता मानकर उसकी रक्षा। पर्यावरण के अनुकूल जीवनशैली अपनाने और जल, वायु व मिट्टी के संरक्षण के प्रति जागरूक करना।", en: "Treating nature as mother and protecting her. Adopting eco-friendly lifestyles and raising awareness for conserving water, air and soil." },
  },
  {
    num: "४", hi: "नागरिक कर्तव्य", en: "Civic Duty", icon: Shield, color: "text-blue-500", border: "border-blue-500/25", bg: "bg-blue-500/8",
    desc: { hi: "हर नागरिक अपने अधिकारों के साथ-साथ कर्तव्यों के प्रति सजग रहे। राष्ट्रहित में योगदान देना, सार्वजनिक संपत्ति की रक्षा करना और संविधान का पालन करना।", en: "Every citizen must be aware of duties alongside rights — contributing to national interest, protecting public property and upholding the Constitution." },
  },
  {
    num: "५", hi: "स्व का बोध", en: "Swa Bodh", icon: Zap, color: "text-violet-500", border: "border-violet-500/25", bg: "bg-violet-500/8",
    desc: { hi: "अपनी संस्कृति, सभ्यता और स्वदेशी उत्पादों के प्रति जागरूकता बढ़ाना। आत्मनिर्भरता को बढ़ावा और फिजूलखर्ची को कम करना, ताकि देश का पैसा देश में ही रहे।", en: "Raising awareness about one's own culture, civilisation and indigenous products. Promoting self-reliance and reducing wasteful expenditure so the country's wealth stays within." },
  },
];

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

export default function Parichay() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";

  return (
    <div className="min-h-screen space-y-0 pb-10">

      {/* ══════════════════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-[hsl(220_32%_8%)] text-white py-16 sm:py-20 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_40%,_hsl(27_100%_50%_/_0.09)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_60%_at_80%_20%,_hsl(220_80%_40%_/_0.07)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute top-8 right-8 pointer-events-none">
          <Mandala className="w-52 h-52 text-orange-400 opacity-[0.06] animate-spin-slow" />
        </div>
        <div className="absolute bottom-4 left-4 pointer-events-none">
          <Mandala className="w-32 h-32 text-blue-400 opacity-[0.04]" />
        </div>

        <div className="max-w-3xl mx-auto text-center space-y-5 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs tracking-[0.2em] uppercase font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              {isHi ? "संगठन परिचय" : "Organisation Overview"}
            </span>
          </motion.div>

          <motion.h1
            initial="hidden" animate="visible" variants={fadeUp}
            className="font-devanagari font-bold text-white leading-tight"
            style={{ fontSize: "clamp(2rem, 7vw, 3.8rem)" }}
          >
            प्रज्ञा प्रवाह
          </motion.h1>

          <motion.p
            initial="hidden" animate="visible" variants={{ ...fadeUp, hidden: { opacity: 0, y: 20 } }}
            className="font-devanagari text-orange-300/80 text-base sm:text-lg leading-relaxed max-w-xl mx-auto"
          >
            {isHi
              ? "अखिल भारतीय चिंतन शिविर (नवंबर २०२४) में परिभाषित — संगठन की दृष्टि, लक्ष्य, उद्देश्य और आयामों का समग्र परिचय।"
              : "Defined at the All-India Chintan Shivir (November 2024) — a complete introduction to the organisation's vision, mission, goals and aayams."}
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-wrap gap-2 justify-center">
            {[
              { href: "/dayitv", label: isHi ? "दायित्व" : "Dayitv", icon: Network },
              { href: "/vimarsh", label: isHi ? "विमर्श" : "Vimarsh", icon: MessagesSquare },
              { href: "/dashboard", label: isHi ? "डैशबोर्ड" : "Dashboard", icon: ArrowRight },
            ].map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}>
                <Button size="sm" variant="outline"
                  className="border-white/25 text-white/75 hover:bg-white/10 hover:text-white text-xs gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {label}
                </Button>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — प्रज्ञा क्या है?
      ══════════════════════════════════════════════════════════════ */}
      <section className="parchment-panel py-14 sm:py-18 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="space-y-5"
          >
            <motion.div variants={fadeUp} className="text-center">
              <SectionLabel icon={Lightbulb} label={isHi ? "प्रज्ञा क्या है?" : "What is Pragya?"} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-devanagari font-bold text-center text-2xl sm:text-3xl text-foreground">
              प्रज्ञा क्या है?
            </motion.h2>
            <SutraDivider />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  label: "व्युत्पत्ति",
                  hi: "'प्र' (Pra) + 'ज्ञा' (jña) — 'प्र' अर्थात् पूर्ण, तीव्र, आगे। 'ज्ञा' अर्थात् जानना। प्रज्ञा = गहन, परिष्कृत एवं शुद्ध ज्ञान।",
                  en: "'Pra' (forward, complete) + 'jña' (to know). Pragya = deep, refined and pure knowledge.",
                  icon: "✦",
                },
                {
                  label: "सामान्य बुद्धि से भिन्न",
                  hi: "प्रज्ञा केवल सामान्य बुद्धि नहीं है — यह अध्ययन, अभ्यास और निरीक्षण से प्राप्त परिष्कृत और शुद्ध बौद्धिक चेतना है।",
                  en: "Pragya is not mere intelligence — it is refined intellectual consciousness attained through study, practice and observation.",
                  icon: "◈",
                },
                {
                  label: "महावाक्य",
                  hi: "\"प्रज्ञानं ब्रह्म\" — प्रज्ञान ही ब्रह्म है। (ऋग्वेद का महावाक्य) — प्रकट ज्ञान को ब्रह्म के समान माना गया है।",
                  en: "\"Prajñānaṃ Brahma\" — Consciousness is Brahma (Rigveda). Manifest knowledge is equated with the Absolute.",
                  icon: "ॐ",
                },
                {
                  label: "निहितार्थ",
                  hi: "प्रज्ञा वह दृष्टि है जो भारत को अपनी सभ्यतागत जड़ों से पुनः जोड़ती है और सार्वभौमिक कल्याण की राह दिखाती है।",
                  en: "Pragya is the vision that reconnects India with its civilisational roots and guides universal welfare.",
                  icon: "◉",
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="glass-card hover-lift rounded-xl border border-orange-500/15 bg-orange-500/5 p-5 space-y-2.5"
                >
                  <div className="flex items-start gap-3">
                    <span className="font-devanagari text-2xl text-orange-400 leading-none mt-0.5">{item.icon}</span>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-orange-500/70 font-semibold mb-1">{item.label}</p>
                      <p className={`text-sm leading-relaxed text-foreground/80 ${isHi ? "font-devanagari" : ""}`}>
                        {isHi ? item.hi : item.en}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — प्रज्ञा प्रवाह क्या है?
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-14 sm:py-18 px-4 bg-[hsl(220_28%_10%)] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,_hsl(27_100%_50%_/_0.06)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/25 to-transparent" />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          <Mandala className="w-80 h-80 text-orange-400 opacity-[0.045] animate-spin-slow" />
        </div>

        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-5">
            <motion.div variants={fadeUp} className="text-center">
              <SectionLabel icon={Network} label={isHi ? "प्रज्ञा प्रवाह क्या है?" : "What is Pragya Pravah?"} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-devanagari font-bold text-center text-2xl sm:text-3xl text-white">
              प्रज्ञा प्रवाह क्या है?
            </motion.h2>
            <SutraDivider />
            <motion.div variants={fadeUp}
              className="rounded-2xl border border-orange-500/20 bg-white/5 p-6 sm:p-8 space-y-4"
            >
              <p className="font-devanagari text-lg sm:text-xl text-orange-200/90 leading-relaxed text-center">
                उदात्त हिंदू जीवन मूल्यों के आधार पर, राष्ट्र जीवन के प्रत्येक क्षेत्र में, युगानुकूल पुनर्रचना की दिशा में,
                भारतीयत्व में विश्वास रखने वाले विचारशील लोगों का, समूहों का, एवं प्रबुद्ध विशेषज्ञ मंडलों (थिंकटैंक) का वैश्विक तंत्र।
              </p>
              <SutraDivider color="orange" />
              <p className="text-sm text-white/55 text-center leading-relaxed italic">
                A global network of thinkers, groups and enlightened Think Tanks who believe in Bharatiyatva and are
                working for age-appropriate reconstruction of national life in every sphere — grounded in elevated Hindu life values.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 3 — दृष्टि (Vision)
      ══════════════════════════════════════════════════════════════ */}
      <section className="parchment-panel py-14 sm:py-18 px-4">
        <div className="max-w-3xl mx-auto space-y-7">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-5">
            <motion.div variants={fadeUp} className="text-center">
              <SectionLabel icon={Eye} label={isHi ? "दृष्टि · Vision" : "दृष्टि · Vision"} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="font-devanagari font-bold text-center text-2xl sm:text-3xl text-foreground">
              प्रज्ञा प्रवाह की दृष्टि
            </motion.h2>
            <SutraDivider />
            <motion.div variants={fadeUp}
              className="relative rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-transparent p-6 sm:p-10 text-center overflow-hidden"
            >
              <Mandala className="absolute -right-10 -top-10 w-48 h-48 text-orange-400 opacity-[0.06] animate-spin-slow pointer-events-none" />
              <p className="font-devanagari font-bold text-foreground leading-relaxed" style={{ fontSize: "clamp(1.2rem, 3vw, 1.7rem)" }}>
                प्रज्ञा आधारित हिंदू जीवन मूल्यों से प्रेरित,{" "}
                <span className="text-orange-500">लोक कल्याणकारी</span>{" "}
                वैश्विक समाज रचना।
              </p>
              <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                Building a welfare-oriented global society inspired by Pragya-based Hindu life values.
              </p>
            </motion.div>
            <motion.div variants={fadeUp}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3"
            >
              <span className="text-amber-500 text-lg mt-0.5">⚑</span>
              <p className={`text-sm text-foreground/70 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                {isHi
                  ? "दृष्टि और लक्ष्य में अंतर: दृष्टि वह वांछित भविष्य है जिसकी ओर हम अग्रसर हैं — 'लोक कल्याणकारी वैश्विक समाज'। लक्ष्य वे चार दिशाएँ हैं जो इस दृष्टि तक पहुँचने के मार्ग हैं।"
                  : "Distinguishing दृष्टि from लक्ष्य: दृष्टि is the desired future state we move towards — 'welfare-oriented global society'. लक्ष्य are the four directional pillars that constitute the path towards that vision."}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 4 — लक्ष्य (Mission — 4 Directions)
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-18 px-4 bg-card">
        <div className="max-w-3xl mx-auto space-y-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-3">
            <SectionLabel icon={Compass} label={isHi ? "लक्ष्य · Mission" : "लक्ष्य · Mission"} />
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "प्रज्ञा प्रवाह के चार लक्ष्य" : "Four Mission Objectives"}
            </h2>
            <p className={`text-sm text-muted-foreground max-w-lg mx-auto ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "अखिल भारतीय चिंतन शिविर (नवंबर २०२४) में निर्धारित चार प्रमुख लक्ष्य।"
                : "Four core objectives defined at the All-India Chintan Shivir (November 2024)."}
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-4">
            {LAKSHYA.map((m, i) => (
              <motion.div
                key={i} variants={fadeUp}
                className={`relative rounded-xl border-l-4 ${m.border} bg-background p-5 shadow-sm hover:shadow-md transition-shadow group`}
              >
                <div className="flex items-start gap-4">
                  <span className={`font-devanagari text-4xl sm:text-5xl font-bold ${m.color} opacity-15 group-hover:opacity-35 transition-opacity leading-none shrink-0 select-none`}>
                    {m.num}
                  </span>
                  <div className="flex-1 space-y-2 min-w-0">
                    <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full ${m.bg} ${m.color} font-semibold tracking-wide font-devanagari`}>
                      {m.tag}
                    </span>
                    <p className={`text-sm leading-relaxed text-foreground/80 ${isHi ? "font-devanagari" : ""}`}>
                      {isHi ? m.hi : m.en}
                    </p>
                    {isHi && <p className="text-xs text-muted-foreground italic">{m.en}</p>}
                  </div>
                  <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 5 — उद्देश्य (Goals — 3 Pillars)
      ══════════════════════════════════════════════════════════════ */}
      <section className="parchment-panel py-14 sm:py-18 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-3">
            <SectionLabel icon={GraduationCap} label={isHi ? "उद्देश्य · Goals" : "उद्देश्य · Goals"} />
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "कार्य के तीन उद्देश्य" : "Three Goals of Work"}
            </h2>
            <p className={`text-sm text-muted-foreground max-w-lg mx-auto ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "लक्ष्य प्राप्ति हेतु कार्य के तीन मूल स्तंभ — शोध, सामग्री निर्माण और जन जागरण।"
                : "Three foundational pillars of work towards the mission — Research, Content Creation and Outreach."}
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 gap-5"
          >
            {UDDESHYA.map((g, i) => (
              <motion.div key={i} variants={fadeUp}
                className={`glass-card hover-lift rounded-2xl border ${g.border} ${g.bg} p-5 sm:p-6 space-y-4`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${g.bg} border ${g.border} flex items-center justify-center shrink-0`}>
                    <g.icon className={`w-5 h-5 ${g.color}`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${g.color} font-devanagari`}>{g.hi}</h3>
                    <p className="text-[10px] text-muted-foreground">{g.en}</p>
                  </div>
                </div>
                <p className={`text-sm text-foreground/70 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                  {isHi ? g.desc.hi : g.desc.en}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {g.points.map((pt, j) => (
                    <div key={j} className="flex items-start gap-2">
                      <ChevronRight className={`w-3.5 h-3.5 ${g.color} mt-0.5 shrink-0`} />
                      <span className="font-devanagari text-xs text-foreground/65 leading-relaxed">{pt}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-start gap-3"
          >
            <span className="text-blue-500 text-sm mt-0.5">ℹ</span>
            <p className={`text-xs text-foreground/65 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "उद्देश्य और लक्ष्य में अंतर: लक्ष्य (Mission) वह दिशा है जिसमें जाना है। उद्देश्य (Goals) वे कार्य-क्षेत्र हैं जिनके माध्यम से उस लक्ष्य की ओर बढ़ा जाता है।"
                : "Distinguishing उद्देश्य from लक्ष्य: लक्ष्य (Mission) is the direction to travel. उद्देश्य (Goals) are the work-domains through which we progress towards that direction."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 6 — आयाम (Dimensions)
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-14 sm:py-18 px-4 bg-card">
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-3">
            <SectionLabel icon={Sparkles} label={isHi ? "आयाम · Dimensions" : "आयाम · Dimensions"} />
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "संगठन के आयाम" : "Organisational Dimensions"}
            </h2>
            <p className={`text-sm text-muted-foreground max-w-2xl mx-auto ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "PDF दस्तावेज़ में चार आयाम (युवा, महिला, शोध, प्रचार) प्रांत स्तर पर निर्धारित हैं। इस एप में विमर्श आयाम को 'कार्य का स्वरूप — मंडन खंडन' के डिजिटल विस्तार के रूप में जोड़ा गया है।"
                : "The PDF document defines four aayams (Yuva, Mahila, Shodh, Prachar) at the Prant level. The Vimarsh Aayam is added in this app as a digital extension of the 'Mandan-Khandan' work-stream."}
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {AAYAMS.map((a, i) => (
              <motion.div key={i} variants={fadeUp}>
                <div className={`glass-card hover-lift rounded-xl border p-5 space-y-3 ${a.border} ${a.bg} h-full relative overflow-hidden`}>
                  {a.fromPdf && (
                    <span className="absolute top-3 right-3 text-[9px] bg-orange-500/15 text-orange-500 border border-orange-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                      PDF
                    </span>
                  )}
                  {!a.fromPdf && (
                    <span className="absolute top-3 right-3 text-[9px] bg-violet-500/15 text-violet-500 border border-violet-500/20 px-1.5 py-0.5 rounded-full font-semibold">
                      App Extension
                    </span>
                  )}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${a.bg} border ${a.border}`}>
                    <a.icon className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div>
                    <h3 className={`font-semibold font-devanagari text-sm ${a.color}`}>{a.name}</h3>
                    <p className="text-[10px] text-muted-foreground">{a.en}</p>
                  </div>
                  <p className={`text-xs text-foreground/70 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                    {a.desc[lang]}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-start gap-3"
          >
            <MessagesSquare className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
            <p className={`text-xs text-foreground/65 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "विमर्श आयाम: PDF में 'कार्य का स्वरूप — मंडन एवं खंडन' के अंतर्गत वर्णित कार्य इस एप में 'विमर्श' अनुभाग के रूप में प्रस्तुत है। यह पाँच आयामों वाले इस एप की परिचालन आवश्यकता है।"
                : "Vimarsh Aayam: The work described in the PDF under 'Kary ka Swaroop — Mandan evam Khandan' is operationalised in this app as the 'Vimarsh' section. This is a practical digital necessity for the 5-aayam app structure."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 7 — पंच परिवर्तन
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-14 sm:py-18 px-4 bg-[hsl(220_28%_10%)] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,_hsl(27_100%_50%_/_0.04)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/25 to-transparent" />

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-3">
            <SectionLabel icon={Star} label={isHi ? "पंच परिवर्तन" : "Pancha Parivartan"} />
            <h2 className={`text-2xl sm:text-3xl font-bold text-white ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "पाँच सामाजिक परिवर्तन" : "Five Social Transformations"}
            </h2>
            <p className={`text-sm text-white/50 max-w-lg mx-auto ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "समाज में व्यापक परिवर्तन के लिए प्रज्ञा प्रवाह के पाँच प्रमुख कार्यक्षेत्र।"
                : "Five key domains of social transformation that Pragya Pravah works towards."}
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {PANCH.map((p, i) => (
              <motion.div key={i} variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl border ${p.border} ${p.bg} p-5 space-y-3 group overflow-hidden cursor-default`}
              >
                <div className="absolute -right-5 -top-5 pointer-events-none opacity-[0.06] group-hover:opacity-[0.13] transition-opacity duration-500">
                  <Mandala className={`w-24 h-24 ${p.color} animate-spin-slow`} />
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-devanagari text-3xl font-bold ${p.color} opacity-20 group-hover:opacity-50 transition-opacity select-none`}>
                    {p.num}
                  </span>
                  <div className={`w-9 h-9 rounded-lg ${p.bg} border ${p.border} flex items-center justify-center`}>
                    <p.icon className={`w-4 h-4 ${p.color}`} />
                  </div>
                </div>
                <div>
                  <h3 className={`font-bold font-devanagari text-sm ${p.color}`}>{p.hi}</h3>
                  <p className="text-[10px] text-white/40">{p.en}</p>
                </div>
                <p className={`text-xs text-white/60 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                  {isHi ? p.desc.hi : p.desc.en}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PATHWAY CTAs
      ══════════════════════════════════════════════════════════════ */}
      <section className="parchment-panel py-12 sm:py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-2">
            <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-medium">
              {isHi ? "आगे बढ़ें" : "Continue Exploring"}
            </p>
            <h2 className={`text-xl sm:text-2xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "अगले अनुभागों में प्रवेश करें" : "Explore the App"}
            </h2>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[
              { href: "/dayitv", icon: Network, hi: "दायित्व", en: "Dayitv", color: "border-amber-500/30 hover:border-amber-500/60" },
              { href: "/vimarsh", icon: MessagesSquare, hi: "विमर्श", en: "Vimarsh", color: "border-violet-500/30 hover:border-violet-500/60" },
              { href: "/dashboard", icon: ArrowRight, hi: "डैशबोर्ड", en: "Dashboard", color: "border-blue-500/30 hover:border-blue-500/60" },
              { href: "/", icon: Home, hi: "मुखपृष्ठ", en: "Home", color: "border-orange-500/30 hover:border-orange-500/60" },
            ].map(({ href, icon: Icon, hi, en, color }) => (
              <motion.div key={href} variants={fadeUp}>
                <Link href={href}>
                  <div className={`glass-card hover-lift rounded-xl border ${color} p-4 text-center space-y-2 cursor-pointer transition-colors group`}>
                    <Icon className="w-5 h-5 mx-auto text-primary group-hover:text-primary transition-colors" />
                    <p className="font-devanagari text-sm font-semibold text-foreground">{hi}</p>
                    <p className="text-[10px] text-muted-foreground">{en}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
