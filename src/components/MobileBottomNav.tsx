"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Grid2x2, LogOut, MoreHorizontal } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAppContext } from "@/context/AppContext";
import { useSignOut } from "@/hooks/use-sign-out";
import { getMobilePrimaryNav, getNavGroups, getOverflowNavItems } from "@/lib/app/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";

export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);
  const { lang, permissions, viewer, authReady } = useAppContext();
  const signOut = useSignOut();

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
    <nav data-mobile-bottom-nav aria-label="Mobile navigation" className="safe-area-bottom fixed bottom-2 left-2 right-2 z-50 rounded-[1.35rem] border border-border/70 bg-card/96 shadow-[0_18px_44px_-28px_hsl(var(--navy)/0.45)] backdrop-blur-xl md:hidden">
      <div className="grid h-[76px] grid-cols-5 gap-1.5 px-2 py-2">
        {primaryNav.map((item) => {
          const active = isActivePath(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              prefetch={false}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-center transition-all duration-150 active:scale-95",
                active
                  ? "bg-background text-primary ring-1 ring-primary/30 shadow-[0_12px_28px_-20px_hsl(27_100%_50%/0.75)]"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-primary")} />
              <span
                className={cn(
                  "max-w-full truncate text-[10px] leading-none",
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
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl text-center transition-all duration-150 active:scale-95",
                overflowActive
                  ? "bg-background text-primary ring-1 ring-primary/30 shadow-[0_12px_28px_-20px_hsl(27_100%_50%/0.75)]"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", overflowActive && "text-primary")} />
              <span
                className={cn(
                  "max-w-full truncate text-[10px] leading-none",
                  lang === "hi" && "font-devanagari",
                  overflowActive && "font-semibold text-primary",
                )}
              >
                {t("More", "और")}
              </span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl border-t border-border bg-background pb-8">
            <SheetHeader className="pb-3">
              <SheetTitle className={cn("flex items-center gap-2 text-left", lang === "hi" && "font-devanagari")}>
                <Grid2x2 className="h-4 w-4 text-primary" />
                {t("More Navigation", "अधिक नेविगेशन")}
              </SheetTitle>
              <SheetDescription className={cn("text-left", lang === "hi" && "font-devanagari")}>
                {t("Secondary coordination and reference pages.", "द्वितीयक समन्वय और संदर्भ पृष्ठ।")}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5">
              {overflowGroups.map((group) => (
                <div key={group.title} className="space-y-2">
                  <div className="flex items-center gap-1.5">
                    {group.icon ? (
                      <group.icon className="h-3 w-3 text-muted-foreground" />
                    ) : null}
                    <p className={cn("text-[10px] uppercase tracking-[0.22em] text-muted-foreground", lang === "hi" && "font-devanagari tracking-[0.14em]")}>
                      {t(group.title, group.titleHi)}
                    </p>
                  </div>
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
                              {item.description ? t(item.description, item.descriptionHi ?? item.sublabel) : (lang === "hi" ? item.label : item.sublabel)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {authReady ? (
              <div className="mt-6 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span className={cn(lang === "hi" && "font-devanagari")}>{t("Sign out", "लॉग आउट")}</span>
                </button>
              </div>
            ) : null}
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
