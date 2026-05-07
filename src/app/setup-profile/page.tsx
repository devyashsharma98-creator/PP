"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Loader2, Lock, Phone, User } from "lucide-react";

import { PragyaLogo } from "@/components/PragyaLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/context/AppContext";
import { cn } from "@/lib/utils";

function SetupProfileForm() {
  const router = useRouter();
  const { lang, isAuthenticated, authReady } = useAppContext();
  const isHi = lang === "hi";

  const [displayName, setDisplayName] = useState("");
  const [displayNameHi, setDisplayNameHi] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Ensure user is authenticated; if not, redirect to login
  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace("/login?returnTo=/setup-profile");
      return;
    }
    // Check if setup is actually required via /api/auth/me
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!data?.data?.requiresPasswordChange) {
          router.replace("/dashboard");
          return;
        }
        setCheckingAuth(false);
      })
      .catch(() => setCheckingAuth(false));
  }, [authReady, isAuthenticated, router]);

  const copy = isHi
    ? {
        title: "प्रोफ़ाइल सेटअप",
        subtitle: "कृपया अपनी जानकारी भरें और एक नया पासवर्ड सेट करें।",
        displayNameLabel: "पूरा नाम (अंग्रेज़ी)",
        displayNamePlaceholder: "अपना नाम दर्ज करें",
        displayNameHiLabel: "पूरा नाम (हिंदी) — वैकल्पिक",
        displayNameHiPlaceholder: "हिंदी में नाम",
        phoneLabel: "फ़ोन नंबर — वैकल्पिक",
        phonePlaceholder: "+91 98765 43210",
        currentPasswordLabel: "वर्तमान पासवर्ड",
        currentPasswordPlaceholder: "वर्तमान पासवर्ड दर्ज करें",
        newPasswordLabel: "नया पासवर्ड",
        newPasswordPlaceholder: "कम से कम 8 अक्षर",
        confirmPasswordLabel: "नया पासवर्ड पुष्टि करें",
        confirmPasswordPlaceholder: "पासवर्ड दोहराएँ",
        submit: "सेटअप पूरा करें",
        submitting: "सहेजा जा रहा है...",
        passwordMismatch: "पासवर्ड मेल नहीं खाते।",
        successTitle: "सेटअप पूरा हुआ!",
        successSubtitle: "अब आप अपने डैशबोर्ड पर जा सकते हैं।",
        goToDashboard: "डैशबोर्ड पर जाएँ",
      }
    : {
        title: "Profile Setup",
        subtitle: "Please complete your profile and set a new password.",
        displayNameLabel: "Full Name (English)",
        displayNamePlaceholder: "Enter your name",
        displayNameHiLabel: "Full Name (Hindi) — Optional",
        displayNameHiPlaceholder: "Name in Hindi",
        phoneLabel: "Phone Number — Optional",
        phonePlaceholder: "+91 98765 43210",
        currentPasswordLabel: "Current Password",
        currentPasswordPlaceholder: "Enter current password",
        newPasswordLabel: "New Password",
        newPasswordPlaceholder: "At least 8 characters",
        confirmPasswordLabel: "Confirm New Password",
        confirmPasswordPlaceholder: "Repeat password",
        submit: "Complete Setup",
        submitting: "Saving...",
        passwordMismatch: "Passwords do not match.",
        successTitle: "Setup Complete!",
        successSubtitle: "You can now proceed to your dashboard.",
        goToDashboard: "Go to Dashboard",
      };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError(copy.passwordMismatch);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/setup-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          displayNameHi: displayNameHi.trim() || undefined,
          phone: phone.trim() || undefined,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message =
          (typeof data?.error === "string" ? data.error : data?.error?.message) ||
          data?.message ||
          "Something went wrong.";
        setError(message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 md:py-12 bg-muted/30">
      <div className="mx-auto max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-light via-primary to-saffron-deep shadow-lg">
            <PragyaLogo className="h-8 w-8" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Pragya Pravah</h1>
            <p className="text-xs text-muted-foreground">{isHi ? "प्रज्ञा प्रवाह" : "Internal ERP"}</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-none shadow-xl">
                <CardContent className="flex flex-col items-center py-12 text-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                  <h2 className="text-2xl font-semibold mb-2">{copy.successTitle}</h2>
                  <p className="text-muted-foreground mb-6">{copy.successSubtitle}</p>
                  <Button onClick={() => router.replace("/dashboard")} className="rounded-xl">
                    {copy.goToDashboard}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border-none shadow-xl">
                <CardHeader className="space-y-2">
                  <h2 className={cn("text-2xl font-semibold tracking-tight", isHi && "font-devanagari")}>
                    {copy.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">{copy.displayNameLabel}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={copy.displayNamePlaceholder}
                          required
                          className="pl-10 h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="displayNameHi">{copy.displayNameHiLabel}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="displayNameHi"
                          value={displayNameHi}
                          onChange={(e) => setDisplayNameHi(e.target.value)}
                          placeholder={copy.displayNameHiPlaceholder}
                          className={cn("pl-10 h-11 rounded-xl font-devanagari")}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">{copy.phoneLabel}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={copy.phonePlaceholder}
                          className="pl-10 h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">{copy.currentPasswordLabel}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder={copy.currentPasswordPlaceholder}
                            required
                            className="pl-10 h-11 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="newPassword">{copy.newPasswordLabel}</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={copy.newPasswordPlaceholder}
                          required
                          minLength={8}
                          className="h-11 rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">{copy.confirmPasswordLabel}</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={copy.confirmPasswordPlaceholder}
                          required
                          minLength={8}
                          className="h-11 rounded-xl"
                        />
                      </div>
                    </div>

                    {error ? (
                      <div className="flex items-start gap-2 rounded-2xl border border-destructive/20 bg-destructive/8 px-3 py-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    ) : null}

                    <Button type="submit" className="h-11 w-full rounded-xl" disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {loading ? copy.submitting : copy.submit}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function SetupProfilePage() {
  return (
    <Suspense>
      <SetupProfileForm />
    </Suspense>
  );
}
