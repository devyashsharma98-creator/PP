"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Flame, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAppContext } from "@/context/AppContext";

const DEMO_ACCOUNTS = [
  { label: "Super Admin", email: "demo.superadmin@example.com" },
  { label: "Vibhag Pramukh", email: "demo.vibhag@example.com" },
  { label: "Aayam Pramukh", email: "demo.aayam@example.com" },
  { label: "Unit Head", email: "demo.unithead@example.com" },
  { label: "Karyakarta", email: "demo.karyakarta@example.com" },
];

function LoginForm() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const { lang, setLang } = useAppContext();
  const isHi = lang === "hi";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          (typeof data?.error === "string" ? data.error : data?.error?.message) ||
          data?.message ||
          "Invalid credentials";
        setError(message);
        setLoading(false);
        return;
      }

      // Force a full reload so the root app provider re-bootstraps with the new auth session.
      window.location.assign(returnTo);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("Password123!");
    setError("");
  }

  return (
    <div className="demo-bridge-bg min-h-screen px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <section className="space-y-6">
          <div className="demo-bridge-copy">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="section-seal">Bhopal Vibhag</p>
              <div className="flex rounded-full border border-border/70 bg-background/70 p-1 text-xs font-semibold shadow-sm">
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`rounded-full px-3 py-1.5 transition-colors ${!isHi ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  aria-pressed={!isHi}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang("hi")}
                  className={`rounded-full px-3 py-1.5 font-devanagari transition-colors ${isHi ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  aria-pressed={isHi}
                >
                  हिंदी
                </button>
              </div>
            </div>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl saffron-gradient shadow-lg shadow-primary/20">
                  <Flame className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="shell-copy">{isHi ? "आंतरिक संस्थागत प्रणाली" : "Internal institutional console"}</p>
                  <h1 className="text-3xl font-bold tracking-tight font-devanagari md:text-5xl">
                    {isHi ? "प्रज्ञा प्रवाह" : "Pragya Pravah"}
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-lg font-medium text-foreground/85 md:text-xl">
                {isHi ? "सभ्यतागत चिंतन, संगठित कार्य।" : "Civilisational thought, organised action."}
              </p>

              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                {isHi
                  ? "समीक्षा कतार, इकाई गतिविधि, आलेख प्रवाह और प्रचार समन्वय — सब एक आंतरिक प्रणाली में।"
                  : "Review queues, unit activity, aalekh workflow, and prachar coordination in one console designed for internal organisational use."}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="institution-panel-muted px-4 py-4">
              <p className="shell-copy">{isHi ? "संदर्भ" : "Context"}</p>
              <p className="mt-2 text-sm font-semibold">{isHi ? "भोपाल विभाग" : "Bhopal Vibhag"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isHi ? "क्षेत्रीय नेतृत्व और इकाई समन्वय।" : "Regional leadership and unit coordination."}
              </p>
            </div>
            <div className="institution-panel-muted px-4 py-4">
              <p className="shell-copy">{isHi ? "कार्यप्रवाह" : "Workflow"}</p>
              <p className="mt-2 text-sm font-semibold">{isHi ? "आंतरिक समीक्षा और प्रकाशन" : "Internal review and publication"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isHi ? "कार्यक्रम योजना से आलेख और प्रचार अनुवर्ती तक।" : "From event planning to aalekh and prachar follow-through."}
              </p>
            </div>
            <div className="institution-panel-muted px-4 py-4">
              <p className="shell-copy">{isHi ? "उपयोगकर्ता" : "Audience"}</p>
              <p className="mt-2 text-sm font-semibold">{isHi ? "आंतरिक परीक्षण हेतु डेमो खाते" : "Demo accounts for internal testing"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {isHi ? "हर भूमिका और स्तर को जल्दी देखने के लिए seeded roles उपयोग करें।" : "Use seeded roles to inspect each operational layer quickly."}
              </p>
            </div>
          </div>
        </section>

        <Card className="institution-panel mx-auto w-full max-w-xl border-none">
          <CardHeader className="space-y-4 border-b border-border/60 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="shell-copy">{isHi ? "सुरक्षित प्रवेश" : "Secure access"}</p>
                <h2 className="text-2xl font-semibold tracking-tight">{isHi ? "आंतरिक प्रवेश पैनल" : "Internal access panel"}</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LogIn className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {isHi
                ? "अपने खाते से लॉगिन करें या डेमो प्रवाह देखने के लिए seeded role profile उपयोग करें।"
                : "Sign in with your assigned account or use a seeded role profile to review the demo flow."}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{isHi ? "ईमेल" : "Email"}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={isHi ? "aap@example.com" : "you@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{isHi ? "पासवर्ड" : "Password"}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isHi ? "पासवर्ड दर्ज करें" : "Enter password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? (isHi ? "लॉगिन हो रहा है..." : "Signing in...") : isHi ? "लॉगिन करें" : "Sign In"}
              </Button>
            </form>

            <div className="space-y-3 border-t border-border/60 pt-5">
              <div>
                <p className="shell-copy">{isHi ? "आंतरिक परीक्षण हेतु डेमो खाते" : "Demo accounts for internal testing"}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isHi ? "लाइव auth flow बदले बिना seeded roles तुरंत भरें।" : "Quick-fill seeded roles without changing the live auth flow."}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {DEMO_ACCOUNTS.map((acct) => (
                  <button
                    key={acct.email}
                    type="button"
                    onClick={() => fillDemoAccount(acct.email)}
                    className="demo-account-chip"
                  >
                    <span className="font-medium text-foreground">{acct.label}</span>
                    <span className="text-xs text-muted-foreground">Load</span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
