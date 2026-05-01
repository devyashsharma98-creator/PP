"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  BookOpenText,
  Users,
  CheckCircle2,
  ScrollText,
  Share2,
  ArrowRight,
  LayoutGrid,
  LogIn,
  Landmark,
  LogOut,
  Languages,
  Newspaper,
  Scale,
  History,
  type LucideIcon,
} from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { useSignOut } from "@/hooks/use-sign-out";
import { getNavGroups } from "@/lib/app/navigation";
import { getRoleLandingPath } from "@/lib/app/role-routing";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PragyaLogo } from "@/components/PragyaLogo";
import { cn } from "@/lib/utils";
import {
  ARTICLE_PLACEHOLDER_ARTIFACTS,
  buildArticleShowcaseItems,
  type ArticleShowcaseItem,
  type PublicArticlesResponse,
} from "@/components/pages/parichay-articles";

type Workstream = {
  id: string;
  href: string;
  icon: LucideIcon;
  titleEn: string;
  titleHi: string;
  summaryEn: string;
  summaryHi: string;
  actionEn: string;
  actionHi: string;
};

type CredibilitySignal = {
  valueEn: string;
  valueHi: string;
  labelEn: string;
  labelHi: string;
  noteEn: string;
  noteHi: string;
};

type ParticipationPath = {
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
};

type FooterLinkGroup = {
  titleEn: string;
  titleHi: string;
  links: Array<{
    href: string;
    labelEn: string;
    labelHi: string;
  }>;
};

const WORKSTREAMS: Workstream[] = [
  {
    id: "aalekh",
    href: "/aalekh",
    icon: BookOpenText,
    titleEn: "Aalekh",
    titleHi: "आलेख",
    summaryEn: "Publication desk for essays, research notes, and review-ready article drafting.",
    summaryHi: "दीर्घ लेखन, शोध टिप्पणी और प्रकाशन-योग्य वैचारिक सामग्री।",
    actionEn: "Open publication desk",
    actionHi: "लेखन कक्ष देखें",
  },
  {
    id: "prachar",
    href: "/prachar",
    icon: Share2,
    titleEn: "Prachar",
    titleHi: "प्रचार",
    summaryEn: "Dissemination desk for campaign circulation, distribution discipline, and reach tracking.",
    summaryHi: "अभियान प्रसार, सार्वजनिक वितरण और पहुँच की उत्तरदायी व्यवस्था।",
    actionEn: "Review dissemination desk",
    actionHi: "प्रसार कार्य देखें",
  },
  {
    id: "vimarsh",
    href: "/vimarsh",
    icon: Users,
    titleEn: "Vimarsh",
    titleHi: "विमर्श",
    summaryEn: "Discourse desk for forums, review sessions, and study-led public discussion.",
    summaryHi: "सार्वजनिक क्षेत्र में विमर्श, संवाद और अध्ययन-आधारित चर्चा।",
    actionEn: "Open discourse desk",
    actionHi: "विमर्श देखें",
  },
  {
    id: "vritt",
    href: "/dashboard",
    icon: ScrollText,
    titleEn: "Vritt",
    titleHi: "वृत्त",
    summaryEn: "Reporting desk for event records, attendance updates, and operational follow-through.",
    summaryHi: "संस्थागत वृत्त, आयोजन-लय और सार्वजनिक कार्य का संक्षिप्त अभिलेख।",
    actionEn: "Review reporting desk",
    actionHi: "कार्य-वृत्त देखें",
  },
];

