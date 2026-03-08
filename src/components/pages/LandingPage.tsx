"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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

function Mandala({ className }: { className?: string }) {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <svg viewBox="0 0 240 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
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
    <div className={cn("space-y-3", align === "center" && "text-center") }>
      <p className="home-editorial-eyebrow">
        <span>{eyebrowEn}</span>
        <span className="font-devanagari tracking-[0.12em]">{eyebrowHi}</span>
      </p>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{titleEn}</h2>
        <p className="font-devanagari text-lg text-foreground/78">{titleHi}</p>
      </div>
      <p className={cn("max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base", align === "center" && "mx-auto") }>
        {bodyEn}
      </p>
      <p className={cn("max-w-3xl font-devanagari text-sm leading-7 text-foreground/72 sm:text-base", align === "center" && "mx-auto") }>
        {bodyHi}
      </p>
    </div>
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

const urgencyPoints = [
  {
    titleEn: "Public narratives need rooted clarity",
    titleHi: "लोक-विमर्श को जड़ों से जुड़ी स्पष्टता चाहिए",
    bodyEn: "Ideas shape institutions. The organisation works where public discourse, civilisational memory, and national confidence intersect.",
    bodyHi: "विचार संस्थाओं को आकार देते हैं। प्रज्ञा प्रवाह वहीं काम करता है जहाँ लोक-विमर्श, सभ्यतागत स्मृति और राष्ट्रीय आत्मविश्वास एक-दूसरे से जुड़ते हैं।",
  },
  {
    titleEn: "Knowledge systems must speak in present terms",
    titleHi: "ज्ञान-परंपरा को वर्तमान भाषा में बोलना होगा",
    bodyEn: "The task is not nostalgia. It is to render Bharatiya knowledge intelligible, rigorous, and active in contemporary life.",
    bodyHi: "यह केवल स्मृति का आग्रह नहीं है। भारतीय ज्ञान-परंपरा को समकालीन जीवन में बोधगम्य, प्रासंगिक और सक्रिय बनाना आवश्यक है।",
  },
  {
    titleEn: "Institutions require disciplined follow-through",
    titleHi: "संस्थाओं को अनुशासित कार्य-प्रवाह चाहिए",
    bodyEn: "Philosophy must translate into review, publication, outreach, and coordination if it is to shape society.",
    bodyHi: "यदि विचार समाज को दिशा देना चाहते हैं, तो उन्हें समीक्षा, प्रकाशन, प्रचार और समन्वय की ठोस प्रणाली में बदलना होगा।",
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

  return (
    <div className="bg-background text-foreground">
      <section className="home-hero-bg overflow-hidden border-b border-border/50">
        <div className="home-section-shell pt-10 sm:pt-14">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <p className="home-editorial-eyebrow">
                <span>Pragya Pravah</span>
                <span className="font-devanagari tracking-[0.12em]">प्रज्ञा प्रवाह</span>
              </p>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  A Bharatiya intellectual forum for civilisational thought and organised action.
                </h1>
                <p className="max-w-2xl font-devanagari text-lg text-foreground/78 sm:text-xl">
                  भारत-केंद्रित चिंतन, संवाद और संगठित कार्य का समकालीन संस्थागत मंच।
                </p>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  Pragya Pravah works where public ideas, cultural continuity, discourse, research,
                  publication, and organisational discipline meet.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-6">
                  <Link href="/parichay">
                    Understand the Vision / दृष्टि समझें
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                  <Link href="/login">
                    Enter Demo Console / डेमो प्रणाली खोलें
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="rounded-full px-6">
                  <Link href="/directory">
                    Connect with the Network / संवाद से जुड़ें
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="home-hero-panel relative overflow-hidden"
            >
              <div className="absolute -right-12 -top-10 text-primary/18">
                <Mandala className="h-48 w-48 animate-spin-slow" />
              </div>
              <div className="relative space-y-5">
                <p className="section-seal">Civilisational clarity for the present</p>
                <div className="space-y-3">
                  <h2 className="text-2xl font-semibold tracking-tight">Why this work matters now</h2>
                  <p className="font-devanagari text-base text-foreground/76">
                    भारतीय विचार को समकालीन समाज, सार्वजनिक विमर्श और संगठित कार्य से जोड़ना ही इसकी आवश्यकता है। 
                  </p>
                  <p className="text-sm leading-7 text-muted-foreground">
                    The task is not only to preserve memory, but to articulate Bharatiya categories in present
                    intellectual life with seriousness, discipline, and public relevance.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="home-insight-card">
                    <p className="shell-copy">Identity</p>
                    <p className="mt-2 text-sm font-semibold">Civilisational confidence</p>
                    <p className="mt-1 text-sm text-muted-foreground">Ideas anchored in Bharat's own categories and continuity.</p>
                  </div>
                  <div className="home-insight-card">
                    <p className="shell-copy">Method</p>
                    <p className="mt-2 text-sm font-semibold">Discourse into institutions</p>
                    <p className="mt-1 text-sm text-muted-foreground">Review, publication, outreach, and organised follow-through.</p>
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
          titleEn="A public-facing intellectual forum with organised depth"
          titleHi="एक वैचारिक मंच, जो संगठनात्मक गहराई के साथ कार्य करता है"
          bodyEn="Pragya Pravah is not only a cultural idea-space. It is an intellectual forum that develops discourse, nurtures research, and carries thought into coordinated public action."
          bodyHi="प्रज्ञा प्रवाह केवल सांस्कृतिक भावभूमि नहीं है। यह ऐसा बौद्धिक मंच है जो विमर्श गढ़ता है, शोध को पोषित करता है और विचार को संगठित सार्वजनिक कार्य तक ले जाता है।"
          align="center"
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.42fr_0.58fr]">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="home-band-card space-y-5"
          >
            <p className="section-seal">Public institution, not a generic platform</p>
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold tracking-tight">
                Thought has to take institutional form if it is to shape society.
              </h3>
              <p className="font-devanagari text-base leading-7 text-foreground/76">
                यदि विचार समाज को दिशा देना चाहते हैं, तो उन्हें संस्था, अनुशासन और कार्यप्रवाह का रूप लेना होगा।
              </p>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              Pragya Pravah sits between civilisational reflection and organised follow-through.
              That is why the visual language must feel both rooted and operational.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="home-band-pill">Discourse</span>
              <span className="home-band-pill">Research</span>
              <span className="home-band-pill">Publication</span>
              <span className="home-band-pill">Coordination</span>
            </div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {institutionCards.map((card, index) => (
              <motion.div
                key={card.titleEn}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.4 }}
                className="home-insight-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{card.titleEn}</h3>
                    <p className="font-devanagari text-sm text-foreground/72">{card.titleHi}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{card.bodyEn}</p>
                <p className="mt-2 font-devanagari text-sm leading-7 text-foreground/72">{card.bodyHi}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/50">
        <div className="home-section-shell">
          <SectionHeading
            eyebrowEn="Fields of Work"
            eyebrowHi="कार्य के आयाम"
            titleEn="The organisation's work moves across discourse, research, outreach, and formation"
            titleHi="संस्था का कार्य विमर्श, शोध, प्रचार और निर्माण के आयामों में चलता है"
            bodyEn="Each aayam is not just a title. It is an active field of thought, coordination, and institutional work."
            bodyHi="प्रत्येक आयाम केवल नाम नहीं है, बल्कि विचार, समन्वय और संस्थागत कार्य का सक्रिय क्षेत्र है।"
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.34fr_0.66fr]">
            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              className="home-band-card space-y-5 lg:sticky lg:top-24"
            >
              <p className="section-seal">From idea to field activity</p>
              <div className="space-y-3">
                <h3 className="text-2xl font-semibold tracking-tight">
                  Each workstream converts vision into a different form of organised public work.
                </h3>
                <p className="font-devanagari text-base leading-7 text-foreground/76">
                  प्रत्येक आयाम दृष्टि को अलग-अलग प्रकार के सार्वजनिक और संस्थागत कार्य में बदलता है।
                </p>
              </div>
              <div className="space-y-2 text-sm leading-7 text-muted-foreground">
                <p>Vimarsh frames questions.</p>
                <p>Shodh builds references.</p>
                <p>Prachar extends social reach.</p>
                <p>Yuva develops the next line of organisers and thinkers.</p>
              </div>
            </motion.aside>

            <div className="grid gap-5 md:grid-cols-2">
              {workstreams.map((stream, index) => (
                <motion.div
                  key={stream.titleEn}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08, duration: 0.45 }}
                  className="home-work-grid-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <stream.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{stream.titleEn}</h3>
                      <p className="font-devanagari text-sm text-foreground/72">{stream.titleHi}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{stream.bodyEn}</p>
                  <p className="mt-2 font-devanagari text-sm leading-7 text-foreground/72">{stream.bodyHi}</p>
                  <div className="mt-5">
                    <Button asChild variant="outline" className="rounded-full">
                      <Link href={stream.href}>
                        {stream.ctaEn} / {stream.ctaHi}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section-shell">
        <SectionHeading
          eyebrowEn="Why This Work Matters"
          eyebrowHi="यह कार्य अभी क्यों"
          titleEn="Civilisational thought must speak in contemporary terms"
          titleHi="सभ्यतागत विचार को वर्तमान भाषा और संस्थागत रूप में सामने आना होगा"
          bodyEn="The challenge is not only preservation. It is to make Bharatiya thought visible, intelligible, and effective in present public life."
          bodyHi="चुनौती केवल संरक्षण की नहीं है। भारतीय विचार को समकालीन सार्वजनिक जीवन में स्पष्ट, बोधगम्य और प्रभावी रूप में उपस्थित करना आवश्यक है।"
          align="center"
        />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="home-band-card mt-10"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="section-seal">Civilisational relevance in present tense</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                The question is not memory alone. It is intellectual presence, public confidence, and institutional continuity.
              </h3>
            </div>
            <div className="home-sequence-strip">Review • Publish • Prachar • Coordinate</div>
          </div>
        </motion.div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {urgencyPoints.map((point, index) => (
            <motion.div
              key={point.titleEn}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              className="home-insight-card"
            >
              <h3 className="text-base font-semibold">{point.titleEn}</h3>
              <p className="mt-1 font-devanagari text-sm text-foreground/74">{point.titleHi}</p>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{point.bodyEn}</p>
              <p className="mt-2 font-devanagari text-sm leading-7 text-foreground/72">{point.bodyHi}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/50 bg-card/50">
        <div className="home-section-shell">
          <SectionHeading
            eyebrowEn="Choose Your Path"
            eyebrowHi="अपना मार्ग चुनें"
            titleEn="Different visitors need different entry points"
            titleHi="हर आगंतुक के लिए प्रवेश का मार्ग अलग हो सकता है"
            bodyEn="The homepage should guide a visitor, a thinker, and an organiser without forcing them into the same reading path."
            bodyHi="यह पृष्ठ प्रथम आगंतुक, चिंतक और आयोजक—तीनों को एक ही ढाँचे में नहीं बाँधता, बल्कि उनके लिए अलग प्रवेश-पथ देता है।"
          />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {audiencePaths.map((path, index) => (
              <motion.div
                key={path.titleEn}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="home-path-card"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <path.icon className="h-5 w-5" />
                  </div>
                  <span className="home-path-index">{`0${index + 1}`}</span>
                </div>
                <div className="mt-4">
                  <div>
                    <h3 className="text-lg font-semibold">{path.titleEn}</h3>
                    <p className="font-devanagari text-sm text-foreground/72">{path.titleHi}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{path.bodyEn}</p>
                <p className="mt-2 font-devanagari text-sm leading-7 text-foreground/72">{path.bodyHi}</p>
                <div className="mt-5">
                  <Button asChild className="rounded-full">
                    <Link href={path.href}>
                      {path.ctaEn} / {path.ctaHi}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section-shell">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="relative flex items-center justify-center text-primary/20"
          >
            <Mandala className="h-72 w-72" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-primary/20 bg-background/80 px-5 py-3 text-center shadow-sm backdrop-blur">
                <p className="text-sm font-semibold text-foreground">ज्ञान · संवाद · संगठन</p>
                <p className="mt-1 font-devanagari text-sm text-foreground/72">ज्ञान, विमर्श और कार्य का समन्वय</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="home-hero-panel"
          >
            <SectionHeading
              eyebrowEn="Mission Into Operations"
              eyebrowHi="कार्य से प्रणाली तक"
              titleEn="Pragya Pravah in organised action"
              titleHi="प्रज्ञा प्रवाह का संगठित कार्य-रूप"
              bodyEn="The ERP and demo console show how discourse, review, publication, and outreach move through actual institutional workflows."
              bodyHi="डेमो प्रणाली और ईआरपी यह दिखाते हैं कि विमर्श, समीक्षा, प्रकाशन और प्रचार किस प्रकार वास्तविक संस्थागत कार्यप्रवाह में चलते हैं।"
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="home-sequence-strip">Review • Publish • Prachar • Coordinate</div>
              <div className="home-band-pill">Institutional workflow</div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {operationsSteps.map((step) => (
                <div key={step.step} className="home-process-step">
                  <div className="flex items-center gap-3">
                    <span className="home-path-index">{step.step}</span>
                    <div>
                      <p className="text-sm font-semibold">{step.titleEn}</p>
                      <p className="font-devanagari text-sm text-foreground/72">{step.titleHi}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.bodyEn}</p>
                  <p className="mt-2 font-devanagari text-sm leading-7 text-foreground/72">{step.bodyHi}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full px-6">
                <Link href="/login">
                  Enter Demo Console / डेमो प्रणाली खोलें
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full px-6">
                <Link href="/dashboard">
                  See Organisational Work / कार्यप्रवाह देखें
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="mx-auto max-w-5xl text-center">
          <div className="home-sutra-band mb-8" />
          <p className="text-sm uppercase tracking-[0.24em] text-primary">Pragya Pravah</p>
          <p className="mt-3 text-lg font-medium text-foreground/82">
            {isHi
              ? "भारत-केंद्रित चिंतन को समकालीन समाज में संस्थागत शक्ति देना।"
              : "Giving institutional strength to Bharat-centred thought in contemporary public life."}
          </p>
        </div>
      </section>
    </div>
  );
}
