"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Flame,
  GraduationCap,
  Megaphone,
  MessagesSquare,
  Network,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

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

function SectionHeading({
  eyebrowEn,
  eyebrowHi,
  titleEn,
  titleHi,
  bodyEn,
  bodyHi,
  align = "left",
}: {
  eyebrowEn: string;
  eyebrowHi: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  align?: "left" | "center";
}) {
  return (
    <div className={cn("max-w-4xl space-y-4", align === "center" && "mx-auto text-center")}>
      <p className="home-editorial-eyebrow">
        <span>{eyebrowEn}</span>
        <span className="font-devanagari tracking-[0.12em]">{eyebrowHi}</span>
      </p>
      <div className="space-y-3">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.1]">{titleEn}</h2>
        <p className="font-devanagari text-xl font-medium text-foreground/90">{titleHi}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{bodyEn}</p>
        <p className="font-devanagari text-sm leading-relaxed text-foreground/80 sm:text-base">{bodyHi}</p>
      </div>
    </div>
  );
}

const framingCards = [
  {
    titleEn: "What is Pragya Pravah?",
    titleHi: "प्रज्ञा प्रवाह क्या है?",
    bodyEn:
      "A global network of thinkers, groups, and enlightened expert forums rooted in Bharatiyata and committed to age-appropriate reconstruction of national life.",
    bodyHi:
      "भारतीयत्व में विश्वास रखने वाले विचारशील लोगों, समूहों और प्रबुद्ध विशेषज्ञ मंडलों का वैश्विक तंत्र, जो राष्ट्र जीवन के पुनर्रचना कार्य हेतु समर्पित है।",
    icon: Compass,
  },
  {
    titleEn: "Mission",
    titleHi: "लक्ष्य",
    bodyEn:
      "Search for directions and working principles for reconstructing every sphere of national life on the basis of elevated Hindu life values.",
    bodyHi:
      "उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के प्रत्येक क्षेत्र में युगानुकूल पुनर्रचना की दिशा एवं सूत्रों की खोज करना।",
    icon: Network,
  },
  {
    titleEn: "Vision",
    titleHi: "दृष्टि",
    bodyEn: "Build a welfare-oriented global society inspired by Pragya-based Hindu life values.",
    bodyHi: "प्रज्ञा आधारित हिंदू जीवन मूल्यों से प्रेरित लोक कल्याणकारी वैश्विक समाज रचना।",
    icon: Users,
  },
] as const;

const goals = [
  {
    titleEn: "Research",
    titleHi: "शोध",
    bodyEn:
      "Deep study on geopolitics, philosophy, culture, literature, history, environment and other issues from a national perspective.",
    bodyHi:
      "राष्ट्रीय दृष्टिकोण से भू-राजनीति, दर्शन, संस्कृति, साहित्य, इतिहास, पर्यावरण आदि विषयों पर विस्तृत शोध एवं विश्लेषण।",
    icon: GraduationCap,
  },
  {
    titleEn: "Content Creation",
    titleHi: "सामग्री निर्माण",
    bodyEn:
      "Publish journals, books, research, and audio-visual material that strengthens Bharatiya thought and responds to misinformation.",
    bodyHi:
      "पत्रिका, पुस्तक, शोध प्रबंध और दृश्य/श्रव्य सामग्री का निर्माण; भारत एवं हिंदुत्व विषयक कुप्रचार का तथ्यात्मक खंडन।",
    icon: BookOpen,
  },
  {
    titleEn: "Prachar, Prasar & Jagaran",
    titleHi: "प्रचार, प्रसार एवं जागरण",
    bodyEn:
      "Carry ideas to study circles, seminars, workshops, and wider public discourse through traditional and modern outreach.",
    bodyHi:
      "विचार को संगोष्ठी, कार्यशाला, विचार संगम और प्रचार-प्रसार माध्यमों के द्वारा अध्ययनशील एवं चिंतक वर्ग तक पहुँचाना।",
    icon: Megaphone,
  },
] as const;

