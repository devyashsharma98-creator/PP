"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import { TypeAnimation } from "react-type-animation";
import {
  ArrowRight, ChevronDown, BookOpen, Users, Flame, MessagesSquare,
  Search, Megaphone, Eye, Globe, Compass, Sparkles, Star,
  Heart, Home, Leaf, Shield, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";

// ── Sacred Mandala SVG ───────────────────────────────────────────────────────
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

// ── Counter-rotating decorative ring ────────────────────────────────────────
function OuterRing({ className }: { className?: string }) {
  const ticks = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 300 300" className={className} fill="none">
      <circle cx="150" cy="150" r="146" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1 8" opacity="0.2" />
      {ticks.map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const len = i % 6 === 0 ? 10 : 5;
        const r1 = 138, r2 = r1 - len;
        return (
          <line key={i}
            x1={+(150 + r1 * Math.cos(rad)).toFixed(4)} y1={+(150 + r1 * Math.sin(rad)).toFixed(4)}
            x2={+(150 + r2 * Math.cos(rad)).toFixed(4)} y2={+(150 + r2 * Math.sin(rad)).toFixed(4)}
            stroke="currentColor" strokeOpacity={i % 6 === 0 ? 0.5 : 0.2} strokeWidth={i % 6 === 0 ? 1.2 : 0.6} />
        );
      })}
    </svg>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const AAYAMS = [
  {
    name: "युवा आयाम", en: "Yuva Aayam",
    icon: Flame,
    desc: { en: "Youth leadership through Bharatiya values and Swami Vivekananda's vision", hi: "स्वामी विवेकानंद की दृष्टि से युवा नेतृत्व और भारतीय मूल्यों का विकास" },
    color: "text-orange-500", border: "border-orange-500/25", bg: "bg-orange-500/8",
  },
  {
    name: "महिला आयाम", en: "Mahila Aayam",
    icon: Users,
    desc: { en: "Shakti philosophy — women as the civilisational force of Bharat", hi: "शक्ति दर्शन — भारत की सभ्यता की आधारशक्ति" },
    color: "text-rose-500", border: "border-rose-500/25", bg: "bg-rose-500/8",
  },
  {
    name: "शोध आयाम", en: "Shodh Aayam",
    icon: BookOpen,
    desc: { en: "Research grounded in Indian Knowledge Systems — IKS and Vedic sciences", hi: "भारतीय ज्ञान परंपरा — वैदिक विज्ञान और शोध" },
    color: "text-blue-500", border: "border-blue-500/25", bg: "bg-blue-500/8",
  },
  {
    name: "प्रचार आयाम", en: "Prachar Aayam",
    icon: Flame,
    desc: { en: "Spreading Bharatiya thought across digital platforms and social media", hi: "डिजिटल माध्यमों पर भारतीय विचारों का प्रसार" },
    color: "text-emerald-500", border: "border-emerald-500/25", bg: "bg-emerald-500/8",
  },
  {
    name: "विमर्श आयाम", en: "Vimarsh Aayam",
    icon: MessagesSquare,
    desc: { en: "मंडन और खंडन — identify and counter anti-India narratives across 15 topics", hi: "मंडन और खंडन — 15 विषयों पर भारत-विरोधी विचारों का खंडन" },
    color: "text-violet-500", border: "border-violet-500/25", bg: "bg-violet-500/8",
  },
];

const SHLOKAS = [
  { devanagari: "सा विद्या या विमुक्तये", transliteration: "Sā Vidyā yā vimuktaye", translation: "That is knowledge which liberates", source: "विष्णु पुराण · Vishnu Purana" },
  { devanagari: "धर्मो रक्षति रक्षितः", transliteration: "Dharmo rakṣati rakṣitaḥ", translation: "Dharma protects those who protect it", source: "मनुस्मृति · Manusmriti" },
];

// Vision words with accent highlighting on "लोक कल्याणकारी"
const VISION_WORDS_HI = [
  { text: "प्रज्ञा", accent: false },
  { text: "आधारित", accent: false },
  { text: "हिंदू", accent: false },
  { text: "जीवन", accent: false },
  { text: "मूल्यों", accent: false },
  { text: "से", accent: false },
  { text: "प्रेरित", accent: false },
  { text: "लोक", accent: true },
  { text: "कल्याणकारी", accent: true },
  { text: "वैश्विक", accent: false },
  { text: "समाज", accent: false },
  { text: "रचना।", accent: false },
];

