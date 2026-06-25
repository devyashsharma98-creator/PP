"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { PragyaLogo } from "@/components/PragyaLogo";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { getNavGroups } from "@/lib/app/navigation";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pathname: string;
  lang: string;
  shellFrame: { titleEn: string; titleHi: string; subtitleEn: string; subtitleHi: string };
  navigationGroups: ReturnType<typeof getNavGroups>;
}

export function MobileNav({ open, onOpenChange, pathname, lang, shellFrame, navigationGroups }: MobileNavProps) {
  const t = useT();

  useEffect(() => {
    onOpenChange(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] md:hidden" aria-label={t("Open navigation menu", "नेविगेशन मेनू खोलें")}>
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="institution-ledger-rail w-[300px] border-r border-sidebar-border p-0 text-sidebar-foreground">
        <SheetTitle className="sr-only">{t("Mobile navigation", "मोबाइल नेविगेशन")}</SheetTitle>
        <SheetDescription className="sr-only">{t("Primary app navigation links.", "मुख्य ऐप नेविगेशन लिंक।")}</SheetDescription>
        <div className="border-b border-sidebar-border px-6 py-4">
          <p className="mb-3 text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/55">{t("Bhopal Vibhag", "भोपाल विभाग")}</p>
          <div className="flex items-center gap-3">
            <Link href="/parichay" prefetch={false} onClick={() => onOpenChange(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] saffron-gradient ring-1 ring-primary/10 shadow-[0_16px_28px_-20px_hsl(27_100%_50%/0.8)]" aria-label={t("Organisation landing", "संगठन परिचय पृष्ठ")}>
              <PragyaLogo className="h-7 w-7" />
            </Link>
            <div className="min-w-0 space-y-1">
              <p className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/60">{t("Internal institutional console", "आंतरिक संस्थागत प्रणाली")}</p>
              <h1 className={cn("text-sm font-bold tracking-tight text-foreground", lang === "hi" && "font-devanagari")}>{t(shellFrame.titleEn, shellFrame.titleHi)}</h1>
              <p className={cn("text-[11px] leading-5 text-sidebar-foreground/72", lang === "hi" && "font-devanagari")}>{t(shellFrame.subtitleEn, shellFrame.subtitleHi)}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 pb-24">
          {navigationGroups.map((group) => (
            <div key={group.title} className="mb-4 space-y-1">
              <div className="flex items-center gap-1.5 px-3 pb-1">
                {group.icon ? (
                  <group.icon className="h-3 w-3 text-sidebar-foreground/40" />
                ) : null}
                <p className="text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/45">{t(group.title, group.titleHi)}</p>
              </div>
              {group.items.map((item) => {
                const active = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} prefetch={false} onClick={() => onOpenChange(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150", active ? "bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground")}>
                    <item.icon className={cn("h-[18px] w-[18px] shrink-0", active && "drop-shadow-sm")} />
                    <span className={cn("flex-1 truncate text-xs leading-tight", lang === "hi" && "font-devanagari")}>{t(item.label, item.sublabel)}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
