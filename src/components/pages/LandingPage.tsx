"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Flame,
  Megaphone,
  MessagesSquare,
  Network,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import StoryTimeline from "@/components/pages/StoryTimeline";

function Mandala({ className }: { className?: string }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="120" cy="120" r="112" stroke="currentColor" strokeWidth="0.8" opacity="0.18" />
      <circle cx="120" cy="120" r="78" stroke="currentColor" strokeWidth="0.8" opacity="0.22" />
      <circle cx="120" cy="120" r="42" stroke="currentColor" strokeWidth="0.8" opacity="0.28" />
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="120"
          cy="62"
          rx="14"
          ry="44"
          fill="currentColor"
          fillOpacity="0.07"
          stroke="currentColor"
          strokeOpacity="0.28"
          strokeWidth="0.8"
          transform={`rotate(${angle} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="16" fill="currentColor" fillOpacity="0.18" />
    </svg>
  );
}

type SectionHeadingProps = {
  eyebrowEn: string;
  eyebrowHi: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  align?: "left" | "center";
};

function SectionHeading({
  eyebrowEn,
  eyebrowHi,
  titleEn,
  titleHi,
  bodyEn,
  bodyHi,
  align = "left",
}: SectionHeadingProps) {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.15, delayChildren: 0.1 }
        }
      }}
      className={cn("max-w-4xl space-y-4", align === "center" && "mx-auto text-center")}
    >
      <motion.p variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 }}} className="home-editorial-eyebrow">
        <span>{eyebrowEn}</span>
        <span className="font-devanagari tracking-[0.12em]">{eyebrowHi}</span>
      </motion.p>
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 }}} className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.1]">
          {titleEn}
        </h2>
        <p className="font-devanagari text-xl font-medium text-foreground/90">
          {titleHi}
        </p>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 }}} className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {bodyEn}
        </p>
        <p className="font-devanagari text-sm leading-relaxed text-foreground/80 sm:text-base">
          {bodyHi}
        </p>
      </motion.div>
    </motion.div>
  );
}

const institutionCards = [
  {
    titleEn: "Intellectual forum",
    titleHi: "बौद्धिक मंच",
    bodyEn: "Pragya Pravah convenes discourse, reflection, and knowledge work rooted in Bharatiya civilisational memory.",
    bodyHi: "प्रज्ञा प्रवाह भारत की सभ्यतागत स्मृति पर आधारित चिंतन, संवाद और ज्ञान-कार्य का मंच है।",
    icon: Compass,
  },
  {
    titleEn: "Organised action",
    titleHi: "संगठित कार्य",
    bodyEn: "Its work moves from thought to review, publication, outreach, and institutional coordination.",
    bodyHi: "यह कार्य केवल विचार तक सीमित नहीं रहता, बल्कि समीक्षा, प्रकाशन, प्रचार और संगठनात्मक समन्वय तक पहुँचता है।",
    icon: Network,
  },
  {
    titleEn: "Bharatiya knowledge orientation",
    titleHi: "भारतीय ज्ञान-दृष्टि",
    bodyEn: "The organisation frames public questions through Bharatiya categories, cultural continuity, and social responsibility.",
    bodyHi: "यह संगठन समकालीन प्रश्नों को भारतीय दृष्टि, सांस्कृतिक निरंतरता और सामाजिक दायित्व के साथ देखता है।",
    icon: Shield,
  },
] as const;

const workstreams = [
  {
    titleEn: "Vimarsh",
    titleHi: "विमर्श",
    bodyEn: "Structured discourse and narrative engagement on current public questions.",
    bodyHi: "समकालीन सार्वजनिक प्रश्नों पर सुविचारित संवाद और कथ्य-निर्माण।",
    ctaEn: "Read Current Vimarsh",
    ctaHi: "वर्तमान विमर्श पढ़ें",
    href: "/vimarsh",
    icon: MessagesSquare,
  },
  {
    titleEn: "Shodh",
    titleHi: "शोध",
    bodyEn: "Research, reference work, and knowledge-building grounded in Bharatiya inquiry.",
    bodyHi: "भारतीय ज्ञान-दृष्टि पर आधारित शोध, अध्ययन और संदर्भ-सामग्री का निर्माण।",
    ctaEn: "Explore Shodh Work",
    ctaHi: "शोध कार्य देखें",
    href: "/library",
    icon: BookOpen,
  },
  {
    titleEn: "Prachar",
    titleHi: "प्रचार",
    bodyEn: "Translating ideas into public reach across campaigns, media, and social platforms.",
    bodyHi: "विचारों को अभियान, मीडिया और डिजिटल माध्यमों के द्वारा समाज तक पहुँचाना।",
    ctaEn: "See Prachar Activity",
    ctaHi: "प्रचार कार्य देखें",
    href: "/prachar",
    icon: Megaphone,
  },
  {
    titleEn: "Yuva",
    titleHi: "युवा",
    bodyEn: "Leadership formation and cultural confidence for the next generation of organisers and thinkers.",
    bodyHi: "आगामी पीढ़ी के कार्यकर्ताओं और विचारकों के लिए नेतृत्व और सांस्कृतिक आत्मविश्वास का निर्माण।",
    ctaEn: "See Organisational Work",
    ctaHi: "कार्यप्रवाह देखें",
    href: "/dashboard",
    icon: Flame,
  },
] as const;

const audiencePaths = [
  {
    titleEn: "Visitor",
    titleHi: "प्रथम आगंतुक",
    bodyEn: "Start with the organisation's civilisational vision and institutional purpose.",
    bodyHi: "संस्था की दृष्टि, उद्देश्य और वैचारिक आधार से परिचय आरम्भ करें।",
    ctaEn: "Understand the Vision",
    ctaHi: "दृष्टि समझें",
    href: "/parichay",
    icon: Compass,
  },
  {
    titleEn: "Thinker",
    titleHi: "चिंतक / वक्ता",
    bodyEn: "See how discourse, research, and public thought are being framed now.",
    bodyHi: "देखें कि समकालीन विमर्श, शोध और सार्वजनिक चिंतन को किस प्रकार रूप दिया जा रहा है।",
    ctaEn: "Read Current Vimarsh",
    ctaHi: "वर्तमान विमर्श पढ़ें",
    href: "/vimarsh",
    icon: BookOpen,
  },
  {
    titleEn: "Organiser",
    titleHi: "आयोजक / कार्यकर्ता",
    bodyEn: "Understand how mission becomes workflow through review, publishing, and coordination.",
    bodyHi: "समझें कि विचार किस प्रकार समीक्षा, प्रकाशन और समन्वय के माध्यम से कार्य में बदलता है।",
    ctaEn: "See Organisational Work",
    ctaHi: "कार्यप्रवाह देखें",
    href: "/dashboard",
    icon: Users,
  },
] as const;

const operationsSteps = [
  {
    step: "01",
    titleEn: "Review",
    titleHi: "समीक्षा",
    bodyEn: "Ideas are checked, refined, and aligned before public release.",
    bodyHi: "विचारों को सार्वजनिक प्रस्तुति से पहले परखा, सुधारा और सुसंगत किया जाता है।",
  },
  {
    step: "02",
    titleEn: "Publish",
    titleHi: "प्रकाशन",
    bodyEn: "Approved thought moves into aalekh, notes, and public-facing material.",
    bodyHi: "स्वीकृत सामग्री आलेख, टिप्पणियों और सार्वजनिक प्रस्तुति के रूप में आगे बढ़ती है।",
  },
  {
    step: "03",
    titleEn: "Prachar",
    titleHi: "प्रचार",
    bodyEn: "Institutional messaging is carried into campaigns, media, and social reach.",
    bodyHi: "संस्थागत कथ्य अभियान, मीडिया और सामाजिक पहुँच के माध्यम से आगे जाता है।",
  },
  {
    step: "04",
    titleEn: "Coordinate",
    titleHi: "समन्वय",
    bodyEn: "Units, departments, and organisers follow through in disciplined workflow.",
    bodyHi: "इकाइयाँ, आयाम और कार्यकर्ता अनुशासित कार्यप्रवाह में समन्वित रूप से आगे बढ़ते हैं।",
  },
] as const;

export default function LandingPage() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";

  const { scrollYProgress } = useScroll();
  const yHeroBg = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacityHeroBg = useTransform(scrollYProgress, [0, 0.5], [1, 0.3]);

  return (
    <div className="bg-background text-foreground relative overflow-hidden">
      {/* Dynamic atmospheric background blur */}
      <div className="pointer-events-none absolute -left-[10%] top-0 h-[800px] w-[800px] rounded-full bg-saffron-glow/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-[10%] top-[20%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[100px]" />

      <section className="home-hero-bg overflow-hidden border-b border-border/40 relative">
        <motion.div 
          style={{ y: yHeroBg, opacity: opacityHeroBg }}
          className="absolute inset-0 pointer-events-none cultural-bg bg-noise"
        />
        <div className="home-section-shell py-16 sm:py-24 relative z-10">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >
              <p className="home-editorial-eyebrow">
                <span>Pragya Pravah</span>
                <span className="font-devanagari tracking-[0.12em]">प्रज्ञा प्रवाह</span>
              </p>
              <div className="space-y-5">
                <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl lg:leading-[1.05]">
                  Civilisational thought.<br />
                  <span className="text-primary">Organised action.</span>
                </h1>
                <p className="max-w-2xl font-devanagari text-xl font-medium text-foreground/90 sm:text-2xl">
                  भारत-केंद्रित चिंतन, संवाद और संगठित कार्य का समकालीन संस्थागत मंच।
                </p>
                <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                  A Bharatiya intellectual forum that converts philosophical reflection into disciplined 
                  review, research, publication, and coordinated public outreach.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="h-14 rounded-full px-8 text-base shadow-lg shadow-primary/20">
                  <Link href="/parichay">
                    {isHi ? "दृष्टि समझें" : "Understand the Vision"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 rounded-full px-8 text-base bg-background/50 backdrop-blur-sm">
                  <Link href="/login">
                    {isHi ? "डेमो प्रणाली खोलें" : "Enter Demo Console"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="home-hero-panel relative institution-panel-textured border border-primary/20 animate-float"
            >
              <div className="absolute -right-16 -top-16 text-primary/15">
                <Mandala className="h-64 w-64 animate-spin-slow-reverse" />
              </div>
              <div className="relative space-y-6">
                <p className="section-seal">Civilisational depth</p>
                <div className="space-y-4">
                  <h2 className="text-3xl font-semibold tracking-tight">The imperative for clarity</h2>
                  <p className="font-devanagari text-lg text-foreground/80 leading-relaxed">
                    भारतीय विचार को समकालीन समाज और संगठित कार्य से जोड़ना ही वर्तमान आवश्यकता है। 
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                    The task is not nostalgia. It is to articulate Bharatiya categories in contemporary 
                    intellectual life with institutional rigour and public relevance.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-5 transition-colors hover:border-primary/30">
                    <p className="shell-copy">Identity</p>
                    <p className="mt-2 text-base font-semibold">Civilisational confidence</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Ideas anchored in Bharat's own categories and continuity.</p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/60 p-5 transition-colors hover:border-primary/30">
                    <p className="shell-copy">Method</p>
                    <p className="mt-2 text-base font-semibold">Discourse into action</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">Review, publication, and disciplined institutional follow-through.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="home-section-shell">
        <SectionHeading
          eyebrowEn="Institutional Framing"
          eyebrowHi="संस्थागत परिचय"
          titleEn="A forum with organised depth"
          titleHi="वैचारिक मंच, जो संगठनात्मक गहराई के साथ कार्य करता है"
          bodyEn="Pragya Pravah sits between civilisational reflection and coordinated action. We develop discourse, nurture research, and translate thought into institutional form."
          bodyHi="प्रज्ञा प्रवाह केवल सांस्कृतिक भावभूमि नहीं है। यह ऐसा बौद्धिक मंच है जो विमर्श गढ़ता है, शोध को पोषित करता है और विचार को संगठित सार्वजनिक कार्य तक ले जाता है।"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-12 lg:items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="home-band-card lg:col-span-5 flex flex-col justify-center parchment-panel-textured rounded-3xl p-8 lg:p-10 border border-border/60 hover-lift relative overflow-hidden"
          >
            <div className="absolute -left-12 -bottom-12 text-primary/5 pointer-events-none">
              <Mandala className="h-64 w-64 animate-spin-slow" />
            </div>
            <div className="relative z-10 space-y-6">
              <p className="section-seal">Institutional form</p>
              <div className="space-y-4">
                <h3 className="text-3xl font-bold tracking-tight leading-tight">
                  Thought must take form to shape society.
                </h3>
                <p className="font-devanagari text-lg leading-relaxed text-foreground/80">
                  यदि विचार समाज को दिशा देना चाहते हैं, तो उन्हें संस्था, अनुशासन और कार्यप्रवाह का रूप लेना होगा।
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="home-band-pill">Discourse</span>
                <span className="home-band-pill">Research</span>
                <span className="home-band-pill">Publication</span>
                <span className="home-band-pill">Coordination</span>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-7 grid gap-4 sm:grid-cols-2">
            {institutionCards.map((card, index) => (
              <motion.div
                key={card.titleEn}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group rounded-3xl border border-border/60 p-6 transition-all glass-card-enhanced hover:border-primary/40 hover:shadow-[0_12px_40px_-16px_hsl(var(--primary)/0.2)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
                  <card.icon className="h-6 w-6" />
                </div>
                <div className="mt-5 space-y-1">
                  <h3 className="text-lg font-bold">{card.titleEn}</h3>
                  <p className="font-devanagari text-sm font-medium text-foreground/80">{card.titleHi}</p>
                </div>
                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-relaxed text-muted-foreground">{card.bodyEn}</p>
                  <p className="font-devanagari text-sm leading-relaxed text-foreground/70">{card.bodyHi}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <StoryTimeline />

      <section className="pravah-lattice-bg border-y border-border/40 bg-muted/20">
        <div className="home-section-shell">
          <SectionHeading
            eyebrowEn="Fields of Work"
            eyebrowHi="कार्य के आयाम"
            titleEn="Disciplined workstreams"
            titleHi="संस्था का कार्य विमर्श, शोध और प्रसार के आयामों में चलता है"
            bodyEn="Each aayam represents an active field of coordination, moving vision into different forms of organised public presence."
            bodyHi="प्रत्येक आयाम केवल नाम नहीं है, बल्कि विचार, समन्वय और संस्थागत कार्य का सक्रिय क्षेत्र है।"
          />

          <div className="mt-16 space-y-8">
            {workstreams.map((stream, index) => (
              <motion.div
                key={stream.titleEn}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.01, transition: { duration: 0.3 } }}
                className="group relative overflow-hidden rounded-[2.5rem] border border-border/60 p-8 shadow-sm transition-all hover:border-primary/40 hover:shadow-xl lg:p-12 glass-card-enhanced"
              >
                <div className="grid gap-8 lg:grid-cols-[1fr_2fr_1fr] lg:items-center">
                  <div className="flex items-center gap-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <stream.icon className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold tracking-tight">{stream.titleEn}</h3>
                      <p className="font-devanagari text-lg text-foreground/80">{stream.titleHi}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:border-l lg:border-border/40 lg:pl-8">
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                      {stream.bodyEn}
                    </p>
                    <p className="font-devanagari text-sm leading-relaxed text-foreground/70 sm:text-base">
                      {stream.bodyHi}
                    </p>
                  </div>
                  <div className="flex justify-start lg:justify-end">
                    <Button asChild variant="outline" className="h-12 rounded-full px-6 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                      <Link href={stream.href}>
                        {isHi ? stream.ctaHi : stream.ctaEn}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section-shell">
        <SectionHeading
          eyebrowEn="Choose Your Path"
          eyebrowHi="अपना मार्ग चुनें"
          titleEn="Three ways to enter the institution"
          titleHi="प्रज्ञा प्रवाह से जुड़ने के तीन स्वाभाविक प्रवेश-द्वार"
          bodyEn="First-time visitors, thinkers, and organisers should be able to recognise where they belong without reading the entire site."
          bodyHi="प्रथम आगंतुक, चिंतक और आयोजक बिना पूरा पोर्टल पढ़े यह समझ सकें कि उनके लिए प्रवेश का सही मार्ग कौन-सा है।"
        />

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {audiencePaths.map((path, index) => (
            <motion.div
              key={path.titleEn}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, scale: 1.01, transition: { duration: 0.2 } }}
              className="group flex h-full flex-col rounded-[2rem] border border-border/60 p-8 shadow-sm transition-all hover:border-primary/40 glass-card-enhanced hover:shadow-[0_12px_40px_-16px_hsl(var(--primary)/0.2)]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <path.icon className="h-7 w-7" />
              </div>
              <div className="mt-6 space-y-2">
                <h3 className="text-2xl font-bold tracking-tight">{path.titleEn}</h3>
                <p className="font-devanagari text-base font-medium text-foreground/80">{path.titleHi}</p>
              </div>
              <div className="mt-5 flex-1 space-y-4">
                <p className="text-sm leading-relaxed text-muted-foreground">{path.bodyEn}</p>
                <p className="font-devanagari text-sm leading-relaxed text-foreground/70">{path.bodyHi}</p>
              </div>
              <div className="mt-8">
                <Button asChild className="h-12 rounded-full px-6 shadow-sm shadow-primary/10">
                  <Link href={path.href}>
                    {isHi ? path.ctaHi : path.ctaEn}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="home-section-shell overflow-hidden">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div className="space-y-12">
            <SectionHeading
              eyebrowEn="Operational Vision"
              eyebrowHi="कार्य से प्रणाली तक"
              titleEn="The flow of mission"
              titleHi="प्रज्ञा प्रवाह का संगठित कार्य-रूप"
              bodyEn="Our institutional workflows convert philosophical vision into daily operations across review, publication, and coordination."
              bodyHi="डेमो प्रणाली और ईआरपी यह दिखाते हैं कि विमर्श, समीक्षा, प्रकाशन और प्रचार किस प्रकार वास्तविक संस्थागत कार्यप्रवाह में चलते हैं।"
            />

            <div className="relative space-y-4">
              <div className="absolute left-[2.25rem] top-8 bottom-8 w-[2px] bg-gradient-to-b from-primary/40 via-primary/20 to-transparent hidden sm:block" />
              {operationsSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: index * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ x: 6, transition: { duration: 0.2 } }}
                  className="relative flex flex-col sm:flex-row gap-4 sm:gap-8 pl-1 pb-8 last:pb-0 group hover:cursor-default"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary z-10 font-bold border border-primary/20 transition-all group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.5)]">
                    {step.step}
                  </div>
                  <div className="space-y-4 pt-1">
                    <div className="space-y-1">
                      <h4 className="text-xl font-bold">{step.titleEn}</h4>
                      <p className="font-devanagari text-base font-medium text-foreground/80">{step.titleHi}</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.bodyEn}</p>
                      <p className="font-devanagari text-sm leading-relaxed text-foreground/70">{step.bodyHi}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="home-hero-panel relative border border-primary/30 institution-panel-textured shadow-2xl hover-lift"
          >
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
              <Mandala className="h-[120%] w-[120%] text-primary/10 animate-spin-slow-reverse" />
            </div>
            <div className="relative space-y-8">
              <div className="rounded-3xl bg-background/60 p-8 backdrop-blur-sm border border-border/50">
                <h3 className="text-2xl font-bold tracking-tight">Experience the Console</h3>
                <p className="mt-2 font-devanagari text-base text-foreground/80">
                  देखें कि विचार किस प्रकार एक अनुशासित प्रणाली के माध्यम से समाज तक पहुँचते हैं।
                </p>
                <div className="mt-8 flex flex-col gap-3">
                  <Button asChild size="lg" className="h-14 rounded-2xl px-8 shadow-xl shadow-primary/20">
                    <Link href="/login">
                      {isHi ? "डेमो प्रणाली खोलें" : "Enter Demo Console"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl px-8 bg-background/50">
                    <Link href="/dashboard">
                      {isHi ? "कार्यप्रवाह देखें" : "See Organisational Work"}
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4">
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    ✓
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    A unified digital system for review and publication.
                  </p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-background/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                    ✓
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    Real-time coordination across units and aayams.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="relative bg-muted/30 px-4 py-24 sm:px-6 overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
        <div className="mx-auto max-w-4xl text-center space-y-8 relative z-10">
          <div className="mx-auto w-24 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <p className="text-sm uppercase tracking-[0.3em] font-bold text-primary">Pragya Pravah</p>
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl lg:leading-[1.2]">
              Giving institutional strength to <br className="hidden sm:block" />
              <span className="text-primary italic font-serif">Bharat-centred thought.</span>
            </h2>
            <p className="font-devanagari text-xl font-medium text-foreground/80 sm:text-2xl">
              भारत-केंद्रित चिंतन को समकालीन समाज में संस्थागत शक्ति देना।
            </p>
          </div>
          <div className="pt-8">
            <Button asChild size="lg" variant="ghost" className="rounded-full px-8 text-muted-foreground hover:text-primary transition-colors">
              <Link href="/directory">
                Connect with the Network / संवाद से जुड़ें
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
