"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext, type Role } from "@/context/AppContext";
import { canonicalRoleLabels, canonicalRoleLabelsHi, roleLabels, roleLabelsHi } from "@/lib/app/constants";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, LogOut } from "lucide-react";
import { PragyaLogo } from "@/components/PragyaLogo";
import { cn } from "@/lib/utils";
import { repairBrokenHindi, useT } from "@/lib/useT";
import { useState, useEffect, useRef, useMemo } from "react";
import { useSignOut } from "@/hooks/use-sign-out";
import { useDashboardEvents } from "@/hooks/api/use-dashboard";
import { useDashboardArticles } from "@/hooks/api/use-dashboard-articles";
import { getNavGroups } from "@/lib/app/navigation";
import { useShellFrame } from "./navbar/useShellFrame";
import { useNavbarNotifications } from "./navbar/useNavbarNotifications";
import { MobileNav } from "./navbar/MobileNav";
import { NotificationBell } from "./navbar/NotificationBell";
import { ThemeToggle } from "./navbar/ThemeToggle";

/**
 * Time: O(1) - passive scroll listener.
 * Space: O(1).
 */
function useScrollHide(disabled: boolean) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    if (disabled) {
      setHidden(false);
      return;
    }
    const root = document.getElementById("main-content");
    const target: HTMLElement | Window = root ?? window;
    const getY = () => (root ? root.scrollTop : window.scrollY);
    lastY.current = getY();

    const onScroll = () => {
      const y = getY();
      if (y < 24 || y < lastY.current - 8) {
        setHidden(false);
      } else if (y > lastY.current + 8 && y > 96) {
        setHidden(true);
      }
      lastY.current = y;
    };

    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [disabled]);

  return hidden;
}

export function Navbar() {
  const { role, setRole, lang, setLang, isAuthenticated, authReady, permissions, viewer, availableRoles } = useAppContext();
  const { data: events = [] } = useDashboardEvents();
  const { data: articles = [] } = useDashboardArticles();
  const pathname = usePathname();
  const signOut = useSignOut();
  const t = useT();
  const [open, setOpen] = useState(false);

  const shellFrame = useShellFrame(pathname, role);
  const notifications = useNavbarNotifications(role, events, articles);
  const hideOnScroll = useScrollHide(open);

  const showAdminControls = permissions.canManageUsers || Boolean(
    viewer?.effectiveRoles.some((c) => c === "super_admin" || c === "org_admin")
  );
  const navigationGroups = useMemo(
    () => getNavGroups(showAdminControls, viewer?.primaryRoleCode ? [viewer.primaryRoleCode] : null),
    [showAdminControls, viewer?.primaryRoleCode],
  );

  const currentRoleLabel = lang === "hi"
    ? repairBrokenHindi(viewer?.primaryRoleCode ? canonicalRoleLabelsHi[viewer.primaryRoleCode] : roleLabelsHi[role])
    : viewer?.primaryRoleCode ? canonicalRoleLabels[viewer.primaryRoleCode] : roleLabels[role];

  const demoRoleSwitchEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH === "true";
  const canUseDemoRoleSwitch = demoRoleSwitchEnabled && availableRoles.length > 1;

  return (
    <header className={cn("sticky top-0 z-20 px-2 pt-2 transition-transform duration-300 sm:px-3 md:px-6 md:pt-4", hideOnScroll && "-translate-y-[120%]")}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 rounded-xl bg-background px-4 py-2 text-sm font-semibold shadow-lg ring-2 ring-primary"
      >
        {t("Skip to content", "मुख्य सामग्री पर जाएं")}
      </a>
      <div className="institution-panel-muted grid gap-2 px-2 py-2 sm:px-3 md:flex md:min-h-[78px] md:items-center md:justify-between md:gap-3 md:px-5 md:py-3">
        <div className="flex min-w-0 items-center gap-2 md:flex-1 md:gap-3">
          <MobileNav
            open={open}
            onOpenChange={setOpen}
            pathname={pathname}
            lang={lang}
            shellFrame={shellFrame}
            navigationGroups={navigationGroups}
          />
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/parichay"
              prefetch={false}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.95rem] saffron-gradient ring-1 ring-primary/10 shadow-[0_14px_24px_-18px_hsl(27_100%_50%/0.8)] md:hidden"
              aria-label={t("Organisation landing", "संगठन परिचय पृष्ठ")}
            >
              <PragyaLogo className="h-6 w-6" />
            </Link>
            <div className="min-w-0 space-y-0.5">
              <p className="shell-copy truncate text-[9px] text-foreground/55 md:text-[10px]">
                {t("Bhopal Vibhag", "भोपाल विभाग")}
              </p>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shell-panel-copy hidden shrink-0 lg:block">
                  {t("Internal institutional console", "आंतरिक संस्थागत प्रणाली")}
                </span>
                <span className="hidden shrink-0 text-muted-foreground/60 lg:block">•</span>
                <Link
                  href="/parichay"
                  prefetch={false}
                  className={cn(
                    "min-w-0 truncate text-left text-sm font-bold tracking-tight transition-colors hover:text-primary md:text-base",
                    lang === "hi" && "font-devanagari",
                  )}
                  title={t("Organisation landing", "संगठन परिचय पृष्ठ")}
                >
                  {t(shellFrame.titleEn, shellFrame.titleHi)}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-between gap-1.5 md:flex-none md:justify-end md:gap-3">
          <ThemeToggle />
          <NotificationBell isAuthenticated={isAuthenticated} notifications={notifications} lang={lang} />

          <button
            onClick={() => setLang(lang === "en" ? "hi" : "en")}
            aria-label={lang === "en" ? "Switch to Hindi" : "अंग्रेजी में बदलें"}
            className="relative flex h-8 items-center gap-0 overflow-hidden rounded-full border border-border/70 bg-background/80 text-[11px] font-bold transition-all hover:border-primary/40 md:h-9 md:text-xs"
            title={lang === "en" ? "Switch to Hindi" : "अंग्रेजी में बदलें"}
          >
            <span className={cn("px-3 py-1 transition-all duration-200", lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>EN</span>
            <span className={cn("px-3 py-1 font-devanagari transition-all duration-200", lang === "hi" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>हि</span>
          </button>

          <div className="shell-role-chip flex-1 md:flex-none">
            <Shield className="h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                {t("Dayitva", "दायित्व")}
              </p>
              {canUseDemoRoleSwitch ? (
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger className="h-auto w-[112px] border-0 bg-transparent p-0 text-left text-xs font-medium shadow-none focus:ring-0 md:w-[182px] md:text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-50 border border-border bg-popover shadow-lg">
                    {availableRoles.map((key) => (
                      <SelectItem key={key} value={key} className={cn("text-sm", lang === "hi" && "font-devanagari")}>
                        {lang === "hi" ? roleLabelsHi[key] : roleLabels[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className={cn("block truncate text-xs font-medium md:text-sm", lang === "hi" && "font-devanagari")}>{currentRoleLabel}</span>
              )}
            </div>
          </div>

          {authReady && (
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label={t("Sign Out", "लॉग आउट")}
              className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive md:px-3"
              title={t("Sign Out", "लॉग आउट")}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="hidden text-xs font-semibold md:inline">{t("Sign out", "लॉग आउट")}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
