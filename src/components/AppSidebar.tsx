"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PragyaLogo } from "@/components/PragyaLogo";

import { useAppContext } from "@/context/AppContext";
import { getNavGroups } from "@/lib/app/navigation";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { lang, permissions, viewer } = useAppContext();
  const t = useT();

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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl saffron-gradient shadow-lg shadow-primary/20">
            <PragyaLogo className="h-7 w-7" />
          </div>
          <AnimatePresence>
            {!collapsed ? (
              <motion.div
                initial={{ opacity: 0, maxWidth: 0 }}
                animate={{ opacity: 1, maxWidth: 256 }}
                exit={{ opacity: 0, maxWidth: 0 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <h1 className="font-devanagari text-sm font-bold tracking-tight text-sidebar-accent-foreground">
                  {t("Pragya Pravah", "प्रज्ञा प्रवाह")}
                </h1>
                <p className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/58">
                  Internal institutional console
                </p>
                <p className="text-[11px] leading-5 text-sidebar-foreground/72">
                  ERP workflow, approvals, and coordination.
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

      <div className="px-3 pb-4">
        <button
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="ml-auto flex rounded-full p-2 text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
