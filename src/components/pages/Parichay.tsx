"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  BookOpenText,
  Users,
  Building2,
  Compass,
  ScrollText,
  FlaskConical,
  Scale,
  ArrowRight,
  Info,
  Target,
  History,
  LayoutGrid,
  Landmark,
  LogOut,
  Languages,
} from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { useSignOut } from "@/hooks/use-sign-out";
import { getNavGroups } from "@/lib/app/navigation";
import { getRoleLandingPath } from "@/lib/app/role-routing";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { PragyaLogo } from "@/components/PragyaLogo";
import { cn } from "@/lib/utils";

// ── Brand Mark: animated bilingual name + logo ───────────────────────────────
function BrandMark() {
  const [flip, setFlip] = useState<"en" | "hi">("en");
  useEffect(() => {
    const id = setInterval(() => setFlip((v) => (v === "en" ? "hi" : "en")), 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <Link href="/parichay" className="group flex items-center gap-3 min-w-0" aria-label="Pragya Pravah — Home">
      <span className="relative inline-flex items-center justify-center h-10 w-10 shrink-0">
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[#f57c00]/25 blur-md"
          animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          className="relative inline-flex items-center justify-center h-10 w-10 rounded-[0.9rem] bg-gradient-to-br from-[#ffdcc6] via-[#f57c00] to-[#964900] shadow-[0_10px_24px_-12px_rgba(150,73,0,0.65)] ring-1 ring-[#964900]/15"
          whileHover={{ rotate: [0, -4, 4, 0] }}
          transition={{ duration: 0.6 }}
        >
          <PragyaLogo className="h-7 w-7 drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)]" />
        </motion.span>
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-[#f57c00] opacity-75 animate-ping" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#964900]" />
        </span>
      </span>
      <span className="relative flex flex-col leading-none min-w-0">
        <span className="text-[9px] uppercase tracking-[0.32em] text-[#8b7263] font-extrabold">
          Bharat · भारत
        </span>
        <span className="relative block h-7 md:h-8 overflow-hidden w-[220px] md:w-[260px]">
          <AnimatePresence mode="wait" initial={false}>
            {flip === "en" ? (
              <motion.span
                key="en"
                className="absolute inset-0 font-serif font-bold text-[#964900] uppercase tracking-[0.22em] text-lg md:text-xl whitespace-nowrap"
                initial={{ y: 16, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -16, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                PRAGYA PRAVAH
              </motion.span>
            ) : (
              <motion.span
                key="hi"
                className="absolute inset-0 font-serif font-bold text-[#964900] tracking-[0.08em] text-xl md:text-2xl whitespace-nowrap"
                initial={{ y: 16, opacity: 0, filter: "blur(4px)" }}
                animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                exit={{ y: -16, opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                lang="hi"
              >
                प्रज्ञा प्रवाह
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="relative mt-1 h-[2px] w-full overflow-hidden rounded-full bg-[#dec1af]/40">
          <motion.span
            className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#f57c00] to-transparent"
            animate={{ x: ["-100%", "300%"] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
          />
        </span>
      </span>
    </Link>
  );
}

// ── Shared: TopAppBar (wired to AppContext) ──────────────────────────────────
function TopAppBar() {
  const { lang, setLang, isAuthenticated, viewer, permissions } = useAppContext();
  const t = useT();
  const signOut = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);

  const showAdminControls =
    permissions.canManageUsers ||
    Boolean(viewer?.effectiveRoles?.some((r) => r === "super_admin" || r === "org_admin"));
  const navigationGroups = useMemo(
    () => getNavGroups(showAdminControls, viewer?.primaryRoleCode ? [viewer.primaryRoleCode] : null),
    [showAdminControls, viewer?.primaryRoleCode],
  );
  const landingPath = getRoleLandingPath(
    viewer?.effectiveRoles ?? null,
    viewer?.primaryRoleCode ?? null,
  );

  return (
    <header className="fixed top-0 w-full flex justify-between items-center px-6 md:px-8 h-20 bg-[#faf9f6]/90 backdrop-blur-xl z-50 border-b border-[#dec1af]/10 shadow-[0_4px_20px_rgba(150,73,0,0.05)]">
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="text-[#964900] active:scale-95 duration-200 ease-out"
                aria-label={t("Open navigation menu", "नेविगेशन मेनू खोलें")}
              >
                <Menu className="w-6 h-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] bg-white p-0 border-r border-[#dec1af]/30">
            <SheetTitle className="sr-only">{t("Navigation", "नेविगेशन")}</SheetTitle>
            <SheetDescription className="sr-only">
              {t("Primary navigation links.", "मुख्य नेविगेशन लिंक।")}
            </SheetDescription>
            <div className="border-b border-[#dec1af]/30 px-6 py-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#636262]">
                {t("Pragya Pravah", "प्रज्ञा प्रवाह")}
              </p>
              <h2 className="font-serif text-xl font-bold text-[#964900] mt-1">
                {t("Parichay", "परिचय")}
              </h2>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4">
              {navigationGroups.map((group) => (
                <div key={group.title} className="mb-4 space-y-1">
                  <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.22em] text-[#636262]">
                    {t(group.title, group.titleHi)}
                  </p>
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      prefetch={false}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#1a1c1a] hover:bg-[#f4f3f1] transition-colors"
                    >
                      <item.icon className="w-4 h-4 shrink-0 text-[#964900]" />
                      <span className={cn("block leading-none", lang === "hi" && "font-devanagari")}>
                        {t(item.label, item.sublabel)}
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[#ba1a1a] hover:bg-[#ffdad6] transition-colors mt-4"
              >
                <LogOut className="w-4 h-4" />
                {t("Sign out", "निकासी")}
              </button>
            </nav>
          </SheetContent>
        </Sheet>
        ) : null}
        <BrandMark />
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest font-extrabold">
        <a className="text-[#964900] font-bold" href="#mission">{t("Mission", "उद्देश्य")}</a>
        <a className="text-[#636262] hover:text-[#f57c00] transition-colors" href="#pillars">{t("Pillars", "स्तंभ")}</a>
        <a className="text-[#636262] hover:text-[#f57c00] transition-colors" href="#dimensions">{t("Dimensions", "आयाम")}</a>
        <a className="text-[#636262] hover:text-[#f57c00] transition-colors" href="#social">{t("Social", "सामाजिक")}</a>
      </nav>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLang(lang === "hi" ? "en" : "hi")}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#dec1af] text-[#964900] text-xs uppercase tracking-widest font-bold hover:bg-[#f4f3f1] transition-colors"
          aria-label={t("Toggle language", "भाषा बदलें")}
        >
          <Languages className="w-3.5 h-3.5" />
          {lang === "hi" ? "EN" : "हिं"}
        </button>
        {isAuthenticated ? (
          <Link
            href={landingPath}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-[#964900] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#f57c00] transition-colors"
          >
            {t("Enter Console", "कार्यक्षेत्र")}
          </Link>
        ) : (
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-xl bg-[#964900] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#f57c00] transition-colors"
          >
            {t("Sign In", "प्रवेश")}
          </Link>
        )}
      </div>
    </header>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const t = useT();
  return (
    <section
      id="mission"
      className="relative min-h-[819px] flex flex-col justify-center px-6 md:px-20 py-24 overflow-hidden"
      style={{
        backgroundColor: "#faf9f6",
        backgroundImage:
          "radial-gradient(circle at 20% 10%, rgba(245,124,0,0.08), transparent 40%), radial-gradient(circle at 80% 90%, rgba(150,73,0,0.06), transparent 50%)",
      }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <span className="inline-block px-4 py-1 rounded-full bg-[#e3e2e0] text-[#964900] font-bold text-xs uppercase tracking-widest">
            {t("Digital Home for Thought", "विचार का डिजिटल निवास")}
          </span>
          <h2 className="font-serif text-6xl md:text-8xl italic font-light tracking-tighter text-[#964900] leading-none">
            Parichay
            <br />
            <span className="not-italic font-bold text-[#1a1c1a]" lang="hi">परिचय</span>
          </h2>
          <div className="space-y-4 border-l-4 border-[#f57c00] pl-6">
            <p className="font-serif text-2xl italic text-[#574235] leading-relaxed">
              &ldquo;Connecting the roots of Bharat with the aspirations of the modern world.&rdquo;
            </p>
            <p className="text-lg text-[#636262] leading-relaxed" lang="hi">
              भारत की जड़ों को आधुनिक विश्व की आकांक्षाओं के साथ जोड़ना।
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-700 bg-gradient-to-br from-[#964900] via-[#f57c00] to-[#ffb786] flex items-center justify-center">
            <Landmark className="w-40 h-40 text-white/30" aria-hidden />
          </div>
          <div className="absolute -bottom-10 -left-4 md:-left-10 bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-xs transform -rotate-3 hover:rotate-0 transition-transform duration-500">
            <p className="font-serif text-[#964900] text-lg md:text-xl font-bold leading-tight">
              {t("Bharat-centered", "भारत-केंद्रित")}
              <br />
              {t("Intellectualism", "बौद्धिकता")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Core Objectives ──────────────────────────────────────────────────────────
type Objective = {
  icon: React.ElementType;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
  highlight?: boolean;
};

const OBJECTIVES: Objective[] = [
  {
    icon: BookOpenText,
    titleEn: "Narrative Building",
    titleHi: "विमर्श निर्माण",
    bodyEn:
      "Developing an authentic discourse on Indian culture, values, and global contributions through rigorous intellectual research.",
    bodyHi:
      "कठोर बौद्धिक शोध के माध्यम से भारतीय संस्कृति, मूल्यों और वैश्विक योगदान पर प्रामाणिक विमर्श का विकास।",
  },
  {
    icon: Users,
    titleEn: "Intellectual Unity",
    titleHi: "बौद्धिक एकता",
    bodyEn:
      "Providing a unified platform for thinkers, scholars, and activists to converge and share Bharat-centric perspectives.",
    bodyHi:
      "विचारकों, विद्वानों और कार्यकर्ताओं को एकत्र कर भारत-केन्द्रित दृष्टि साझा करने का एकीकृत मंच।",
    highlight: true,
  },
  {
    icon: Building2,
    titleEn: "Social Policy",
    titleHi: "सामाजिक नीति",
    bodyEn:
      "Influencing the social and cultural policies of the nation through grounded insights and traditional wisdom.",
    bodyHi:
      "आधारभूत दृष्टि एवं परम्परागत प्रज्ञा से राष्ट्र की सामाजिक एवं सांस्कृतिक नीतियों को प्रभावित करना।",
  },
];

function CoreObjectives() {
  const t = useT();
  const { lang } = useAppContext();
  return (
    <section className="bg-[#f4f3f1] py-24 px-6 md:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 flex flex-col items-center text-center">
          <h3 className="font-serif text-4xl md:text-5xl font-bold mb-4 text-[#1a1c1a]">
            {t("Core Objectives", "मुख्य उद्देश्य")}{" "}
            <span className="font-normal text-[#964900] italic" lang={lang === "hi" ? "en" : "hi"}>
              {lang === "hi" ? "(Core Objectives)" : "(मुख्य उद्देश्य)"}
            </span>
          </h3>
          <div className="w-24 h-1 bg-[#f57c00] rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {OBJECTIVES.map((obj) => {
            const Icon = obj.icon;
            const base = obj.highlight
              ? "p-10 rounded-[2.5rem] shadow-xl md:scale-105 transition-all duration-500 relative overflow-hidden bg-[#2f312f]"
              : "bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-[0_20px_40px_rgba(150,73,0,0.06)] transition-all duration-500 border border-[#dec1af]/20";
            return (
              <div key={obj.titleEn} className={`group ${base}`}>
                {obj.highlight && (
                  <div className="absolute top-4 right-4 opacity-5">
                    <Landmark className="w-40 h-40 text-white" aria-hidden />
                  </div>
                )}
                <div
                  className={
                    obj.highlight
                      ? "w-16 h-16 bg-[#f57c00] rounded-2xl flex items-center justify-center text-white mb-8"
                      : "w-16 h-16 bg-[#964900]/10 rounded-2xl flex items-center justify-center text-[#964900] mb-8 group-hover:bg-[#f57c00] group-hover:text-white transition-colors duration-300"
                  }
                >
                  <Icon className="w-7 h-7" />
                </div>
                <h4 className={`font-serif text-2xl font-bold mb-2 ${obj.highlight ? "text-white" : "text-[#1a1c1a]"}`}>
                  {t(obj.titleEn, obj.titleHi)}
                </h4>
                <h5 className="text-sm font-bold text-[#f57c00] uppercase tracking-widest mb-6" lang={lang === "hi" ? "en" : "hi"}>
                  {lang === "hi" ? obj.titleEn : obj.titleHi}
                </h5>
                <p className={obj.highlight ? "text-[#e3e2e0] leading-relaxed" : "text-[#636262] leading-relaxed"}>
                  {t(obj.bodyEn, obj.bodyHi)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Action Pillars ───────────────────────────────────────────────────────────
const PILLARS = [
  {
    num: "01",
    titleEn: "Seminars & Conclaves",
    titleHi: "संगोष्ठी एवं सम्मेलन",
    bodyEn: "Bringing together the brightest minds for thematic discussions across the country.",
    bodyHi: "देशभर के श्रेष्ठ विचारकों को विषयगत विमर्श के लिए एकत्र करना।",
    href: "/calendar",
  },
  {
    num: "02",
    titleEn: "Digital Publications",
    titleHi: "डिजिटल प्रकाशन",
    bodyEn: "Curating research papers and long-form articles for a global digital audience.",
    bodyHi: "वैश्विक डिजिटल पाठकों के लिए शोध पत्र एवं दीर्घ लेखों का संकलन।",
    href: "/aalekh",
  },
  {
    num: "03",
    titleEn: "Cultural Mentorship",
    titleHi: "सांस्कृतिक मार्गदर्शन",
    bodyEn: "Nurturing a new generation of thinkers rooted in Indian ethos.",
    bodyHi: "भारतीय संस्कार में दीक्षित नवीन विचारक पीढ़ी का निर्माण।",
    href: "/vimarsh",
  },
];

function ActionPillars() {
  const t = useT();
  const { lang } = useAppContext();
  return (
    <section id="pillars" className="py-24 px-6 md:px-20 bg-[#faf9f6]">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-16 items-center">
        <div className="w-full md:w-1/2 order-2 md:order-1">
          <div className="space-y-12">
            {PILLARS.map((p) => (
              <Link
                key={p.num}
                href={p.href}
                className="flex gap-6 group cursor-pointer"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-[#f57c00] flex items-center justify-center font-serif font-bold text-xl text-[#964900] group-hover:bg-[#f57c00] group-hover:text-white transition-all duration-300">
                  {p.num}
                </div>
                <div>
                  <h4 className="font-serif text-2xl font-bold text-[#1a1c1a]">
                    {t(p.titleEn, p.titleHi)}
                  </h4>
                  <p className="text-[#636262] mt-2">{t(p.bodyEn, p.bodyHi)}</p>
                  <p className="text-sm font-bold text-[#f57c00] mt-1 uppercase tracking-wide" lang={lang === "hi" ? "en" : "hi"}>
                    {lang === "hi" ? p.titleEn : p.titleHi}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="w-full md:w-1/2 order-1 md:order-2">
          <div className="relative">
            <div className="absolute -inset-4 bg-[#f57c00]/10 rounded-[3rem] blur-xl" />
            <div className="relative rounded-[3rem] shadow-2xl aspect-[4/3] bg-gradient-to-br from-[#1a1c1a] via-[#574235] to-[#964900] flex items-center justify-center">
              <Compass className="w-32 h-32 text-white/30" aria-hidden />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Dimensions ───────────────────────────────────────────────────────────────
const DIMENSIONS = [
  { icon: ScrollText, labelEn: "History & Ethos", labelHi: "इतिहास एवं लोकाचार", href: "/history" },
  { icon: Compass, labelEn: "Arts & Aesthetics", labelHi: "कला एवं सौन्दर्य", href: "/vimarsh" },
  { icon: FlaskConical, labelEn: "Ancient Science", labelHi: "प्राचीन विज्ञान", href: "/library" },
  { icon: Scale, labelEn: "Dharma & Law", labelHi: "धर्म एवं विधि", href: "/vimarsh" },
];

function Dimensions() {
  const t = useT();
  return (
    <section id="dimensions" className="py-24 px-6 md:px-20 bg-[#e9e8e5] relative overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#f57c00]/5 rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-16">
          <div>
            <h3 className="font-serif text-5xl font-bold text-[#1a1c1a]">
              {t("Dimensions", "आयाम")}
            </h3>
            <p className="text-[#f57c00] font-extrabold uppercase tracking-widest mt-2" lang="hi">
              क्षेत्र एवं आयाम
            </p>
          </div>
          <Link
            href="/library"
            className="inline-flex items-center bg-[#964900] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#f57c00] hover:-translate-y-1 transition-all duration-300 shadow-lg"
          >
            {t("Explore All", "सब देखें")}
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {DIMENSIONS.map(({ icon: Icon, labelEn, labelHi, href }) => (
            <Link
              key={labelEn}
              href={href}
              className="aspect-square bg-white rounded-[2rem] p-8 flex flex-col justify-between hover:bg-[#964900] group transition-all duration-500 cursor-pointer"
            >
              <Icon className="w-10 h-10 text-[#964900] group-hover:text-white transition-colors" aria-hidden />
              <div className="font-serif text-xl font-bold text-[#1a1c1a] group-hover:text-white transition-colors">
                {t(labelEn, labelHi)}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Social Transformation ────────────────────────────────────────────────────
const SOCIAL = [
  { num: "01", titleEn: "Community Resonance", titleHi: "सामुदायिक गूंज", href: "/prachar" },
  { num: "02", titleEn: "Educational Reform", titleHi: "शिक्षा सुधार", href: "/aalekh" },
  { num: "03", titleEn: "Youth Empowerment", titleHi: "युवा सशक्तिकरण", href: "/dayitv" },
];

function SocialTransformation() {
  const t = useT();
  const { lang } = useAppContext();
  return (
    <section id="social" className="py-24 px-6 md:px-20 bg-[#faf9f6]">
      <div className="max-w-4xl mx-auto">
        <div className="mb-16 text-center">
          <h3 className="font-serif text-4xl font-bold text-[#1a1c1a]">
            {t("Social Transformation", "सामाजिक परिवर्तन")}
          </h3>
          <p className="text-[#636262] italic">
            {t(
              "The journey of societal awakening through intellectual depth.",
              "बौद्धिक गहनता के माध्यम से सामाजिक जागरण की यात्रा।",
            )}
          </p>
        </div>
        <div className="space-y-4">
          {SOCIAL.map((s) => (
            <Link
              key={s.num}
              href={s.href}
              className="group flex items-center gap-6 md:gap-8 p-6 md:p-8 rounded-3xl hover:bg-[#f4f3f1] transition-all duration-300 cursor-pointer border border-transparent hover:border-[#dec1af]/30"
            >
              <div className="text-4xl md:text-5xl font-serif font-bold text-[#dec1af] group-hover:text-[#f57c00] transition-colors duration-300">
                {s.num}
              </div>
              <div className="flex-1">
                <h4 className="font-serif text-xl md:text-2xl font-bold text-[#1a1c1a]">
                  {t(s.titleEn, s.titleHi)}
                </h4>
                <p className="text-[#636262] text-sm uppercase tracking-wider font-bold" lang={lang === "hi" ? "en" : "hi"}>
                  {lang === "hi" ? s.titleEn : s.titleHi}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-[#f57c00] opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── CTA ──────────────────────────────────────────────────────────────────────
function CallToAction() {
  const t = useT();
  const { isAuthenticated, viewer } = useAppContext();
  const landingPath = getRoleLandingPath(
    viewer?.effectiveRoles ?? null,
    viewer?.primaryRoleCode ?? null,
  );
  const primaryHref = isAuthenticated ? landingPath : "/login";
  const primaryLabelEn = isAuthenticated ? "Enter Console" : "Join Community";
  const primaryLabelHi = isAuthenticated ? "कार्यक्षेत्र में प्रवेश" : "समुदाय से जुड़ें";

  return (
    <section className="mx-6 md:mx-20 mb-24 relative rounded-[3rem] md:rounded-[4rem] overflow-hidden bg-[#964900] py-24 text-center text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-[#964900] to-[#f57c00] opacity-60" />
      <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-8">
        <h3 className="font-serif text-4xl md:text-5xl font-bold mb-6">
          {t("Become a part of the Pravah.", "प्रवाह का अंग बनें।")}
        </h3>
        <p className="text-base md:text-lg text-white/80 mb-10 leading-relaxed">
          {t(
            "Join thousands of thinkers contributing to the revival of Bharat's intellectual prowess.",
            "भारत की बौद्धिक शक्ति के पुनरुद्धार में योगदान देने वाले सहस्रों विचारकों से जुड़ें।",
          )}
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <Link
            href={primaryHref}
            className="bg-white text-[#964900] px-10 py-4 rounded-2xl font-bold hover:bg-[#ffffff] hover:scale-105 transition-all duration-300 shadow-xl"
          >
            {t(primaryLabelEn, primaryLabelHi)}
          </Link>
          <Link
            href="/aalekh"
            className="border-2 border-white/40 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/10 transition-all duration-300"
          >
            {t("Read Archives", "संग्रह पढ़ें")}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Right Rail ───────────────────────────────────────────────────────────────
function SideRail() {
  const items = [
    { icon: Info, href: "#mission", label: "Mission", active: true },
    { icon: Target, href: "#pillars", label: "Pillars" },
    { icon: LayoutGrid, href: "#dimensions", label: "Dimensions" },
    { icon: Users, href: "#social", label: "Social" },
    { icon: History, href: "/history", label: "History" },
  ];
  return (
    <aside className="fixed right-0 top-20 h-[calc(100vh-5rem)] w-20 flex-col items-center py-10 gap-8 hidden md:flex border-l border-[#dec1af]/20 bg-white z-40">
      {items.map(({ icon: Icon, href, label, active }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className={active ? "text-[#964900]" : "text-[#636262] hover:text-[#964900] transition-colors"}
        >
          <Icon className="w-6 h-6" />
        </a>
      ))}
    </aside>
  );
}

// ── Mobile Bottom Nav ────────────────────────────────────────────────────────
function MobileBottomNav() {
  const t = useT();
  const items = [
    { icon: BookOpenText, href: "#mission", labelEn: "Mission", labelHi: "उद्देश्य", active: true },
    { icon: Landmark, href: "#pillars", labelEn: "Pillars", labelHi: "स्तंभ" },
    { icon: LayoutGrid, href: "#dimensions", labelEn: "Dimensions", labelHi: "आयाम" },
    { icon: Users, href: "#social", labelEn: "Social", labelHi: "सामाजिक" },
  ];
  return (
    <footer className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-end px-6 py-4 bg-[#faf9f6]/95 backdrop-blur-2xl z-50 rounded-t-[2.5rem] border-t border-[#f57c00]/20 shadow-[0_-15px_40px_rgba(150,73,0,0.08)]">
      {items.map(({ icon: Icon, href, labelEn, labelHi, active }) => (
        <a
          key={labelEn}
          href={href}
          className={
            active
              ? "flex flex-col items-center justify-center bg-gradient-to-br from-[#964900] to-[#f57c00] text-white rounded-2xl px-5 py-2 shadow-lg shadow-[#f57c00]/20 -translate-y-1 transition-all duration-500"
              : "flex flex-col items-center justify-center text-[#636262] px-5 py-2 opacity-70 hover:text-[#964900] hover:opacity-100 hover:scale-110 transition-all duration-500"
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-[10px] uppercase font-extrabold tracking-[0.15em] mt-1">
            {t(labelEn, labelHi)}
          </span>
        </a>
      ))}
    </footer>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Parichay() {
  return (
    <div
      className="bg-[#faf9f6] text-[#1a1c1a] overflow-x-hidden min-h-screen"
      style={{ fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif" }}
    >
      <TopAppBar />
      <main className="pt-20 md:pr-20">
        <Hero />
        <CoreObjectives />
        <ActionPillars />
        <Dimensions />
        <SocialTransformation />
        <CallToAction />
      </main>
      <SideRail />
      <MobileBottomNav />
    </div>
  );
}