const MISSION_POINTS = [
  {
    num: "01",
    icon: Compass,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    borderClass: "border-l-orange-500",
    hi: "उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्रचना की दिशा एवं सूत्रों की खोज करना।",
    en: "Discovering directions for age-appropriate reconstruction of national life in every sphere based on elevated Hindu life values.",
    tag: { hi: "युगानुकूल पुनर्रचना", en: "Age-appropriate Reconstruction" },
  },
  {
    num: "02",
    icon: Globe,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    borderClass: "border-l-blue-500",
    hi: "भारतीयत्व एवं समग्र मानवता में विश्वास रखने वाले विचारशील लोगों का, समूहों का एवं प्रबुद्ध विशेषज्ञ मंडलों (Think Tanks) का शक्तिशाली व सक्रिय वैश्विक तंत्र खड़ा करना।",
    en: "Building a powerful global network of thinkers, groups and enlightened Think Tanks who believe in Bharatiyatva and universal humanity.",
    tag: { hi: "वैश्विक तंत्र", en: "Global Network" },
  },
  {
    num: "03",
    icon: Sparkles,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    borderClass: "border-l-amber-500",
    hi: "भारतीय नागरिकों में 'स्व' बोध जागृत करने हेतु वातावरण तैयार करना।",
    en: "Creating an environment to awaken 'Swa' Bodh — self-awareness and civilisational consciousness — among Indian citizens.",
    tag: { hi: "स्व बोध जागरण", en: "Swa Bodh Awakening" },
  },
  {
    num: "04",
    icon: Star,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    borderClass: "border-l-violet-500",
    hi: "प्रज्ञा के क्षेत्र में वैश्विक नेतृत्व करने की दिशा में भारत को तैयार करना।",
    en: "Preparing India for global leadership in the field of Pragya — intellectual wisdom and knowledge.",
    tag: { hi: "वैश्विक नेतृत्व", en: "Global Leadership" },
  },
];

const GOALS = [
  {
    icon: Search,
    hi: "शोध",
    en: "Research",
    color: "text-blue-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/5",
    glowColor: "rgba(59,130,246,0.12)",
    desc: {
      hi: "भूराजनीति, दर्शन, संस्कृति, इतिहास, पर्यावरण आदि पर गहन शोध एवं विश्लेषण। अध्ययन केंद्र एवं शिक्षण केंद्र।",
      en: "Deep research on geopolitics, philosophy, culture, history and environment. Study groups and training centers.",
    },
  },
  {
    icon: BookOpen,
    hi: "सामग्री निर्माण",
    en: "Content Creation",
    color: "text-orange-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/5",
    glowColor: "rgba(249,115,22,0.12)",
    desc: {
      hi: "विश्वस्तरीय पत्रिका, पुस्तकें, शोध प्रबंध, दृश्य/श्रव्य सामग्री एवं पॉडकास्ट का निर्माण।",
      en: "World-class journals, books, research papers, audio/video content and podcasts for intellectual outreach.",
    },
  },
  {
    icon: Megaphone,
    hi: "प्रचार, प्रसार एवं जागरण",
    en: "Outreach & Awakening",
    color: "text-emerald-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/5",
    glowColor: "rgba(16,185,129,0.12)",
    desc: {
      hi: "संगोष्ठी, कार्यशाला, विचार संगम के माध्यम से व्यापक जन जागरण एवं वैश्विक प्रज्ञावान तंत्र का निर्माण।",
      en: "Mass awakening through seminars, workshops and Vichar Sangam — building a global network of prajna-minded people.",
    },
  },
];