const CREDIBILITY_SIGNALS: CredibilitySignal[] = [
  {
    valueEn: "4",
    valueHi: "४",
    labelEn: "Integrated public workstreams",
    labelHi: "एकीकृत सार्वजनिक कार्य-प्रवाह",
    noteEn: "Publication, dissemination, discourse, and reporting are organized on one institutional surface.",
    noteHi: "लेखन, प्रसार, विमर्श और वृत्त एक ही संस्थागत पटल पर संचालित होते हैं।",
  },
  {
    valueEn: "Bilingual",
    valueHi: "द्विभाषी",
    labelEn: "Public communication format",
    labelHi: "सार्वजनिक संप्रेषण प्रारूप",
    noteEn: "English and Hindi remain visible together across headings, labels, and public descriptions.",
    noteHi: "अंग्रेज़ी और हिंदी साथ उपस्थित हैं, पर पूरा पृष्ठ पंक्ति-दर-पंक्ति दोहराया नहीं जाता।",
  },
  {
    valueEn: "Continuous",
    valueHi: "निरंतर",
    labelEn: "Editorial to field rhythm",
    labelHi: "संपादकीय से क्षेत्र-कार्य लय",
    noteEn: "Review, approval, publication, and field follow-through remain connected across the cycle.",
    noteHi: "शोध, विमर्श, प्रकाशन और क्षेत्रीय अनुवर्तन एक-दूसरे से जुड़े रहते हैं।",
  },
];

const PARTICIPATION_PATHS: ParticipationPath[] = [
  {
    titleEn: "Review public output",
    titleHi: "अध्ययन और योगदान",
    bodyEn: "Begin with current articles, dissemination material, discussion themes, and published field reports.",
    bodyHi: "प्रकाशित सामग्री, वर्तमान विषयों और लेखन-आधारित सार्वजनिक कार्य से आरम्भ करें।",
  },
  {
    titleEn: "Connect with a workstream",
    titleHi: "कार्य-प्रवाह से जुड़ें",
    bodyEn: "Move into Aalekh, Prachar, Vimarsh, or Vritt according to your institutional role and working context.",
    bodyHi: "अपने कार्य-संदर्भ के अनुसार आलेख, विमर्श, प्रचार या वृत्त से जुड़ें।",
  },
  {
    titleEn: "Use member access",
    titleHi: "संस्थागत कक्ष में प्रवेश",
    bodyEn: "Existing karyakartas and members can enter the console directly for ongoing work, review, and reporting.",
    bodyHi: "विद्यमान कार्यकर्ता और सदस्य बिना विपणन-शैली पृष्ठ से गुज़रे सीधे प्रवेश कर सकते हैं।",
  },
];

const FOOTER_LINK_GROUPS: FooterLinkGroup[] = [
  {
    titleEn: "Workstreams",
    titleHi: "कार्य-प्रवाह",
    links: WORKSTREAMS.map((stream) => ({
      href: stream.href,
      labelEn: stream.titleEn,
      labelHi: stream.titleHi,
    })),
  },
  {
    titleEn: "Public paths",
    titleHi: "सार्वजनिक पथ",
    links: [
      { href: "/parichay", labelEn: "Parichay", labelHi: "परिचय" },
      { href: "/vimarsh", labelEn: "Vimarsh", labelHi: "विमर्श" },
      { href: "/login", labelEn: "Sign In", labelHi: "प्रवेश" },
    ],
  },
];

function usePublicArticleArtifacts() {
  const [items, setItems] = useState<ArticleShowcaseItem[]>(ARTICLE_PLACEHOLDER_ARTIFACTS);
  const [hasPublishedArticles, setHasPublishedArticles] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPublishedArticles() {
      try {
        const response = await fetch("/api/public/articles?limit=3", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as PublicArticlesResponse;
        const articles = buildArticleShowcaseItems(payload.data);

        if (!cancelled && articles !== ARTICLE_PLACEHOLDER_ARTIFACTS) {
          setItems(articles);
          setHasPublishedArticles(true);
        }
      } catch {
        // Keep placeholder items when public content is unavailable.
      }
    }

    loadPublishedArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    items,
    hasPublishedArticles,
    featuredItem: items[0],
  };
}

function BrandMark() {
  return (
    <Link href="/parichay" className="group flex min-w-0 items-center gap-3" aria-label="Pragya Pravah Home">
      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <PragyaLogo className="h-7 w-7" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary/80">
          Pragya Pravah
        </span>
        <span className="font-serif text-lg font-semibold text-parchment-ink" lang="hi">
          प्रज्ञा प्रवाह
        </span>
      </span>
    </Link>
  );
}