const operationalModel = [
  {
    titleEn: "Prant and Unit",
    titleHi: "प्रांत और इकाई",
    bodyEn: "Each prant should reach at least division centres. Active towns and universities operate as units.",
    bodyHi: "प्रत्येक प्रांत में कम से कम विभाग केन्द्रों तक कार्य हो; कार्ययुक्त नगर और विश्वविद्यालय/महाविद्यालय इकाई कहलाएँ।",
  },
  {
    titleEn: "Adhyayan Kendra",
    titleHi: "अध्ययन केंद्र",
    bodyEn: "A minimum monthly gathering for topic presentation, study, and book discussion at unit level.",
    bodyHi: "इकाई स्तर पर न्यूनतम आवश्यक गतिविधि: माह में कम से कम एक बार विषय प्रस्तुति, पुस्तक चर्चा और अध्ययन।",
  },
  {
    titleEn: "Shikshan Kendra",
    titleHi: "शिक्षण केंद्र",
    bodyEn: "Structured subject learning under senior scholars at prant or city level.",
    bodyHi: "प्रांत या नगर स्तर पर वरिष्ठ विद्वानों के मार्गदर्शन में विषय विशेष का शिक्षण केंद्र चलाना।",
  },
] as const;

const ayams = [
  { nameEn: "Yuva", nameHi: "युवा", icon: Flame },
  { nameEn: "Mahila", nameHi: "महिला", icon: Users },
  { nameEn: "Shodh", nameHi: "शोध", icon: GraduationCap },
  { nameEn: "Prachar", nameHi: "प्रचार", icon: Megaphone },
] as const;

const vishay = [
  "Samajshastra",
  "Rajneeti Shastra",
  "Arthashastra",
  "Itihas",
  "Darshan",
  "Mat-Panth Adhyayan",
  "Vidhi",
  "Bhugol",
  "Paryavaran",
  "Media aur Patrakarita",
  "Antarrashtriya Sambandh",
  "Samajik Sahakar",
  "Bhartiya Bhashayen",
  "Vaishvik Bhashayen",
  "Anuvad",
] as const;

