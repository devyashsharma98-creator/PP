"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  Sparkles,
} from "lucide-react";
import { PragyaLogo } from "@/components/PragyaLogo";

import { useAppContext } from "@/context/AppContext";
import { getNavGroups, type NavGroup } from "@/lib/app/navigation";
import { useSignOut } from "@/hooks/use-sign-out";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

function SidebarGroup({
  group,
  collapsed,
  lang,
  isActivePath,
  t,
}: {
  group: NavGroup;
  collapsed: boolean;
  lang: string;
  isActivePath: (path: string) => boolean;
  t: (en: string, hi: string) => string;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-0.5">
      {!collapsed ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-1.5 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-sidebar-accent/40"
        >
          {group.icon ? (
            <group.icon className="h-3 w-3 text-sidebar-foreground/40" />
          ) : null}
          <span className="flex-1 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/45">
            {t(group.title, group.titleHi)}
          </span>
          <ChevronDown
            className={cn(
              "h-3 w-3 text-sidebar-foreground/30 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </button>
      ) : null}
      <AnimatePresence initial={false}>
        {open || collapsed ? (
          <motion.div
            key={group.title}
            initial={collapsed ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActivePath(item.path);

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    prefetch={false}
                    title={
                      collapsed
                        ? `${t(item.label, item.sublabel)}${item.description ? ` — ${t(item.description, item.descriptionHi ?? item.sublabel)}` : ""}`
                        : undefined
                    }
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                      collapsed ? "justify-center" : "",
                      active
                        ? "bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-sm"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
                    )}
                  >
                    {active ? (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute bottom-1 left-0 top-1 w-[3px] rounded-full bg-primary shadow-[0_0_10px_hsl(27_100%_50%/0.7)]"
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                      />
                    ) : null}
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active ? "drop-shadow-sm" : "")} />
                    <AnimatePresence>
                      {!collapsed ? (
                        <motion.span
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -4 }}
                          className={cn(
                            "flex-1 truncate text-xs leading-tight",
                            lang === "hi" ? "font-devanagari" : "",
                          )}
                        >
                          {t(item.label, item.sublabel)}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { lang, permissions, viewer, authReady } = useAppContext();
  const t = useT();
  const signOut = useSignOut();

  const showAdminControls = permissions.canManageUsers || Boolean(
    viewer?.effectiveRoles.some((role) => role === "super_admin" || role === "org_admin"),
  );
  const isSuperAdmin = viewer?.effectiveRoles?.includes("super_admin");

  const navGroups = useMemo(
    () => getNavGroups(showAdminControls, viewer?.primaryRoleCode ? [viewer.primaryRoleCode] : null),
    [showAdminControls, viewer?.primaryRoleCode],
  );

  const isActivePath = useCallback(
    (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path)),
    [pathname],
  );

  return (
    <aside
      className={cn(
        "institution-ledger-rail sticky top-0 z-30 hidden h-screen flex-col border-r border-sidebar-border text-sidebar-foreground transition-all duration-200 ease-out md:flex",
        collapsed ? "w-[72px]" : "w-[220px]",
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-sidebar-border px-3 py-3">
        <Link
          href="/parichay"
          prefetch={false}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] saffron-gradient ring-1 ring-primary/10 shadow-[0_14px_24px_-18px_hsl(27_100%_50%/0.8)]"
          aria-label={t("Organisation landing", "संगठन परिचय पृष्ठ")}
        >
          <PragyaLogo className="h-7 w-7" />
          {collapsed && isSuperAdmin ? (
            <span className="absolute -right-1 -top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[6px] text-primary-foreground shadow-sm">
              <Sparkles className="h-[7px] w-[7px]" />
            </span>
          ) : null}
        </Link>
        <AnimatePresence>
          {!collapsed ? (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="flex flex-1 items-center gap-1 overflow-hidden whitespace-nowrap"
            >
              <span className={cn("text-sm font-bold tracking-tight", lang === "hi" && "font-devanagari")}>
                {t("Pragya Pravah", "प्रज्ञा प्रवाह")}
              </span>
              {isSuperAdmin ? (
                <span className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-primary">
                  <Sparkles className="h-2.5 w-2.5" />
                  {t("Admin", "प्रशासन")}
                </span>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
        {!collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label={t("Collapse sidebar", "साइडबार बंद करें")}
            className="flex shrink-0 rounded-full p-1.5 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-3 scrollbar-thin">
        {navGroups.map((group) => (
          <SidebarGroup
            key={group.title}
            group={group}
            collapsed={collapsed}
            lang={lang}
            isActivePath={isActivePath}
            t={t}
          />
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-2 pb-3 pt-2">
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label={t("Expand sidebar", "साइडबार खोलें")}
            className="mx-auto flex rounded-full p-2 text-sidebar-foreground/40 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
        {authReady ? (
          <button
            type="button"
            onClick={() => void signOut()}
            title={collapsed ? t("Sign out", "लॉग आउट") : undefined}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-destructive/12 hover:text-destructive",
              collapsed && "justify-center px-0",
            )}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed ? <span className="text-xs">{t("Sign out", "लॉग आउट")}</span> : null}
          </button>
        ) : null}
      </div>
    </aside>
  );
}

