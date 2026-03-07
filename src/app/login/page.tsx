"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame, LogIn, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const DEMO_ACCOUNTS = [
  { label: "Vibhag Pramukh", email: "demo.vibhag@example.com" },
  { label: "Aayam Pramukh", email: "demo.aayam@example.com" },
  { label: "Unit Head", email: "demo.unithead@example.com" },
  { label: "Karyakarta", email: "demo.karyakarta@example.com" },
  { label: "Super Admin", email: "demo.admin@example.com" },
];

export default function LoginPage() {
  const router = useRouter();
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
      const supabase = getSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Successful login — redirect
      router.push(returnTo);
      router.refresh();
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
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto w-12 h-12 rounded-xl saffron-gradient flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-devanagari">
              Pragya Pravah
            </h1>
            <p className="text-sm text-muted-foreground font-devanagari">
              Bhopal Vibhag
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
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
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Demo account quick-fill */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground text-center mb-3">
              Demo accounts for internal testing
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.email}
                  type="button"
                  onClick={() => fillDemoAccount(acct.email)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                >
                  {acct.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