const PANCH = [
  {
    num: "१",
    hi: "सामाजिक समरसता",
    en: "Social Harmony",
    icon: Heart,
    color: "text-rose-500",
    border: "border-rose-500/25",
    bg: "bg-rose-500/8",
    desc: {
      hi: "जाति-भेद और ऊँच-नीच की भावना को समाप्त करके समाज में सभी वर्गों के बीच एकता और सद्भाव बढ़ाना।",
      en: "Ending caste discrimination and promoting unity and harmony among all sections of society.",
    },
  },
  {
    num: "२",
    hi: "कुटुंब प्रबोधन",
    en: "Family Awakening",
    icon: Home,
    color: "text-amber-500",
    border: "border-amber-500/25",
    bg: "bg-amber-500/8",
    desc: {
      hi: "परिवार के मूल्यों को बढ़ावा देने और संयुक्त परिवार की परंपरा को मजबूत करने पर केंद्रित। बच्चों में संस्कारों का विकास और परिवारों को आधुनिक चुनौतियों से बचाना।",
      en: "Strengthening family values, joint family traditions and cultivating good values in children. Protecting families from modern challenges.",
    },
  },
  {
    num: "३",
    hi: "पर्यावरण संरक्षण",
    en: "Environmental Protection",
    icon: Leaf,
    color: "text-emerald-500",
    border: "border-emerald-500/25",
    bg: "bg-emerald-500/8",
    desc: {
      hi: "प्रकृति को माता मानकर उसकी रक्षा। पर्यावरण के अनुकूल जीवनशैली अपनाने और जल, वायु व मिट्टी के संरक्षण के प्रति जागरूक करना।",
      en: "Treating nature as mother and protecting her. Adopting eco-friendly lifestyles and raising awareness for conserving water, air and soil.",
    },
  },
  {
    num: "४",
    hi: "नागरिक कर्तव्य",
    en: "Civic Duty",
    icon: Shield,
    color: "text-blue-500",
    border: "border-blue-500/25",
    bg: "bg-blue-500/8",
    desc: {
      hi: "हर नागरिक अपने अधिकारों के साथ-साथ कर्तव्यों के प्रति सजग रहे। राष्ट्रहित में योगदान देना, सार्वजनिक संपत्ति की रक्षा करना और संविधान का पालन करना।",
      en: "Every citizen must be aware of duties alongside rights — contributing to national interest, protecting public property and upholding the Constitution.",
    },
  },
  {
    num: "५",
    hi: "स्व का बोध",
    en: "Swa Bodh",
    icon: Zap,
    color: "text-violet-500",
    border: "border-violet-500/25",
    bg: "bg-violet-500/8",
    desc: {
      hi: "अपनी संस्कृति, सभ्यता और स्वदेशी उत्पादों के प्रति जागरूकता बढ़ाना। आत्मनिर्भरता को बढ़ावा और फिजूलखर्ची को कम करना, ताकि देश का पैसा देश में ही रहे।",
      en: "Raising awareness about one's own culture, civilisation and indigenous products. Promoting self-reliance and reducing wasteful expenditure so the country's wealth stays within.",
    },
  },
];

// Animation variants for word-by-word vision reveal
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } },
};
const wordVariant = {
  hidden: { opacity: 0, y: 24, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.55, ease: "easeOut" as const } },
};

