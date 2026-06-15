"use client";

import Link from "next/link";
import {
  ExternalLink,
  Globe,
  LogIn,
  MessageSquareShare,
  RefreshCcw,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import { PragyaLogo } from "@/components/PragyaLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

const APP_ENTRY_PATH = "/";

const englishSteps = [
  "Open the site link in Chrome, Safari, or your mobile browser.",
  "The login page opens first.",
  "Enter the ID and password shared by the admin.",
  "Tap Sign In and your role-based page opens automatically.",
];

const hindiSteps = [
  "साइट लिंक को Chrome, Safari या अपने मोबाइल browser में खोलें।",
  "सबसे पहले login page खुलेगा।",
  "Admin द्वारा दिया गया ID और password डालें।",
  "Sign In दबाएँ और आपका role वाला page अपने आप खुल जाएगा।",
];

const englishTroubleshooting = [
  "If the screen turns white, close the tab and open the link again in a new tab.",
  "If needed, try once in Incognito or Private mode.",
  "Refresh after the internet becomes stable.",
  "If Hindi text looks wrong, refresh once and send a screenshot to support.",
];

const hindiTroubleshooting = [
  "अगर screen white हो जाए, tab बंद करके लिंक नई tab में फिर से खोलें।",
  "जरूरत हो तो एक बार Incognito या Private mode में खोलें।",
  "Internet stable होने पर refresh करें।",
  "अगर Hindi text सही न दिखे, एक screenshot support को भेजें।",
];

const englishRoles = [
  "Super Admin — manages the full system and user access.",
  "Vibhag Pramukh — sees overview, approvals, and coordination.",
  "Aayam Pramukh — reviews work for the assigned Aayam.",
  "Unit Head — creates and manages unit-level work.",
  "Karyakarta — contributes work with limited access.",
];

const hindiRoles = [
  "Super Admin — पूरे सिस्टम और user access को manage करता है।",
  "Vibhag Pramukh — overview, approvals और coordination देखता है।",
  "Aayam Pramukh — अपने assigned Aayam का review करता है।",
  "Unit Head — unit level का काम create और manage करता है।",
  "Karyakarta — limited access के साथ काम contribute करता है।",
];

export default function ClientGuidePage() {
  const { lang, setLang } = useAppContext();
  const isHi = lang === "hi";

  const copy = {
    eyebrow: isHi ? "मोबाइल हेतु त्वरित मार्गदर्शिका" : "Quick mobile guide",
    title: isHi ? "क्लाइंट के लिए आसान उपयोग निर्देश" : "Easy client instructions",
    body: isHi
      ? "यह page client के साथ सीधे share किया जा सकता है ताकि वह मोबाइल पर Pragya Pravah ERP आसानी से खोल सके।"
      : "This page can be shared directly with the client so they can open the Pragya Pravah ERP easily on mobile.",
    shareLink: isHi ? "शेयर करने वाला लिंक" : "Shareable link",
    openSite: isHi ? "साइट खोलें" : "Open site",
    openLogin: isHi ? "लॉगिन पेज खोलें" : "Open login page",
    whatsAppTitle: isHi ? "WhatsApp के लिए छोटा message" : "Short WhatsApp message",
    whatsAppBody: isHi
      ? "नमस्ते, Pragya Pravah ERP खोलने के लिए admin द्वारा share किया गया link Chrome/Safari में खोलें, login credentials डालें, और सिस्टम सीधे आपके काम वाले page पर खुल जाएगा।"
      : "Hello, please open the Pragya Pravah ERP link shared by the admin in Chrome/Safari, enter your login credentials, and the system will directly open your work page.",
    stepsTitle: isHi ? "मोबाइल पर कैसे चलाएँ" : "How to use on mobile",
    troubleTitle: isHi ? "अगर दिक्कत आए" : "If something goes wrong",
    rolesTitle: isHi ? "सीधी भूमिका समझ" : "Simple role understanding",
    languageTitle: isHi ? "भाषा बदलें" : "Switch language",
    languageBody: isHi
      ? "Client चाहे तो इसी page पर Hindi और English guide बदल सकता है।"
      : "The client can switch this guide between Hindi and English on the same page.",
    browserNote: isHi ? "कोई app install करने की जरूरत नहीं है।" : "No app installation is needed.",
  };

  const steps = isHi ? hindiSteps : englishSteps;
  const troubleshooting = isHi ? hindiTroubleshooting : englishTroubleshooting;
  const roles = isHi ? hindiRoles : englishRoles;

  return (
    <div className="space-y-6 md:space-y-8">
      <section className="institution-panel overflow-hidden border-none">
        <div className="grid gap-6 px-5 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-8">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] saffron-gradient ring-1 ring-primary/10 shadow-[0_24px_42px_-26px_hsl(27_100%_50%/0.85)]">
                <PragyaLogo className="h-11 w-11" />
              </div>
              <div className="space-y-2">
                <p className="section-seal">{copy.eyebrow}</p>
                <h1 className={cn("text-3xl font-semibold tracking-tight md:text-4xl", isHi && "font-devanagari")}>
                  {copy.title}
                </h1>
              </div>
            </div>

            <p className={cn("max-w-2xl text-sm leading-7 text-muted-foreground md:text-base", isHi && "font-devanagari")}>
              {copy.body}
            </p>

            <div className="rounded-3xl border border-primary/12 bg-primary/[0.045] px-4 py-4">
              <p className={cn("text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/80", isHi && "font-devanagari tracking-[0.12em]")}>
                {copy.shareLink}
              </p>
              <p className={cn("mt-2 text-sm font-medium", isHi && "font-devanagari")}>
                {isHi ? "Admin द्वारा share किया गया current deployment link उपयोग करें।" : "Use the current deployment link shared by the admin."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="rounded-full px-5">
                <Link href={APP_ENTRY_PATH} prefetch={false}>
                  <ExternalLink className="h-4 w-4" />
                  {copy.openSite}
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-5">
                <Link href="/login" prefetch={false}>
                  <LogIn className="h-4 w-4" />
                  {copy.openLogin}
                </Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/70 bg-background/80 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className={cn("flex items-center gap-2 text-lg", isHi && "font-devanagari")}>
                <MessageSquareShare className="h-4 w-4 text-primary" />
                {copy.whatsAppTitle}
              </CardTitle>
              <CardDescription className={cn(isHi && "font-devanagari")}>{copy.browserNote}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className={cn("rounded-2xl bg-muted/35 px-4 py-4 text-sm leading-7 text-foreground/88", isHi && "font-devanagari")}>
                {copy.whatsAppBody}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <GuideCard icon={Smartphone} title={copy.stepsTitle} items={steps} isHi={isHi} />
        <GuideCard icon={RefreshCcw} title={copy.troubleTitle} items={troubleshooting} isHi={isHi} />
        <GuideCard icon={ShieldCheck} title={copy.rolesTitle} items={roles} isHi={isHi} />
      </div>

      <section className="institution-panel-muted flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="space-y-1">
          <p className="shell-copy">{copy.languageTitle}</p>
          <p className={cn("text-sm text-muted-foreground", isHi && "font-devanagari")}>{copy.languageBody}</p>
        </div>
        <div className="flex items-center rounded-full bg-background p-1 shadow-sm ring-1 ring-border/70">
          <button
            type="button"
            onClick={() => setLang("en")}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-semibold transition-colors",
              !isHi ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLang("hi")}
            className={cn(
              "rounded-full px-3 py-1.5 font-devanagari text-sm font-semibold transition-colors",
              isHi ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            हिंदी
          </button>
        </div>
      </section>
    </div>
  );
}

function GuideCard({
  icon: Icon,
  title,
  items,
  isHi,
}: {
  icon: typeof Globe;
  title: string;
  items: string[];
  isHi: boolean;
}) {
  return (
    <Card className="border-border/70 bg-background/75 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle className={cn("flex items-center gap-2 text-lg", isHi && "font-devanagari")}>
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm leading-6 text-foreground/88">
          {items.map((item, index) => (
            <li key={item} className="flex gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {index + 1}
              </span>
              <span className={cn(isHi && "font-devanagari")}>{item}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
