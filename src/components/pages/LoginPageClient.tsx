"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, KeyRound, Loader2, LogIn, ShieldCheck } from "lucide-react";

import { PragyaLogo } from "@/components/PragyaLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { canAccessPathForPrimaryRole, getRoleLandingPath } from "@/lib/app/role-routing";
import { LOCAL_ADMIN_QUICK_FILL } from "@/lib/auth/dev-quick-fill";
import type { RoleCode } from "@/lib/permissions/types";
import { cn } from "@/lib/utils";

function LoginForm() {
  const searchParams = useSearchParams();
  const requestedReturnTo = searchParams.get("returnTo");
  const { lang, setLang } = useAppContext();
  const isHi = lang === "hi";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [flip, setFlip] = useState<"en" | "hi">("en");
  useEffect(() => {
    const id = setInterval(() => setFlip((v) => (v === "en" ? "hi" : "en")), 3800);
    return () => clearInterval(id);
  }, []);

  const copy = isHi
    ? {
        language: "भाषा",
        scope: "भोपाल विभाग",
        heroSeal: "आंतरिक संस्थागत प्रणाली",
        title: "प्रज्ञा प्रवाह",
        tagline: "सभ्यतागत चिंतन, संगठित कार्य।",
        description: "आंतरिक समीक्षा, समन्वय और प्रकाशन के लिए शांत, भूमिका-आधारित ERP प्रवेशद्वार।",
        highlights: ["भोपाल पायलट", "आंतरिक ERP", "भूमिका-अनुसार प्रवेश"],
        panelSeal: "सुरक्षित प्रवेश",
        panelTitle: "आंतरिक प्रवेश पैनल",
        panelDescription: "अपने निर्धारित खाते से लॉगिन करें और सीधे अपने कार्यक्षेत्र में जाएँ।",
        emailLabel: "ईमेल",
        emailPlaceholder: "aap@example.com",
        passwordLabel: "पासवर्ड",
        passwordPlaceholder: "पासवर्ड दर्ज करें",
        invalidCredentials: "अमान्य लॉगिन विवरण",
        genericError: "कुछ गड़बड़ हुई। कृपया फिर प्रयास करें।",
        signIn: "लॉगिन करें",
        signingIn: "लॉगिन हो रहा है...",
        quickFill: "Fill local admin",
        internalOnly: "परीक्षण",
        guideTitle: "मोबाइल उपयोग मार्गदर्शिका",
        guideDescription: "क्लाइंट हेतु द्विभाषी गाइड।",
        guideCta: "गाइड खोलें",
      }
    : {
        language: "Language",
        scope: "Bhopal Vibhag",
        heroSeal: "Internal institutional console",
        title: "Pragya Pravah",
        tagline: "Civilisational thought, organised action.",
        description: "A calm, role-aware ERP entry for internal review, coordination, and publication.",
        highlights: ["Bhopal pilot", "Internal ERP", "Role-aware access"],
        panelSeal: "Secure access",
        panelTitle: "Internal access panel",
        panelDescription: "Sign in with your assigned account and open the correct ERP workspace for your role.",
        emailLabel: "Email",
        emailPlaceholder: "you@example.com",
        passwordLabel: "Password",
        passwordPlaceholder: "Enter password",
        invalidCredentials: "Invalid credentials",
        genericError: "Something went wrong. Please try again.",
        signIn: "Sign In",
        signingIn: "Signing in...",
        quickFill: "लोकल एडमिन भरें",
        internalOnly: "Testing",
        guideTitle: "Mobile user guide",
        guideDescription: "Share the bilingual guide with the client.",
        guideCta: "Open guide",
      };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          (typeof data?.error === "string" ? data.error : data?.error?.message) ||
          data?.message ||
          copy.invalidCredentials;
        setError(message);
        setLoading(false);
        return;
      }

      const authPayload = data?.data ?? data;

      // If first-time login, force profile setup
      if (authPayload?.requiresPasswordChange) {
        window.location.replace("/setup-profile");
        return;
      }

      const roleCodes = (
        Array.isArray(authPayload?.effectiveRoleCodes)
          ? authPayload.effectiveRoleCodes
          : [authPayload?.primaryRoleCode]
      ).filter(Boolean) as RoleCode[];

      const primaryRoleCode = authPayload?.primaryRoleCode as RoleCode | undefined;
      const roleLandingPath = getRoleLandingPath(roleCodes, primaryRoleCode);
      const rawReturn = requestedReturnTo?.trim() ?? "";
      const useRoleLanding =
        !rawReturn || rawReturn === "/" || rawReturn === "/parichay" || rawReturn.startsWith("/parichay?");
      const destination = new URL(useRoleLanding ? roleLandingPath : rawReturn, window.location.origin);

      if (destination.origin !== window.location.origin) {
        destination.pathname = roleLandingPath;
        destination.search = "";
        destination.hash = "";
      }

      if (!canAccessPathForPrimaryRole(destination.pathname, primaryRoleCode)) {
        destination.pathname = roleLandingPath;
        destination.search = "";
        destination.hash = "";
      }

      destination.searchParams.set("loginAt", String(Date.now()));
      window.location.replace(`${destination.pathname}${destination.search}${destination.hash}`);
    } catch {
      setError(copy.genericError);
      setLoading(false);
    }
  }

  return (
    <div lang={isHi ? "hi" : "en"} className="login-editorial-bg min-h-screen px-4 py-5 sm:px-6 md:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="login-editorial-rail">
          <p className="section-seal">{copy.scope}</p>

          <div className="login-editorial-lang" role="group" aria-label={copy.language}>
            <span className="text-muted-foreground">{copy.language}</span>
            <div className="flex rounded-full bg-muted p-1">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "rounded-full px-3 py-1.5 transition-colors",
                  !isHi ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={!isHi}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("hi")}
                className={cn(
                  "rounded-full px-3 py-1.5 font-devanagari transition-colors",
                  isHi ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={isHi}
              >
                हिंदी
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.04fr)_minmax(21rem,29rem)] lg:items-start xl:gap-10">
          <section className="space-y-5">
            <div className="login-editorial-hero relative overflow-hidden">
              <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

              <div className="relative flex items-start gap-4">
                <span className="relative inline-flex items-center justify-center h-14 w-14 md:h-16 md:w-16 shrink-0">
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-primary/25 blur-md"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="relative inline-flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-[1.1rem] bg-gradient-to-br from-saffron-light via-primary to-saffron-deep shadow-[0_16px_28px_-18px_hsl(var(--saffron-deep)/0.65)] ring-1 ring-primary/20">
                    <PragyaLogo className="h-10 w-10 md:h-12 md:w-12 drop-shadow-[0_1px_1px_rgba(0,0,0,0.2)]" />
                  </span>
                  <span className="absolute -right-0.5 -top-0.5 inline-flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                  </span>
                </span>

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-col leading-none">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.32em] text-muted-foreground">
                      {copy.heroSeal}
                    </span>
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary/80">
                      Bharat · भारत
                    </span>
                  </div>

                  <div
                    data-testid="login-bilingual-title"
                    className="relative block min-h-16 md:min-h-24 overflow-visible"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {flip === "en" ? (
                        <motion.h1
                          key="en"
                          className="block font-sans text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground whitespace-nowrap"
                          initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
                          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                          exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
                          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                        >
                          Pragya Pravah
                        </motion.h1>
                      ) : (
                        <motion.h1
                          key="hi"
                          className="block text-4xl md:text-6xl font-bold leading-[1.08] tracking-tight text-foreground whitespace-nowrap font-devanagari"
                          initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
                          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                          exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
                          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                          lang="hi"
                        >
                          प्रज्ञा प्रवाह
                        </motion.h1>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="relative h-[2px] w-48 overflow-hidden rounded-full bg-primary/15">
                    <motion.span
                      className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              <div className="relative space-y-3 pt-1">
                <p className={cn("max-w-2xl text-lg font-medium text-foreground/88 md:text-2xl", isHi && "font-devanagari")}>
                  {copy.tagline}
                </p>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">{copy.description}</p>
              </div>

              <div className="relative flex flex-wrap gap-2 pt-2">
                {copy.highlights.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center rounded-full border border-primary/20 bg-background/72 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-[0_2px_10px_-6px_hsl(var(--saffron-deep)/0.4)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <Card className="login-editorial-card mx-auto w-full max-w-xl border-none">
            <CardHeader className="space-y-4 border-b border-border/60 pb-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="shell-copy">{copy.panelSeal}</p>
                  <h2 className={cn("text-2xl font-semibold tracking-tight md:text-[2rem]", isHi && "font-devanagari")}>
                    {copy.panelTitle}
                  </h2>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">{copy.panelDescription}</p>
            </CardHeader>

            <CardContent className="space-y-6 pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{copy.emailLabel}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={copy.emailPlaceholder}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="h-11 rounded-xl border-border/70 bg-background/88"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{copy.passwordLabel}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={copy.passwordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-11 rounded-xl border-border/70 bg-background/88"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full px-3 text-xs"
                    disabled={loading}
                    onClick={() => {
                      setEmail(LOCAL_ADMIN_QUICK_FILL.email);
                      setPassword(LOCAL_ADMIN_QUICK_FILL.password);
                    }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    {copy.quickFill}
                  </Button>
                </div>

                {error ? (
                  <div className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  {loading ? copy.signingIn : copy.signIn}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPageClient() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