export default function LandingPage() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      {/* ══════════════════════════════════════════════════════════════
          HERO — dark navy, mandala, Om, shloka, org name
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-[hsl(220_32%_7%)] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_hsl(27_100%_50%_/_0.10)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_70%,_hsl(220_80%_40%_/_0.08)_0%,_transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <OuterRing className="w-[min(90vw,680px)] h-[min(90vw,680px)] text-orange-400 animate-spin-slow-reverse opacity-[0.06]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Mandala className="w-[min(80vw,600px)] h-[min(80vw,600px)] text-orange-300 opacity-[0.05]" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center px-5 space-y-7 max-w-2xl py-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.4, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-40 h-40 sm:w-52 sm:h-52"
          >
            <OuterRing className="absolute inset-[-16%] w-[132%] h-[132%] text-orange-400/50 animate-spin-slow-reverse" />
            <Mandala className="absolute inset-0 w-full h-full text-orange-400 animate-spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-devanagari animate-glow-breathe select-none"
                style={{ fontSize: "clamp(2rem,8vw,3.5rem)", color: "hsl(27 100% 65%)", textShadow: "0 0 30px hsl(27 100% 55% / 0.8), 0 0 60px hsl(27 100% 50% / 0.4)" }}>
                ॐ
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.9 }}
            className="space-y-1.5"
          >
            <p className="font-devanagari text-lg sm:text-xl tracking-widest text-orange-300/90 leading-relaxed">
              {SHLOKAS[0].devanagari}
            </p>
            <p className="text-[11px] text-white/35 tracking-widest italic">
              {SHLOKAS[0].translation} — {SHLOKAS[0].source}
            </p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.7 }}
            className="flex items-center gap-3 w-full max-w-xs"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-orange-500/20" />
            <span className="text-orange-500/50 text-xs font-devanagari">✦ ✦ ✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-orange-500/50 to-orange-500/20" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.9 }}
            className="space-y-2"
          >
            <h1 className="font-devanagari font-bold text-white leading-tight"
              style={{ fontSize: "clamp(2.4rem, 9vw, 4.5rem)", textShadow: "0 2px 20px hsl(27 100% 50% / 0.2)" }}>
              <TypeAnimation
                sequence={[400, "प्रज्ञा", 300, "प्रज्ञा प्रवाह"]}
                wrapper="span"
                speed={30}
                cursor={false}
              />
            </h1>
            <p className="font-light text-white/45 tracking-[0.3em] uppercase text-xs sm:text-sm">
              Pragya Pravah
            </p>
            <p className="font-devanagari text-orange-300/70 tracking-wider text-sm">
              भोपाल विभाग · Bhopal Vibhag
            </p>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className={`text-sm sm:text-base text-white/55 max-w-lg leading-relaxed ${isHi ? "font-devanagari" : ""}`}
          >
            {isHi
              ? "राष्ट्र की बौद्धिक चेतना को जागृत करने के लिए — भारतीय मूल्यों पर आधारित विचार, शोध और सामाजिक परिवर्तन का मंच।"
              : "Awakening the intellectual consciousness of the nation — a platform for thought, research, and social transformation grounded in Bharatiya values."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="flex items-center gap-3 flex-wrap justify-center"
          >
            <Link href="/dashboard">
              <Button size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-semibold px-8 rounded-xl shadow-xl shadow-orange-500/35 hover:shadow-orange-500/55 transition-all border-0 text-sm sm:text-base">
                {isHi ? "प्रवेश करें" : "Enter App"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/parichay">
              <Button size="lg" variant="outline"
                className="border-white/20 text-white/75 hover:bg-white/8 hover:text-white hover:border-white/35 px-8 rounded-xl text-sm sm:text-base">
                {isHi ? "संगठन परिचय" : "Learn More"}
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/25"
        >
          <span className="text-[9px] tracking-[0.25em] uppercase font-devanagari">{isHi ? "नीचे देखें" : "Scroll"}</span>
          <motion.div animate={{ y: [0, 7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="w-4 h-4" />
          </motion.div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════════════════════════ */}
      <section className="bg-card border-y border-border/60 py-8 sm:py-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { num: 5, label: { en: "Aayams", hi: "आयाम" } },
              { num: 8, label: { en: "Vibhags", hi: "विभाग" } },
              { num: 15, label: { en: "Vimarsh Topics", hi: "विमर्श विषय" } },
              { num: 0, symbol: "∞", label: { en: "Gatividhis", hi: "गतिविधियाँ" } },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                className="space-y-0.5"
              >
                <p className="text-3xl sm:text-4xl font-bold text-primary">
                  {s.symbol ? s.symbol : <CountUp end={s.num} duration={2.2} delay={0.3 + i * 0.15} enableScrollSpy scrollSpyOnce />}
                </p>
                <p className={`text-xs text-muted-foreground ${isHi ? "font-devanagari" : ""}`}>{s.label[lang]}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          SEMANTIC GATEWAY — प्रज्ञा परिचय + Pathway CTAs
          Purpose: orient first-time visitors with concise meaning of
          Pragya, what Pragya Pravah is, the Drishti summary, and
          pathway CTAs into the app aayams.
      ══════════════════════════════════════════════════════════════ */}
      <section className="parchment-panel py-12 sm:py-16 px-4 border-b border-border/50">
        <div className="max-w-4xl mx-auto space-y-10">

          {/* Top row: Pragya meaning + Pragya Pravah definition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Pragya क्या है? */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.55 }}
              className="glass-card hover-lift rounded-2xl border border-orange-500/20 bg-orange-500/5 p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-devanagari text-2xl text-orange-400">प्र</span>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-orange-500/70 font-semibold">प्रज्ञा क्या है?</p>
                  <p className="text-[9px] text-muted-foreground">What is Pragya?</p>
                </div>
              </div>
              <p className={`text-sm text-foreground/75 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                {isHi
                  ? "'प्र' (पूर्ण, तीव्र) + 'ज्ञा' (जानना) = गहन, परिष्कृत एवं शुद्ध बौद्धिक चेतना। \"प्रज्ञानं ब्रह्म\" — ऋग्वेद।"
                  : "'Pra' (complete, forward) + 'jña' (to know) = Deep, refined and pure intellectual consciousness. \"Prajñānaṃ Brahma\" — Rigveda."}
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
              <Link href="/parichay">
                <span className="inline-flex items-center gap-1 text-[10px] text-orange-500 font-semibold hover:text-orange-400 transition-colors">
                  {isHi ? "विस्तार से पढ़ें" : "Read more"} <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </motion.div>

            {/* प्रज्ञा प्रवाह क्या है? */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.55 }}
              className="glass-card hover-lift rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-blue-500/70 font-semibold">प्रज्ञा प्रवाह क्या है?</p>
                  <p className="text-[9px] text-muted-foreground">What is Pragya Pravah?</p>
                </div>
              </div>
              <p className={`text-sm text-foreground/75 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                {isHi
                  ? "उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्रचना की दिशा में विचारशील लोगों और थिंकटैंकों का वैश्विक तंत्र।"
                  : "A global network of thinkers and Think Tanks working for age-appropriate reconstruction of national life, grounded in elevated Hindu life values."}
              </p>
              <div className="h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
              <Link href="/parichay">
                <span className="inline-flex items-center gap-1 text-[10px] text-blue-500 font-semibold hover:text-blue-400 transition-colors">
                  {isHi ? "संगठन परिचय" : "Organisation overview"} <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Drishti summary */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.15, duration: 0.5 }}
            className="rounded-2xl border border-border/60 bg-card/60 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <div className="flex items-center gap-2 shrink-0">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-[10px] uppercase tracking-widest font-semibold text-primary">दृष्टि · Vision</span>
            </div>
            <div className="h-px sm:w-px sm:h-8 bg-border/60 hidden sm:block" />
            <p className={`font-devanagari text-sm text-foreground/70 leading-relaxed ${isHi ? "" : "text-xs"}`}>
              {isHi
                ? "प्रज्ञा आधारित हिंदू जीवन मूल्यों से प्रेरित, लोक कल्याणकारी वैश्विक समाज रचना।"
                : "Building a welfare-oriented global society inspired by Pragya-based Hindu life values."}
            </p>
          </motion.div>

          {/* Pathway CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}
            className="space-y-3"
          >
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold">
              {isHi ? "अनुभागों में प्रवेश करें" : "Explore sections"}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { href: "/parichay", icon: BookOpen, hi: "परिचय", en: "Parichay", color: "border-orange-500/30 hover:border-orange-500/60 text-orange-500" },
                { href: "/dayitv", icon: Shield, hi: "दायित्व", en: "Dayitv", color: "border-amber-500/30 hover:border-amber-500/60 text-amber-500" },
                { href: "/vimarsh", icon: MessagesSquare, hi: "विमर्श", en: "Vimarsh", color: "border-violet-500/30 hover:border-violet-500/60 text-violet-500" },
                { href: "/dashboard", icon: Compass, hi: "डैशबोर्ड", en: "Dashboard", color: "border-blue-500/30 hover:border-blue-500/60 text-blue-500" },
              ].map(({ href, icon: Icon, hi, en, color }) => (
                <Link key={href} href={href}>
                  <div className={`glass-card hover-lift rounded-xl border ${color} p-4 text-center space-y-1.5 cursor-pointer transition-all group`}>
                    <Icon className="w-4 h-4 mx-auto opacity-70 group-hover:opacity-100 transition-opacity" />
                    <p className="font-devanagari text-sm font-medium">{hi}</p>
                    <p className="text-[9px] text-muted-foreground">{en}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          VISION — प्रज्ञा प्रवाह की दृष्टि
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-20 sm:py-28 px-4 bg-[hsl(220_32%_8%)] text-white overflow-hidden">
        {/* Mandala watermarks */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 pointer-events-none">
          <Mandala className="w-[480px] h-[480px] text-orange-400 opacity-[0.04] animate-spin-slow" />
        </div>
        <div className="absolute -left-28 bottom-0 pointer-events-none">
          <Mandala className="w-72 h-72 text-orange-400 opacity-[0.03]" />
        </div>
        {/* Gradient wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,_hsl(27_100%_50%_/_0.06)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/25 to-transparent" />

        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-8">

          {/* Label chip */}
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs tracking-[0.2em] uppercase font-medium">
              <Eye className="w-3.5 h-3.5" />
              {isHi ? "दृष्टि · विज़न" : "दृष्टि · Vision"}
            </span>
          </motion.div>

          {/* Animated word-by-word vision statement (Hindi) */}
          {isHi ? (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="flex flex-wrap justify-center gap-x-3 gap-y-2"
            >
              {VISION_WORDS_HI.map((w, i) => (
                <motion.span
                  key={i}
                  variants={wordVariant}
                  className={`font-devanagari font-bold leading-tight select-none ${w.accent ? "text-orange-400" : "text-white"
                    }`}
                  style={{ fontSize: "clamp(1.6rem, 4.5vw, 2.6rem)" }}
                >
                  {w.text}
                </motion.span>
              ))}
            </motion.div>
          ) : (
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-2xl sm:text-3xl md:text-4xl font-bold leading-snug"
            >
              Building a welfare-oriented{" "}
              <span className="text-orange-400">global society</span>{" "}
              inspired by Pragya-based Hindu life values.
            </motion.h2>
          )}

          {/* Ornamental divider */}
          <motion.div
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="flex items-center gap-4 max-w-xs mx-auto"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-orange-500/20" />
            <span className="text-orange-500/50 text-sm">✦</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-orange-500/40 to-orange-500/20" />
          </motion.div>

          {/* Mahavakya badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            transition={{ delay: 1.1, duration: 0.6 }}
            className="inline-block"
          >
            <div className="px-6 py-3 rounded-2xl border border-white/10 bg-white/5 space-y-1">
              <p className="font-devanagari text-2xl text-orange-300/90 tracking-wide">प्रज्ञानं ब्रह्म</p>
              <p className="text-[11px] text-white/35 italic tracking-wider">
                Prajñānaṃ Brahma — Consciousness is Brahma · ऋग्वेद
              </p>
            </div>
          </motion.div>

          {/* Hindi subtext in EN mode */}
          {!isHi && (
            <motion.p
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              transition={{ delay: 1.2 }}
              className="text-sm text-white/30 font-devanagari"
            >
              प्रज्ञा आधारित हिंदू जीवन मूल्यों से प्रेरित लोक कल्याणकारी वैश्विक समाज रचना।
            </motion.p>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5 AAYAMS SECTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 bg-background">
        <div className="max-w-4xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-medium">
              {isHi ? "पञ्च तत्त्व — पाँच आयाम" : "Pancha Tattva — Five Dimensions"}
            </p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "संगठन की पाँच शक्तियाँ" : "Five Pillars of the Organisation"}
            </h2>
            <p className="text-sm text-muted-foreground font-devanagari">
              {isHi ? "जैसे पाँच तत्त्व सृष्टि को धारण करते हैं, वैसे ही ये पाँच आयाम समाज को।"
                : "As the five elements sustain creation, so these five aayams sustain society."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {AAYAMS.map((a, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.07 }}
              >
                <div className={`glass-card hover-lift rounded-xl border p-5 space-y-3 ${a.border} ${a.bg} h-full`}>
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
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          MISSION — लक्ष्य (4 points from document)
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 bg-card">
        <div className="max-w-3xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-medium">
              {isHi ? "लक्ष्य — चतुर्विध" : "Mission — Four Objectives"}
            </p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "प्रज्ञा प्रवाह के चार लक्ष्य" : "Four Mission Objectives"}
            </h2>
            <p className={`text-sm text-muted-foreground max-w-lg mx-auto ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "अखिल भारतीय चिंतन शिविर (नवंबर २०२४) में निर्धारित प्रज्ञा प्रवाह के चार प्रमुख लक्ष्य।"
                : "Four core objectives defined at the All-India Chintan Shivir (November 2024)."}
            </p>
          </motion.div>

          <div className="space-y-4">
            {MISSION_POINTS.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -28 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5, ease: "easeOut" }}
                className={`relative rounded-xl border-l-4 ${m.borderClass} bg-background p-5 shadow-sm hover:shadow-md transition-shadow group`}
              >
                <div className="flex items-start gap-4">
                  {/* Big number */}
                  <span className={`font-mono text-4xl sm:text-5xl font-bold ${m.color} opacity-15 group-hover:opacity-35 transition-opacity leading-none shrink-0 select-none`}>
                    {m.num}
                  </span>
                  <div className="flex-1 space-y-2 min-w-0">
                    {/* Tag badge */}
                    <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full ${m.bg} ${m.color} font-semibold tracking-wide`}>
                      {isHi ? m.tag.hi : m.tag.en}
                    </span>
                    {/* Main text */}
                    <p className={`text-sm leading-relaxed text-foreground/80 ${isHi ? "font-devanagari" : ""}`}>
                      {isHi ? m.hi : m.en}
                    </p>
                    {isHi && (
                      <p className="text-xs text-muted-foreground italic">{m.en}</p>
                    )}
                  </div>
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <m.icon className={`w-4 h-4 ${m.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3 PILLARS / GOALS — उद्देश्य के तीन स्तंभ
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,_hsl(27_100%_50%_/_0.04)_0%,_transparent_70%)] pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-medium">
              {isHi ? "उद्देश्य — तीन स्तंभ" : "Goals — Three Pillars"}
            </p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "कार्य के तीन स्तंभ" : "Three Pillars of Work"}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {GOALS.map((g, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.13, duration: 0.55, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.22 } }}
                className={`relative rounded-2xl border ${g.border} ${g.bg} p-6 space-y-4 cursor-default group overflow-hidden`}
                style={{ boxShadow: "none" }}
              >
                {/* Glow overlay on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none rounded-2xl"
                  style={{ boxShadow: `inset 0 0 40px ${g.glowColor}` }}
                />
                {/* Bottom accent line */}
                <div className={`absolute bottom-0 left-4 right-4 h-px ${g.color} opacity-0 group-hover:opacity-20 transition-opacity`} style={{ backgroundColor: "currentColor" }} />

                {/* Icon */}
                <motion.div
                  className={`w-12 h-12 rounded-xl ${g.bg} border ${g.border} flex items-center justify-center`}
                  whileHover={{ rotate: 8, scale: 1.1 }}
                  transition={{ duration: 0.25 }}
                >
                  <g.icon className={`w-6 h-6 ${g.color}`} />
                </motion.div>

                {/* Title */}
                <div>
                  <h3 className={`font-bold text-base ${g.color} font-devanagari`}>
                    {isHi ? g.hi : g.en}
                  </h3>
                  {isHi && <p className="text-[10px] text-muted-foreground">{g.en}</p>}
                </div>

                {/* Description */}
                <p className={`text-xs text-foreground/65 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                  {isHi ? g.desc.hi : g.desc.en}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          DHARMA QUOTE SECTION — dark bg, mandala watermarks
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 bg-[hsl(220_32%_9%)] text-white overflow-hidden">
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.06]">
          <Mandala className="w-72 h-72 text-orange-400" />
        </div>
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04]">
          <Mandala className="w-56 h-56 text-orange-400" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />

        <div className="max-w-2xl mx-auto text-center relative z-10 space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="space-y-2"
          >
            <p className="font-devanagari text-3xl sm:text-4xl text-orange-400/90 leading-relaxed tracking-wide">
              {SHLOKAS[1].devanagari}
            </p>
            <p className="text-xs text-white/35 italic tracking-wider">
              {SHLOKAS[1].transliteration}
            </p>
            <p className="text-sm text-orange-300/60">{SHLOKAS[1].translation}</p>
            <p className="text-[10px] text-white/25 tracking-widest uppercase">{SHLOKAS[1].source}</p>
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-3 max-w-xs mx-auto"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-orange-500/30" />
            <Mandala className="w-8 h-8 text-orange-500/40" />
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-orange-500/30" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className={`text-sm text-white/50 max-w-lg mx-auto leading-relaxed ${isHi ? "font-devanagari" : ""}`}
          >
            {isHi
              ? "हमारा कार्य भारत की सनातन धरोहर को आधुनिक संदर्भ में प्रासंगिक बनाना और उसकी सभ्यतागत मूल्यों की रक्षा करना है।"
              : "Our mission is to make India's eternal heritage relevant in the modern context and to protect its civilisational values for future generations."}
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PANCH PARIVARTAN — पंच परिवर्तन
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 bg-card">
        <div className="max-w-4xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center space-y-2"
          >
            <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-medium">
              {isHi ? "पंच परिवर्तन" : "Pancha Parivartan"}
            </p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "पाँच सामाजिक परिवर्तन" : "Five Social Transformations"}
            </h2>
            <p className={`text-sm text-muted-foreground max-w-md mx-auto ${isHi ? "font-devanagari" : ""}`}>
              {isHi
                ? "समाज में व्यापक परिवर्तन के लिए प्रज्ञा प्रवाह के पाँच प्रमुख कार्यक्षेत्र।"
                : "Five key domains of social transformation that Pragya Pravah works towards."}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PANCH.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.09, duration: 0.5, ease: "easeOut" }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`relative rounded-2xl border ${p.border} ${p.bg} p-5 space-y-3 group overflow-hidden cursor-default`}
              >
                {/* Rotating mandala watermark */}
                <div className="absolute -right-5 -top-5 pointer-events-none opacity-[0.07] group-hover:opacity-[0.14] transition-opacity duration-500">
                  <Mandala className={`w-24 h-24 ${p.color} animate-spin-slow`} />
                </div>

                {/* Number + icon */}
                <div className="flex items-center gap-3">
                  <span className={`font-devanagari text-4xl font-bold ${p.color} opacity-25 group-hover:opacity-60 transition-opacity select-none`}>
                    {p.num}
                  </span>
                  <div className={`w-9 h-9 rounded-lg ${p.bg} border ${p.border} flex items-center justify-center`}>
                    <p.icon className={`w-4 h-4 ${p.color}`} />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className={`font-bold font-devanagari text-sm ${p.color}`}>{p.hi}</h3>
                  <p className="text-[10px] text-muted-foreground">{p.en}</p>
                </div>

                {/* Description */}
                <p className={`text-xs text-foreground/65 leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                  {isHi ? p.desc.hi : p.desc.en}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 px-4 bg-background">
        <div className="max-w-xl mx-auto text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="space-y-3"
          >
            <p className="text-[10px] tracking-[0.3em] text-primary uppercase font-medium">
              {isHi ? "अभी शुरू करें" : "Get Started"}
            </p>
            <h2 className={`text-2xl sm:text-3xl font-bold ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "प्रज्ञा प्रवाह में प्रवेश करें" : "Enter Pragya Pravah"}
            </h2>
            <p className={`text-sm text-foreground/65 ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "डैशबोर्ड खोलें और अपनी इकाई की गतिविधियाँ प्रबंधित करें।"
                : "Open the dashboard and manage your unit's activities."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <Link href="/dashboard">
              <Button size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-semibold px-10 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-0">
                {isHi ? "डैशबोर्ड खोलें" : "Open Dashboard"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <div>
              <Link href="/login" className="text-sm text-primary hover:underline">
                {isHi ? "लॉगिन करें →" : "Sign In →"}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex justify-center pt-2 opacity-15"
          >
            <Mandala className="w-20 h-20 text-primary" />
          </motion.div>
        </div>
      </section>
    </div>
  );
}