function TopAppBar() {
  const { lang, setLang, isAuthenticated, viewer, permissions } = useAppContext();
  const t = useT();
  const signOut = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);

  const showAdminControls =
    permissions.canManageUsers ||
    Boolean(viewer?.effectiveRoles?.some((role) => role === "super_admin" || role === "org_admin"));
  const navigationGroups = useMemo(
    () => getNavGroups(showAdminControls, viewer?.primaryRoleCode ? [viewer.primaryRoleCode] : null),
    [showAdminControls, viewer?.primaryRoleCode],
  );
  const landingPath = getRoleLandingPath(viewer?.effectiveRoles ?? null, viewer?.primaryRoleCode ?? null);

  return (
    <header className="fixed top-0 z-50 h-20 w-full border-b border-primary/15 bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center gap-4 px-6 md:px-8">
        <div className="flex min-w-0 items-center gap-4">
          {isAuthenticated ? (
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="text-primary transition-colors hover:text-foreground"
                  aria-label={t("Open navigation menu", "नेविगेशन मेनू खोलें")}
                >
                  <Menu className="h-6 w-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] border-r border-primary/15 bg-background p-0">
                <SheetTitle className="sr-only">{t("Navigation", "नेविगेशन")}</SheetTitle>
                <SheetDescription className="sr-only">
                  {t("Primary navigation links.", "मुख्य नेविगेशन लिंक।")}
                </SheetDescription>
                <div className="border-b border-primary/15 px-6 py-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-primary/70">
                    {t("Pragya Pravah", "प्रज्ञा प्रवाह")}
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-bold text-parchment-ink">
                    {t("Parichay", "परिचय")}
                  </h2>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                  {navigationGroups.map((group) => (
                    <div key={group.title} className="mb-4 space-y-1">
                      <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.22em] text-primary/70">
                        {t(group.title, group.titleHi)}
                      </p>
                      {group.items.map((item) => (
                        <Link
                          key={item.path}
                          href={item.path}
                          prefetch={false}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        >
                          <item.icon className="h-4 w-4 shrink-0 text-primary" />
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
                    className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-parchment-accent transition-colors hover:bg-parchment-accent-soft"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("Sign out", "निकास")}
                  </button>
                </nav>
              </SheetContent>
            </Sheet>
          ) : null}
          <BrandMark />
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-6 text-xs font-bold uppercase tracking-[0.22em] text-primary/80 xl:flex">
          <a href="#mission" className="transition-colors hover:text-parchment-ink">
            {t("Mission", "ध्येय")}
          </a>
          <a href="#workstreams" className="transition-colors hover:text-parchment-ink">
            {t("Workstreams", "कार्य-प्रवाह")}
          </a>
          <a href="#current-work" className="transition-colors hover:text-parchment-ink">
            {t("Current Work", "वर्तमान कार्य")}
          </a>
          <a href="#participate" className="transition-colors hover:text-parchment-ink">
            {t("Participation", "सहभागिता")}
          </a>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <button
            onClick={() => setLang(lang === "hi" ? "en" : "hi")}
            className="inline-flex items-center gap-1.5 rounded-xl border border-primary/15 px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-accent"
            aria-label={t("Toggle language", "भाषा बदलें")}
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "hi" ? "EN" : "हिं"}
          </button>
          {isAuthenticated ? (
            <Link
              href={landingPath}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label={t("Enter Console", "कार्यक्षेत्र में प्रवेश")}
            >
              <LayoutGrid className="h-4 w-4" />
              <span>{t("Enter Console", "कार्यक्षेत्र")}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90"
              aria-label={t("Sign In", "प्रवेश")}
            >
              <LogIn className="h-4 w-4" />
              <span>{t("Sign In", "प्रवेश")}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function SectionHeading({
  eyebrowEn,
  eyebrowHi,
  titleEn,
  titleHi,
  bodyEn,
  bodyHi,
}: {
  eyebrowEn: string;
  eyebrowHi: string;
  titleEn: string;
  titleHi: string;
  bodyEn: string;
  bodyHi: string;
}) {
  const t = useT();

  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
        {t(eyebrowEn, eyebrowHi)}
      </p>
      <h2 className="font-serif text-4xl leading-tight text-parchment-ink md:text-5xl">
        {t(titleEn, titleHi)}
      </h2>
      <p className="max-w-2xl text-base leading-7 text-foreground/80 md:text-lg">
        {t(bodyEn, bodyHi)}
      </p>
    </div>
  );
}

function EditorialVisual() {
  const t = useT();

  return (
    <div className="relative overflow-hidden border border-primary/20 bg-accent/55 p-5 md:p-6">
      <div className="grid gap-4">
        <div className="flex items-center justify-between border-b border-primary/15 pb-3 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
          <span>{t("Institutional Surface", "संपादकीय पटल")}</span>
          <span>{t("Public-facing", "सार्वजनिक")}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-3">
            <div className="border border-primary/15 bg-background/90 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                {t("Overview", "संयम")}
              </p>
              <p className="mt-3 font-serif text-2xl leading-tight text-parchment-ink">
                {t("Publication to public interface", "विचार से लोक-कार्य")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-primary/15 bg-background/80 p-4 text-sm text-foreground/80">
                {t("Review", "अध्ययन")}
              </div>
              <div className="border border-primary/15 bg-background/80 p-4 text-sm text-foreground/80">
                {t("Reporting", "विमर्श")}
              </div>
            </div>
          </div>
          <div className="relative min-h-[220px] border border-primary/35 bg-primary p-5 text-primary-foreground">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,241,232,0.08)_1px,transparent_1px),linear-gradient(rgba(247,241,232,0.08)_1px,transparent_1px)] bg-[size:32px_32px]" />
            <div className="relative grid h-full content-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground/75">
                  {t("Institutional rhythm", "संस्थागत लय")}
                </p>
                <p className="mt-3 max-w-sm font-serif text-3xl leading-tight">
                  {t("Serious public work depends on review discipline, publication flow, and operational memory.", "गंभीर लोक-कार्य को संपादकीय स्पष्टता और संस्थागत स्मृति चाहिए।")}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground/90">
                <span className="border border-primary-foreground/30 px-3 py-2">{t("Aalekh", "आलेख")}</span>
                <span className="border border-primary-foreground/30 px-3 py-2">{t("Prachar", "प्रचार")}</span>
                <span className="border border-primary-foreground/30 px-3 py-2">{t("Vimarsh", "विमर्श")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WorkstreamRail() {
  const t = useT();

  return (
    <div className="border border-primary/20 bg-background/95">
      <div className="border-b border-primary/15 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-primary">
          {t("Workstreams", "कार्य-प्रवाह")}
        </p>
      </div>
      <div>
        {WORKSTREAMS.map((stream) => {
          const Icon = stream.icon;

          return (
            <Link
              key={stream.id}
              href={stream.href}
              className="grid gap-3 border-b border-primary/10 px-5 py-5 transition-colors hover:bg-accent/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h3 className="font-serif text-2xl text-parchment-ink">
                      {t(stream.titleEn, stream.titleHi)}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-6 text-foreground/75">
                      {t(stream.summaryEn, stream.summaryHi)}
                    </p>
                  </div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80">
                {t(stream.actionEn, stream.actionHi)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ArticleShowcaseArtifact({
  items,
  hasPublishedArticles,
}: {
  items: ArticleShowcaseItem[];
  hasPublishedArticles: boolean;
}) {
  const t = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex % items.length];

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 4200);

    return () => clearInterval(id);
  }, [items.length]);

  return (
    <div
      aria-label="Approved article showcase"
      className="border border-primary/20 bg-background text-foreground"
    >
      <div className="flex items-center justify-between border-b border-primary/15 px-5 py-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
            {t("Approved Article Showcase", "प्रकाशन योग्य आलेख")}
          </p>
          <p className="mt-1 text-sm text-foreground/70">
            {hasPublishedArticles
              ? t("Approved articles live", "स्वीकृत आलेख उपलब्ध")
              : t("Awaiting approved articles", "स्वीकृत आलेख प्रतीक्षित")}
          </p>
        </div>
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
          <Newspaper className="h-5 w-5" />
        </span>
      </div>

      <div className="p-5">
        <AnimatePresence mode="wait" initial={false}>
          <motion.article
            key={activeItem.titleEn}
            className="space-y-5"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t(activeItem.laneEn, activeItem.laneHi)}
              </span>
              <span className="text-xs font-semibold text-primary/70">
                {String(activeIndex + 1).padStart(2, "0")}/{String(items.length).padStart(2, "0")}
              </span>
            </div>

            <div>
              <h3 className="font-serif text-2xl leading-tight text-parchment-ink">
                {t(activeItem.titleEn, activeItem.titleHi)}
              </h3>
              <p className="mt-3 text-sm leading-7 text-foreground/75">
                {t(activeItem.excerptEn, activeItem.excerptHi)}
              </p>
            </div>

            <div className="grid gap-3 border-t border-primary/10 pt-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
                  {t("Contributor", "योगदानकर्ता")}
                </p>
                <p className="mt-1 font-serif text-lg text-primary">
                  {t(activeItem.authorEn, activeItem.authorHi)}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeItem.channels.map((channel) => (
                  <span
                    key={channel}
                    className="inline-flex items-center gap-1.5 border border-primary/15 bg-accent/35 px-3 py-1 text-[11px] font-semibold text-foreground/75"
                  >
                    <Share2 className="h-3 w-3 text-primary" />
                    {channel}
                  </span>
                ))}
              </div>
              <div className="flex gap-2" aria-hidden>
                {items.map((item, index) => (
                  <span
                    key={item.titleEn}
                    className={cn(
                      "h-1.5 flex-1 rounded-full transition-colors",
                      index === activeIndex ? "bg-primary" : "bg-primary/20",
                    )}
                  />
                ))}
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProofBand({
  featuredItem,
  items,
  hasPublishedArticles,
}: {
  featuredItem: ArticleShowcaseItem;
  items: ArticleShowcaseItem[];
  hasPublishedArticles: boolean;
}) {
  const t = useT();

  return (
    <div className="grid gap-6 border-t border-primary/15 pt-8 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
      <div className="border border-primary/20 bg-accent/45 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
          {t("Featured Output", "प्रमुख प्रकाशन")}
        </p>
        <h3 className="mt-4 font-serif text-2xl leading-tight text-parchment-ink">
          {t(featuredItem.titleEn, featuredItem.titleHi)}
        </h3>
        <p className="mt-3 text-sm leading-7 text-foreground/75">
          {t(featuredItem.excerptEn, featuredItem.excerptHi)}
        </p>
        <div className="mt-5 border-t border-primary/10 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">
            {t("Current lane", "वर्तमान प्रवाह")}
          </p>
          <p className="mt-2 text-sm font-semibold text-primary">
            {t(featuredItem.laneEn, featuredItem.laneHi)}
          </p>
        </div>
      </div>

      <div className="border border-primary/20 bg-accent/45 p-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
          {t("Institutional Signals", "संस्थागत संकेत")}
        </p>
        <div className="mt-5 space-y-5">
          {CREDIBILITY_SIGNALS.slice(0, 2).map((signal) => (
            <div key={signal.labelEn} className="border-t border-primary/10 pt-4 first:border-t-0 first:pt-0">
              <p className="font-serif text-3xl text-parchment-ink">
                {t(signal.valueEn, signal.valueHi)}
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                {t(signal.labelEn, signal.labelHi)}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground/75">
                {t(signal.noteEn, signal.noteHi)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <ArticleShowcaseArtifact items={items} hasPublishedArticles={hasPublishedArticles} />
    </div>
  );
}

function Hero({
  featuredItem,
  items,
  hasPublishedArticles,
}: {
  featuredItem: ArticleShowcaseItem;
  items: ArticleShowcaseItem[];
  hasPublishedArticles: boolean;
}) {
  const t = useT();

  return (
    <section id="mission" className="bg-accent/35 px-6 pb-16 pt-12 md:px-10 md:pb-24 lg:px-14">
      <div className="mx-auto max-w-7xl border border-primary/20 bg-background/95 px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">
                {t("Institutional overview", "विचार और लोक-कार्य का प्रवाह")}
              </p>
              <h1 className="max-w-4xl font-serif text-5xl leading-[0.95] text-parchment-ink md:text-7xl">
                Institutional overview of Pragya Pravah workstreams.
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-foreground/82" lang="hi">
                प्रज्ञा प्रवाह के कार्य-प्रवाहों का सार्वजनिक संस्थागत अवलोकन।
              </p>
              <p className="max-w-3xl text-base leading-7 text-foreground/82 md:text-lg">
                {t(
                  "Public interface for publication, dissemination, discourse, and reporting.",
                  "प्रज्ञा प्रवाह लेखन, प्रसार, विमर्श और संस्थागत वृत्त को एक संयत सार्वजनिक पटल पर एकत्र करता है।",
                )}
              </p>
              <p className="max-w-3xl text-sm leading-7 text-foreground/70 md:text-base">
                {t(
                  "This page presents the institution through its operating domains, current public output, and access paths for contributors and members.",
                  "यह पृष्ठ संस्था को उसके कार्य-क्षेत्र, वर्तमान सार्वजनिक सामग्री और योगदानकर्ताओं एवं सदस्यों के प्रवेश-पथ के माध्यम से प्रस्तुत करता है।",
                )}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="#workstreams"
                className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <span>{t("Explore Work", "कार्य प्रवाह देखें")}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 border border-primary/20 bg-background px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-accent"
              >
                {t("Sign In", "प्रवेश")}
              </Link>
            </div>

            <EditorialVisual />
          </div>

          <WorkstreamRail />
        </div>

        <ProofBand featuredItem={featuredItem} items={items} hasPublishedArticles={hasPublishedArticles} />
      </div>
    </section>
  );
}

function WorkstreamsSection() {
  const t = useT();

  return (
    <section id="workstreams" className="bg-background px-6 py-20 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrowEn="Workstream overview"
          eyebrowHi="सार्वजनिक कार्य-क्षेत्र"
          titleEn="Core public workstreams"
          titleHi="यहाँ कार्य-प्रवाह पहले दिखाई देते हैं।"
          bodyEn="Each workstream describes a visible institutional function: publication, dissemination, discourse, or reporting."
          bodyHi="पहली बार आने वाला व्यक्ति संस्था को उसके सार्वजनिक कार्य से समझे, न कि सॉफ़्टवेयर मॉड्यूल या सामान्य घोषणाओं से।"
        />
        <div className="grid gap-px bg-primary/15 md:grid-cols-2">
          {WORKSTREAMS.map((stream) => {
            const Icon = stream.icon as ComponentType<{ className?: string }>;

            return (
              <Link
                key={stream.id}
                href={stream.href}
                className="grid gap-5 bg-background p-7 transition-colors hover:bg-accent/55"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-serif text-3xl text-parchment-ink">
                    {t(stream.titleEn, stream.titleHi)}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-7 text-foreground/75">
                    {t(stream.summaryEn, stream.summaryHi)}
                  </p>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary/80">
                  {t(stream.actionEn, stream.actionHi)}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturedOutputSection({ featuredItem }: { featuredItem: ArticleShowcaseItem }) {
  const t = useT();

  return (
    <section id="current-work" className="bg-accent/35 px-6 py-20 md:px-10 lg:px-14">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <SectionHeading
          eyebrowEn="Public output"
          eyebrowHi="वर्तमान कार्य"
          titleEn="Current public output"
          titleHi="प्रमुख सार्वजनिक सामग्री केवल उद्देश्य नहीं, सक्रियता भी सिद्ध करे।"
          bodyEn="Recent publications and approved artifacts show the current rhythm of public work across the institution."
          bodyHi="इस पृष्ठ पर एक ऐसा वर्तमान उदाहरण होना चाहिए जो दिखाए कि शोध और सार्वजनिक कार्य दोनों सक्रिय हैं।"
        />
        <div className="grid gap-6">
          <div className="border border-primary/20 bg-background/95 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              {t("Featured output", "प्रमुख सामग्री")}
            </p>
            <h3 className="mt-4 font-serif text-3xl leading-tight text-parchment-ink">
              {t(featuredItem.titleEn, featuredItem.titleHi)}
            </h3>
            <p className="mt-4 text-base leading-7 text-foreground/75">
              {t(featuredItem.excerptEn, featuredItem.excerptHi)}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {featuredItem.channels.map((channel) => (
                <span
                  key={channel}
                  className="inline-flex items-center gap-1.5 border border-primary/15 bg-accent/35 px-3 py-1 text-[11px] font-semibold text-foreground/75"
                >
                  <Share2 className="h-3 w-3 text-primary" />
                  {channel}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-px bg-primary/15 md:grid-cols-2">
            <div className="bg-background/95 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                {t("Workstream lane", "संपादकीय प्रवाह")}
              </p>
              <p className="mt-3 font-serif text-2xl text-parchment-ink">
                {t(featuredItem.laneEn, featuredItem.laneHi)}
              </p>
            </div>
            <div className="bg-background/95 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
                {t("Contributor", "योगदानकर्ता")}
              </p>
              <p className="mt-3 font-serif text-2xl text-parchment-ink">
                {t(featuredItem.authorEn, featuredItem.authorHi)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CredibilitySection() {
  const t = useT();

  return (
    <section className="bg-background px-6 py-20 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrowEn="Institutional Credibility"
          eyebrowHi="संस्थागत विश्वसनीयता"
          titleEn="Institutional signals"
          titleHi="अधिकार-विश्वास संरचना और निरंतरता से निर्मित होता है।"
          bodyEn="These signals summarize how the platform keeps public output, bilingual communication, and follow-through connected."
          bodyHi="यह पृष्ठ इसलिए गंभीर लगे कि कार्य संरचित, वर्तमान और स्पष्ट है; केवल सजावटी आँकड़ों की भीड़ से नहीं।"
        />
        <div className="grid gap-px bg-primary/15 md:grid-cols-3">
          {CREDIBILITY_SIGNALS.map((signal) => (
            <div key={signal.labelEn} className="bg-background p-7">
              <p className="font-serif text-4xl text-parchment-ink">
                {t(signal.valueEn, signal.valueHi)}
              </p>
              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                {t(signal.labelEn, signal.labelHi)}
              </p>
              <p className="mt-4 text-sm leading-7 text-foreground/75">
                {t(signal.noteEn, signal.noteHi)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ParticipationSection() {
  const t = useT();
  const { isAuthenticated, viewer } = useAppContext();
  const landingPath = getRoleLandingPath(viewer?.effectiveRoles ?? null, viewer?.primaryRoleCode ?? null);
  const primaryHref = isAuthenticated ? landingPath : "/login";
  const primaryLabelEn = isAuthenticated ? "Enter Console" : "Sign In";
  const primaryLabelHi = isAuthenticated ? "कार्यक्षेत्र में प्रवेश" : "प्रवेश";

  return (
    <section id="participate" className="bg-accent/35 px-6 py-20 md:px-10 lg:px-14">
      <div className="mx-auto max-w-7xl space-y-12">
        <SectionHeading
          eyebrowEn="Participation"
          eyebrowHi="सहभागिता"
          titleEn="Participation and access"
          titleHi="सहभागिता, समझ के बाद आए।"
          bodyEn="Public visitors can review the workstreams first, while existing members can move directly into the console for active tasks."
          bodyHi="यह पृष्ठ सही अगले कदम का आमंत्रण दे, पर प्रथम पटल को भीड़भाड़ वाला या केवल प्रवेश-द्वार न बनाए।"
        />
        <div className="grid gap-px bg-primary/15 lg:grid-cols-[1fr_0.9fr]">
          <div className="grid gap-px bg-primary/15">
            {PARTICIPATION_PATHS.map((path) => (
              <div key={path.titleEn} className="bg-background/95 p-6">
                <h3 className="font-serif text-2xl text-parchment-ink">
                  {t(path.titleEn, path.titleHi)}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/75">
                  {t(path.bodyEn, path.bodyHi)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-between bg-primary p-8 text-primary-foreground">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary-foreground/75">
                {t("Next step", "अगला कदम")}
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-tight">
                {t("Use the public overview to identify the right workstream, then continue through the appropriate access path.", "पठन से कार्य की ओर एक स्पष्ट और संयत मार्ग से बढ़ें।")}
              </h3>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 bg-background px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-primary transition-colors hover:bg-accent"
              >
                {t(primaryLabelEn, primaryLabelHi)}
              </Link>
              <Link
                href="#workstreams"
                className="inline-flex items-center gap-2 border border-primary-foreground/30 px-5 py-3 text-sm font-bold uppercase tracking-[0.18em] text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("Explore Work", "कार्य प्रवाह देखें")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  const t = useT();

  return (
    <footer className="border-t border-primary/15 bg-background px-6 py-12 md:px-10 lg:px-14">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1fr_0.8fr_0.8fr]">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-md text-sm leading-7 text-foreground/75">
            {t(
              "Public institutional overview for publication, dissemination, discourse, and reporting.",
              "लेखन, विमर्श, प्रसार और क्षेत्रीय वृत्त के लिए एक सार्वजनिक संपादकीय एवं संस्थागत पटल।",
            )}
          </p>
        </div>
        {FOOTER_LINK_GROUPS.map((group) => (
          <div key={group.titleEn}>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              {t(group.titleEn, group.titleHi)}
            </p>
            <div className="mt-4 grid gap-3">
              {group.links.map((link) => (
                <Link key={`${group.titleEn}-${link.href}`} href={link.href} className="text-sm text-foreground/75 transition-colors hover:text-primary">
                  {t(link.labelEn, link.labelHi)}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </footer>
  );
}

function SideRail() {
  const items = [
    { icon: Landmark, href: "#mission", label: "Mission" },
    { icon: LayoutGrid, href: "#workstreams", label: "Workstreams" },
    { icon: Newspaper, href: "#current-work", label: "Current Work" },
    { icon: Users, href: "#participate", label: "Participation" },
    { icon: History, href: "/history", label: "History" },
  ];

  return (
    <aside className="fixed right-0 top-20 hidden h-[calc(100vh-5rem)] w-16 flex-col items-center gap-7 border-l border-parchment-rule bg-parchment-bg-soft py-8 lg:flex">
      {items.map(({ icon: Icon, href, label }) => (
        <a
          key={label}
          href={href}
          aria-label={label}
          className="text-parchment-ink-soft transition-colors hover:text-parchment-ink"
        >
          <Icon className="h-5 w-5" />
        </a>
      ))}
    </aside>
  );
}

function MobileBottomNav() {
  const t = useT();
  const items = [
    { icon: Landmark, href: "#mission", labelEn: "Mission", labelHi: "ध्येय" },
    { icon: LayoutGrid, href: "#workstreams", labelEn: "Work", labelHi: "कार्य" },
    { icon: Newspaper, href: "#current-work", labelEn: "Output", labelHi: "प्रकाशन" },
    { icon: Users, href: "#participate", labelEn: "Join", labelHi: "सहभागिता" },
  ];

  return (
    <footer className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-parchment-rule bg-parchment-bg-soft/95 px-3 py-3 backdrop-blur md:hidden">
      {items.map(({ icon: Icon, href, labelEn, labelHi }) => (
        <a
          key={labelEn}
          href={href}
          className="flex min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-parchment-ink-soft transition-colors hover:bg-parchment-bg-elev"
        >
          <Icon className="h-4.5 w-4.5" />
          <span className="text-[10px] font-bold uppercase tracking-[0.16em]">
            {t(labelEn, labelHi)}
          </span>
        </a>
      ))}
    </footer>
  );
}

export default function Parichay() {
  const { items, hasPublishedArticles, featuredItem } = usePublicArticleArtifacts();

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-parchment-bg text-parchment-ink"
      style={{ fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif" }}
    >
      <TopAppBar />
      <main className="pt-20">
        <Hero featuredItem={featuredItem} items={items} hasPublishedArticles={hasPublishedArticles} />
        <WorkstreamsSection />
        <FeaturedOutputSection featuredItem={featuredItem} />
        <CredibilitySection />
        <ParticipationSection />
        <LandingFooter />
      </main>
      <MobileBottomNav />
    </div>
  );
}
