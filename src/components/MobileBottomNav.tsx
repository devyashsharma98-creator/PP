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
  const { lang, permissions, viewer } = useAppContext();

  const showAdminControls = permissions.canManageUsers || Boolean(
    viewer?.effectiveRoles.some((role) => role === "super_admin" || role === "org_admin"),
  );

  const primaryRoleCodes = useMemo(
    () => (viewer?.primaryRoleCode ? [viewer.primaryRoleCode] : null),
    [viewer?.primaryRoleCode],
  );
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

  const isActivePath = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const overflowActive = open || overflowItems.some((item) => isActivePath(item.path));

  return (
    <nav aria-label="Mobile navigation" className="institution-ledger-rail safe-area-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-sidebar-border md:hidden">
      <div className="flex items-center justify-between px-4 pt-2 text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/55">
        <span>Bhopal Vibhag</span>
        <span>Pragya Pravah</span>
      </div>
      <div className="grid h-[74px] grid-cols-5 gap-1 px-2 py-2">
        {primaryNav.map((item) => {
          const active = isActivePath(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={false}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-2xl text-center transition-all duration-150 active:scale-95",
                active
                  ? "bg-primary/14 text-primary ring-1 ring-primary/20 shadow-[0_12px_24px_-20px_hsl(27_100%_50%/0.8)]"
                  : "text-sidebar-foreground/68 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span
                className={cn(
                  "text-[10px] leading-none",
                  lang === "hi" && "font-devanagari",
                  active && "font-semibold text-primary",
                )}
              >
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
                  ? "bg-primary/14 text-primary ring-1 ring-primary/20 shadow-[0_12px_24px_-20px_hsl(27_100%_50%/0.8)]"
                  : "text-sidebar-foreground/68 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", overflowActive && "text-primary")} />
              <span
                className={cn(
                  "text-[10px] leading-none",
                  lang === "hi" && "font-devanagari",
                  overflowActive && "font-semibold text-primary",
                )}
              >
                {t("More", "\u0914\u0930")}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-t border-border bg-background pb-8">
            <SheetHeader className="pb-3">
              <SheetTitle className={cn("flex items-center gap-2 text-left", lang === "hi" && "font-devanagari")}>
                <Grid2x2 className="h-4 w-4 text-primary" />
                {t("More Navigation", "\u0905\u0927\u093f\u0915 \u0928\u0947\u0935\u093f\u0917\u0947\u0936\u0928")}
              </SheetTitle>
              <SheetDescription className={cn("text-left", lang === "hi" && "font-devanagari")}>
                {t("Secondary coordination and reference pages.", "\u0926\u094d\u0935\u093f\u0924\u0940\u092f\u0915 \u0938\u092e\u0928\u094d\u0935\u092f \u0914\u0930 \u0938\u0902\u0926\u0930\u094d\u092d \u092a\u0943\u0937\u094d\u0920\u0964")}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              {overflowGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <p className={cn("text-[10px] uppercase tracking-[0.22em] text-muted-foreground", lang === "hi" && "font-devanagari tracking-[0.14em]")}>
                    {t(group.title, group.titleHi)}
                  </p>
                  <div className="grid gap-2">
                    {group.items.map((item) => {
                      const active = isActivePath(item.path);
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
                          <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                          <div className="min-w-0">
                            <p className={cn("text-sm font-medium", lang === "hi" && "font-devanagari", active && "text-primary")}>
                              {t(item.label, item.sublabel)}
                            </p>
                            <p className={cn("text-xs text-muted-foreground", lang === "hi" && "font-devanagari")}>
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
