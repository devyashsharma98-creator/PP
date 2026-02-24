"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, BookOpen, Users, Flame, MessagesSquare } from "lucide-react";
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
      {/* Outermost dotted ring */}
      <circle cx="120" cy="120" r="116" stroke="currentColor" strokeWidth="0.4" strokeDasharray="3 6" opacity="0.25" />

      {/* Outer 12-dot ring */}
      {dots12.map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        return <circle key={i} cx={+(120 + 108 * Math.cos(rad)).toFixed(4)} cy={+(120 + 108 * Math.sin(rad)).toFixed(4)} r="1.5" fill="currentColor" fillOpacity="0.3" />;
      })}

      {/* Outer lotus petals ×8 */}
      {petals8.map((angle, i) => (
        <ellipse key={i} cx="120" cy="62" rx="13" ry="52"
          fill="currentColor" fillOpacity="0.07"
          stroke="currentColor" strokeOpacity="0.3" strokeWidth="0.6"
          transform={`rotate(${angle} 120 120)`} />
      ))}

      {/* Outer ring */}
      <circle cx="120" cy="120" r="68" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />

      {/* Mid lotus petals ×8 offset */}
      {petals8offset.map((angle, i) => (
        <ellipse key={i} cx="120" cy="85" rx="8" ry="33"
          fill="currentColor" fillOpacity="0.1"
          stroke="currentColor" strokeOpacity="0.4" strokeWidth="0.5"
          transform={`rotate(${angle} 120 120)`} />
      ))}

      {/* Mid ring */}
      <circle cx="120" cy="120" r="46" stroke="currentColor" strokeWidth="0.5" opacity="0.35" />

      {/* Inner sun rays ×16 */}
      {rays16.map((angle, i) => {
        const rad = (angle - 90) * (Math.PI / 180);
        const x1 = +(120 + 30 * Math.cos(rad)).toFixed(4), y1 = +(120 + 30 * Math.sin(rad)).toFixed(4);
        const x2 = +(120 + 43 * Math.cos(rad)).toFixed(4), y2 = +(120 + 43 * Math.sin(rad)).toFixed(4);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.2" />;
      })}

      {/* Inner ring */}
      <circle cx="120" cy="120" r="28" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.7" />

      {/* Inner 8 triangles */}
      {petals8.map((angle, i) => (
        <ellipse key={i} cx="120" cy="104" rx="4" ry="14"
          fill="currentColor" fillOpacity="0.15"
          stroke="currentColor" strokeOpacity="0.5" strokeWidth="0.5"
          transform={`rotate(${angle} 120 120)`} />
      ))}

      {/* Center circle */}
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

export default function LandingPage() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      {/* ══════════════════════════════════════════════════════════════
          HERO — dark navy, mandala, Om, shloka, org name
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden bg-[hsl(220_32%_7%)] text-white">

        {/* Animated gradient wash */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,_hsl(27_100%_50%_/_0.10)_0%,_transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_70%,_hsl(220_80%_40%_/_0.08)_0%,_transparent_60%)] pointer-events-none" />

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        {/* Large background mandala */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <OuterRing className="w-[min(90vw,680px)] h-[min(90vw,680px)] text-orange-400 animate-spin-slow-reverse opacity-[0.06]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Mandala className="w-[min(80vw,600px)] h-[min(80vw,600px)] text-orange-300 opacity-[0.05]" />
        </div>

        {/* ── Main content ── */}
        <div className="relative z-10 flex flex-col items-center text-center px-5 space-y-7 max-w-2xl py-20">

          {/* Mandala with Om center */}
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

          {/* Sanskrit shloka */}
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

          {/* Ornamental divider */}
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

          {/* Org name */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.9 }}
            className="space-y-2"
          >
            <h1 className="font-devanagari font-bold text-white leading-tight"
              style={{ fontSize: "clamp(2.4rem, 9vw, 4.5rem)", textShadow: "0 2px 20px hsl(27 100% 50% / 0.2)" }}>
              प्रज्ञा प्रवाह
            </h1>
            <p className="font-light text-white/45 tracking-[0.3em] uppercase text-xs sm:text-sm">
              Pragya Pravah
            </p>
            <p className="font-devanagari text-orange-300/70 tracking-wider text-sm">
              भोपाल विभाग · Bhopal Vibhag
            </p>
          </motion.div>

          {/* Description */}
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

          {/* CTA buttons */}
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

        {/* Scroll indicator */}
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
              { num: "5",  label: { en: "Aayams",          hi: "आयाम" } },
              { num: "8",  label: { en: "Vibhags",         hi: "विभाग" } },
              { num: "15", label: { en: "Vimarsh Topics",  hi: "विमर्श विषय" } },
              { num: "∞",  label: { en: "Gatividhis",      hi: "गतिविधियाँ" } },
            ].map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                className="space-y-0.5"
              >
                <p className="text-3xl sm:text-4xl font-bold text-primary">{s.num}</p>
                <p className={`text-xs text-muted-foreground ${isHi ? "font-devanagari" : ""}`}>{s.label[lang]}</p>
              </motion.div>
            ))}
          </div>
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
                    <p className="text-[10px] text-muted-foreground/60">{a.en}</p>
                  </div>
                  <p className={`text-xs text-muted-foreground leading-relaxed ${isHi ? "font-devanagari" : ""}`}>
                    {a.desc[lang]}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          DHARMA QUOTE SECTION — dark bg, mandala watermarks
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative py-16 sm:py-20 px-4 bg-[hsl(220_32%_9%)] text-white overflow-hidden">
        {/* Mandala watermarks */}
        <div className="absolute -right-16 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.06]">
          <Mandala className="w-72 h-72 text-orange-400" />
        </div>
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 pointer-events-none opacity-[0.04]">
          <Mandala className="w-56 h-56 text-orange-400" />
        </div>
        {/* Top + bottom border lines */}
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
            <p className={`text-sm text-muted-foreground ${isHi ? "font-devanagari" : ""}`}>
              {isHi ? "डैशबोर्ड खोलें और अपनी इकाई की गतिविधियाँ प्रबंधित करें।"
                : "Open the dashboard and manage your unit's activities."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/dashboard">
              <Button size="lg"
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white font-semibold px-10 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all border-0">
                {isHi ? "डैशबोर्ड खोलें" : "Open Dashboard"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
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
