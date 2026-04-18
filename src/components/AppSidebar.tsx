"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { PragyaLogo } from "@/components/PragyaLogo";

import { useAppContext } from "@/context/AppContext";
import { getNavGroups } from "@/lib/app/navigation";
import { useSignOut } from "@/hooks/use-sign-out";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { lang, permissions, viewer, authReady } = useAppContext();
  const t = useT();
  const signOut = useSignOut();

  const showAdminControls = permissions.canManageUsers || Boolean(
    viewer?.effectiveRoles.some((role) => role === "super_admin" || role === "org_admin"),
  );
  const navGroups = useMemo(
    () => getNavGroups(showAdminControls, viewer?.primaryRoleCode ? [viewer.primaryRoleCode] : null),
    [showAdminControls, viewer?.primaryRoleCode],
  );

  return (
    <aside
      className={cn(
        "institution-ledger-rail sticky top-0 z-30 hidden h-screen flex-col border-r border-sidebar-border text-sidebar-foreground transition-all duration-300 md:flex",
        collapsed ? "w-[72px]" : "w-[248px]",
      )}
    >
      <div className="shrink-0 border-b border-sidebar-border px-4 py-4">
        {!collapsed ? <p className="shell-copy mb-3 text-sidebar-foreground/55">Bhopal Vibhag</p> : null}
        <div className="flex items-center gap-3">
          <Link
            href="/parichay"
            prefetch={false}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] saffron-gradient ring-1 ring-primary/10 shadow-[0_18px_30px_-22px_hsl(27_100%_50%/0.8)]"
            aria-label={t("Organisation landing", "संगठन परिचय पृष्ठ")}
          >
            <PragyaLogo className="h-8 w-8" />
          </Link>
          <AnimatePresence>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0, maxWidth: 0 }}
                animate={{ opacity: 1, maxWidth: 256 }}
                exit={{ opacity: 0, maxWidth: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className={cn("text-sm font-bold tracking-tight text-sidebar-accent-foreground", lang === "hi" && "font-devanagari")}>
                  {t("Pragya Pravah", "प्रज्ञा प्रवाह")}
                </h1>
                <p
                  className={cn(
                    "text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/58",
                    lang === "hi" && "font-devanagari tracking-[0.14em]",
                  )}
                >
                  {t("Internal institutional console", "आंतरिक संस्थागत प्रणाली")}
                </p>
                <p
                  className={cn(
                    "text-[11px] leading-5 text-sidebar-foreground/72",
                    lang === "hi" && "font-devanagari",
                  )}
                >
                  {t("ERP workflow, approvals, and coordination.", "ईआरपी कार्यप्रवाह, अनुमोदन और समन्वय।")}
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/45">
                {t(group.title, group.titleHi)}
              </p>
            ) : null}
            {group.items.map((item) => {
              const active = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  prefetch={false}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-sidebar-primary/95 text-sidebar-primary-foreground shadow-[0_14px_32px_-24px_hsl(27_100%_50%/0.95)]"
                      : "text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  {active ? (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-primary shadow-[0_0_10px_hsl(27_100%_50%/0.7)]"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  ) : null}
                  <item.icon className={cn("h-4 w-4 shrink-0", active ? "drop-shadow-sm" : "")} />
                  <AnimatePresence>
                    {!collapsed ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <span className={cn("text-xs", lang === "hi" ? "font-devanagari" : "")}>
                          {t(item.label, item.sublabel)}
                        </span>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="space-y-2 px-3 pb-4">
        {authReady ? (
          <button
            type="button"
            onClick={() => void signOut()}
            className={cn(
              "flex w-full items-center gap-2 rounded-2xl px-3 py-2.5 text-left text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-destructive/15 hover:text-destructive",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{t("Sign out", "लॉग आउट")}</span> : null}
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex rounded-full p-2 text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            !collapsed && "ml-auto",
            collapsed && "mx-auto",
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}