export default function LandingPage() {
  const { lang } = useAppContext();
  const isHi = lang === "hi";

  return (
    <div className="bg-background text-foreground">
      <section className="relative overflow-hidden px-4 py-20 sm:px-6 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_hsl(27_100%_50%_/_0.12),_transparent_42%),linear-gradient(135deg,hsl(220_30%_11%)_0%,hsl(220_24%_14%)_38%,hsl(28_54%_16%)_100%)]" />
        <div className="absolute inset-y-0 right-[-6rem] hidden w-[24rem] text-white/15 md:block">
          <Mandala className="h-full w-full" />
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="space-y-8 text-white">
            <p className="home-editorial-eyebrow text-white/75">
              <span>ORGANISATION INTRODUCTION</span>
              <span className="font-devanagari tracking-[0.12em]">प्रस्तुति आधारित परिचय</span>
            </p>
            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">Pragya Pravah</h1>
              <p className="font-devanagari text-xl font-medium text-primary-foreground/90 sm:text-2xl">
                उदात्त हिंदू जीवन मूल्यों के आधार पर राष्ट्र जीवन के पुनर्रचना हेतु विचारशील लोगों का वैश्विक तंत्र।
              </p>
              <p className="max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                {isHi
                  ? "यह सार्वजनिक परिचय प्रज्ञा प्रवाह की दृष्टि, लक्ष्य, उद्देश्य, कार्य-रचना, आयाम, विषय और विमर्श को सरल और स्पष्ट रूप में प्रस्तुत करता है।"
                  : "This public introduction presents Pragya Pravah's vision, mission, goals, work structure, ayams, subjects, and vimarsh in a clear, focused form."}
              </p>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                {isHi ? "अपना मार्ग चुनें" : "Choose Your Path"}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="h-14 rounded-2xl px-8 shadow-xl shadow-primary/20">
                <Link href="/parichay">
                  {isHi ? "दृष्टि और परिचय देखें" : "Understand the Vision"}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl px-8 border-white/20 bg-white/5 text-white hover:bg-white/10">
                <Link href="/login">
                  {isHi ? "डेमो प्रणाली खोलें" : "Enter Demo Console"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="h-14 rounded-2xl px-8 text-white hover:bg-white/10">
                <Link href="/login?returnTo=/directory">
                  {isHi ? "संवाद से जुड़ें" : "Connect with the Network"}
                </Link>
              </Button>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.08 }} className="grid gap-4">
            {framingCards.map((card) => (
              <Card key={card.titleEn} className="border-white/10 bg-white/8 text-white backdrop-blur">
                <CardContent className="pt-5 space-y-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <card.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold">{isHi ? card.titleHi : card.titleEn}</h2>
                    <p className={cn("text-sm leading-6 text-white/78", isHi && "font-devanagari")}>
                      {isHi ? card.bodyHi : card.bodyEn}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrowEn="FIELDS OF WORK"
            eyebrowHi="उद्देश्य"
            titleEn="Core work areas"
            titleHi="मुख्य कार्य क्षेत्र"
            bodyEn="Pragya Pravah's public work moves through research, content creation, and outreach so that ideas become organised social and intellectual action."
            bodyHi="प्रज्ञा प्रवाह का सार्वजनिक कार्य शोध, सामग्री निर्माण और प्रचार-प्रसार के माध्यम से आगे बढ़ता है, ताकि विचार संगठित सामाजिक और बौद्धिक कार्य में बदल सकें।"
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {goals.map((goal) => (
              <Card key={goal.titleEn} className="institution-panel">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <goal.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{isHi ? goal.titleHi : goal.titleEn}</h3>
                    <p className={cn("text-sm leading-6 text-muted-foreground", isHi && "font-devanagari")}>
                      {isHi ? goal.bodyHi : goal.bodyEn}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrowEn="WORK FORM"
            eyebrowHi="कार्य का स्वरूप"
            titleEn="The flow of mission"
            titleHi="प्रांत, इकाई, अध्ययन केंद्र और शिक्षण केंद्र"
            bodyEn="The PPT defines the operational structure through prant and unit work, then grounds the minimum activity in study and teaching centres."
            bodyHi="प्रस्तुति में कार्य का स्वरूप प्रांत और इकाई से शुरू होकर अध्ययन केंद्र और शिक्षण केंद्र तक व्यवस्थित किया गया है।"
          />

          <div className="grid gap-4 lg:grid-cols-3">
            {operationalModel.map((item) => (
              <Card key={item.titleEn} className="institution-panel-muted">
                <CardContent className="pt-6 space-y-3">
                  <h3 className="text-lg font-semibold">{isHi ? item.titleHi : item.titleEn}</h3>
                  <p className={cn("text-sm leading-6 text-muted-foreground", isHi && "font-devanagari")}>
                    {isHi ? item.bodyHi : item.bodyEn}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrowEn="CORE AYAMS"
            eyebrowHi="कार्य के आयाम"
            titleEn="Core operational areas"
            titleHi="मुख्य संचालन क्षेत्र"
            bodyEn="At the working level, Pragya Pravah advances through youth, women, research, and outreach-focused responsibilities, each with its own leadership and work rhythm."
            bodyHi="कार्य स्तर पर प्रज्ञा प्रवाह युवा, महिला, शोध और प्रचार जैसे उत्तरदायित्व-आधारित आयामों के माध्यम से आगे बढ़ता है, जिनकी अपनी कार्य-धारा और नेतृत्व रचना होती है।"
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ayams.map((ayam) => (
              <Card key={ayam.nameEn} className="institution-panel text-center">
                <CardContent className="pt-6 space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                    <ayam.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-devanagari text-xl font-semibold">{ayam.nameHi}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">{ayam.nameEn}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[hsl(220_30%_11%)] px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl space-y-10">
          <SectionHeading
            eyebrowEn="VISHAY + VIMARSH"
            eyebrowHi="विषय और विमर्श"
            titleEn="Subject study and Vimarsh"
            titleHi="विषय अध्ययन और विमर्श"
            bodyEn="The organisation develops subject-wise study teams and a Vimarsh framework that studies narratives, articulates truth, and responds to misleading or hostile discourse."
            bodyHi="संगठन विषय-आधारित अध्ययन टोली विकसित करता है और साथ ही ऐसा विमर्श खड़ा करता है जो नरेटिव्स का अध्ययन करे, सत्य का मंडन करे और भ्रमकारी या विरोधी कथनों का उत्तर दे।"
            align="center"
          />

          <div className="flex flex-wrap gap-2">
            {vishay.map((item) => (
              <span key={item} className="rounded-full border border-white/15 bg-white/6 px-4 py-2 text-xs tracking-[0.12em] text-white/84">
                {item}
              </span>
            ))}
          </div>

          <Card className="border-white/10 bg-white/8 text-white">
            <CardContent className="pt-6 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <MessagesSquare className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold">{isHi ? "विमर्श का कार्य" : "What Vimarsh does"}</h3>
                <p className={cn("text-sm leading-6 text-white/76", isHi && "font-devanagari")}>
                  {isHi
                    ? "भारत और विश्व में चल रहे नरेटिव्स का अध्ययन, सत्य का मंडन, कुप्रचार का खंडन, और उसके लिए आवश्यक कार्यक्रम एवं सामग्री निर्माण।"
                    : "Study current narratives in Bharat and the world, articulate truth, counter misinformation, and build the programmes and material needed for that work."}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <p className="text-sm font-semibold">{isHi ? "आत्म बोध" : "Atma-bodh"}</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">{isHi ? "स्व, हिंदुत्व, भारत" : "Swa, Hindutva, Bharat"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <p className="text-sm font-semibold">{isHi ? "शत्रु बोध" : "Counter-narrative vigilance"}</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">{isHi ? "कल्चरल मार्क्सवाद, ग्लोबल मार्केट फोर्सेज, अतिवादी इस्लाम एवं इसाइयत" : "Cultural Marxism, global market forces, extremism and hostile narratives."}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <p className="text-sm font-semibold">{isHi ? "समूह विमर्श" : "Social-group discourse"}</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">{isHi ? "दलित, जनजातीय, युवा, महिला विमर्श" : "Dalit, tribal, youth and women discourse."}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4">
                  <p className="text-sm font-semibold">{isHi ? "क्षेत्रीय विमर्श" : "Regional discourse"}</p>
                  <p className="mt-2 text-xs leading-6 text-white/70">{isHi ? "पंजाब, कश्मीर, उत्तर-पूर्व, उत्तर-दक्षिण भारत, आर्थिक विकास, संविधान, राष्ट्रीय सुरक्षा आदि" : "Punjab, Kashmir, North-East, North-South, economy, constitution, national security and more."}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <p className="section-seal">NEXT STEP</p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">
            {isHi ? "परिचय से कार्यप्रवाह तक" : "From introduction to workflow"}
          </h2>
          <p className={cn("text-base leading-7 text-muted-foreground", isHi && "font-devanagari")}>
            {isHi
              ? "यदि आप संगठन का परिचय देखना चाहते हैं तो परिचय पृष्ठ खोलें। यदि आप भूमिका-आधारित ERP कार्यप्रवाह में प्रवेश करना चाहते हैं तो लॉगिन करें।"
              : "Open the introduction if you want the organisation's approved framing. Sign in if you want the role-based ERP workflow for the Bhopal pilot."}
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-14 rounded-2xl px-8">
              <Link href="/parichay">
                {isHi ? "परिचय देखें" : "Open Parichay"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl px-8">
              <Link href="/login">{isHi ? "ERP लॉगिन" : "ERP Login"}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
