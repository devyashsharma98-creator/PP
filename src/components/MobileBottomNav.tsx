"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, MoreHorizontal } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppContext } from "@/context/AppContext";
import { getMobilePrimaryNav, getNavGroups, getOverflowNavItems } from "@/lib/app/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const { permissions, viewer } = useAppContext();

  const showAdminControls = permissions.canManageUsers || Boolean(
    viewer?.effectiveRoles.some((role) => role === "super_admin" || role === "org_admin"),
  );

  const primaryRoleCodes = useMemo(() => (viewer?.primaryRoleCode ? [viewer.primaryRoleCode] : null), [viewer?.primaryRoleCode]);
  const primaryNav = useMemo(() => getMobilePrimaryNav(primaryRoleCodes), [primaryRoleCodes]);
  const primaryPaths = useMemo(() => new Set(primaryNav.map((item) => item.path)), [primaryNav]);
  const overflowGroups = useMemo(
    () =>
      getNavGroups(showAdminControls, primaryRoleCodes)
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => !primaryPaths.has(item.path)),
        }))
        .filter((group) => group.items.length > 0),
    [primaryPaths, primaryRoleCodes, showAdminControls],
  );
  const overflowItems = useMemo(
    () => getOverflowNavItems(showAdminControls, primaryRoleCodes).filter((item) => !primaryPaths.has(item.path)),
    [primaryPaths, primaryRoleCodes, showAdminControls],
  );
  const overflowActive = overflowItems.some((item) => pathname === item.path);

  return (
    <nav aria-label="Mobile navigation" className="institution-ledger-rail safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-sidebar-border md:hidden">
      <div className="flex items-center justify-between px-4 pt-2 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
        <span>Bhopal Vibhag</span>
        <span>Pragya Pravah</span>
      </div>
      <div className="grid h-[74px] grid-cols-5 gap-1 px-2 py-2">
        {primaryNav.map((item) => {
          const active = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={false}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl text-center transition-all duration-150 active:scale-95",
                active
                  ? "bg-primary/14 text-primary shadow-[0_12px_24px_-20px_hsl(27_100%_50%/0.8)]"
                  : "text-sidebar-foreground/68 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span className={cn("text-[10px] leading-none font-devanagari", active && "font-semibold text-primary")}>
                {t(item.label, item.sublabel)}
              </span>
            </Link>
          );
        })}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open more navigation"
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl text-center transition-all duration-150 active:scale-95",
                overflowActive
                  ? "bg-primary/14 text-primary shadow-[0_12px_24px_-20px_hsl(27_100%_50%/0.8)]"
                  : "text-sidebar-foreground/68 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", overflowActive && "text-primary")} />
              <span className={cn("text-[10px] leading-none font-devanagari", overflowActive && "font-semibold text-primary")}>
                {t("More", "और")}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-t border-border bg-background pb-8">
            <SheetHeader className="pb-3">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Grid2x2 className="h-4 w-4 text-primary" />
                {t("More Navigation", "अधिक नेविगेशन")}
              </SheetTitle>
              <SheetDescription className="text-left">
                {t("Secondary coordination and reference pages.", "द्वितीयक समन्वय और संदर्भ पृष्ठ।")}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              {overflowGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                    {t(group.title, group.titleHi)}
                  </p>
                  <div className="grid gap-2">
                    {group.items.map((item) => {
                      const active = pathname === item.path;
                      return (
                        <Link
                          key={item.path}
                          href={item.path}
                          prefetch={false}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-all",
                            active
                              ? "border-primary/25 bg-primary/8 text-primary"
                              : "border-border/60 bg-muted/20 text-foreground hover:border-primary/20 hover:bg-muted/30",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <div className="min-w-0">
                            <p className={cn("text-sm font-medium", active && "text-primary")}>{t(item.label, item.sublabel)}</p>
                            <p className="text-xs text-muted-foreground">
                              {t(item.sublabel, item.sublabel)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
