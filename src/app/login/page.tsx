"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Flame, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
            <p className="section-seal">Bhopal Vibhag</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl saffron-gradient shadow-lg shadow-primary/20">
                  <Flame className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="shell-copy">Internal institutional console</p>
                  <h1 className="text-3xl font-bold tracking-tight font-devanagari md:text-5xl">
                    Pragya Pravah
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-lg font-medium text-foreground/85 md:text-xl">
                Civilisational thought, organised action.
              </p>

              <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Review queues, unit activity, aalekh workflow, and prachar coordination
                in one console designed for internal organisational use.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="institution-panel-muted px-4 py-4">
              <p className="shell-copy">Context</p>
              <p className="mt-2 text-sm font-semibold">Bhopal Vibhag</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Regional leadership and unit coordination.
              </p>
            </div>
            <div className="institution-panel-muted px-4 py-4">
              <p className="shell-copy">Workflow</p>
              <p className="mt-2 text-sm font-semibold">Internal review and publication</p>
              <p className="mt-1 text-sm text-muted-foreground">
                From event planning to aalekh and prachar follow-through.
              </p>
            </div>
            <div className="institution-panel-muted px-4 py-4">
              <p className="shell-copy">Audience</p>
              <p className="mt-2 text-sm font-semibold">Demo accounts for internal testing</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use seeded roles to inspect each operational layer quickly.
              </p>
            </div>
          </div>
        </section>

        <Card className="institution-panel mx-auto w-full max-w-xl border-none">
          <CardHeader className="space-y-4 border-b border-border/60 pb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="shell-copy">Secure access</p>
                <h2 className="text-2xl font-semibold tracking-tight">Internal access panel</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LogIn className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              Sign in with your assigned account or use a seeded role profile to
              review the demo flow.
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
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
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="space-y-3 border-t border-border/60 pt-5">
              <div>
                <p className="shell-copy">Demo accounts for internal testing</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Quick-fill seeded roles without changing the live auth flow.
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
