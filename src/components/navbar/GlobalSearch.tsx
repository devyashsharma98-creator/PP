"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, CalendarDays, PenLine, User, Loader2, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSearch } from "@/hooks/api/use-search";
import { useT } from "@/lib/useT";

export function GlobalSearch() {
  const t = useT();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { data: results = [], isFetching } = useSearch(query);

  const showPanel = open && query.length >= 2;

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setQuery("");
  }, [pathname]);

  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPanel]);

  const typeConfig: Record<string, { icon: typeof CalendarDays; href: (id: string) => string; labelEn: string; labelHi: string }> = {
    event: { icon: CalendarDays, href: () => "/dashboard", labelEn: "Event", labelHi: "कार्यक्रम" },
    article: { icon: PenLine, href: () => "/aalekh", labelEn: "Article", labelHi: "आलेख" },
    user: { icon: User, href: () => "/directory", labelEn: "Member", labelHi: "सदस्य" },
  };

  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  const groupedKeys = Object.keys(grouped);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t("Search", "खोजें")}
        className="rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors hover:bg-muted"
      >
        <Search className="w-4 h-4 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm rounded-xl border border-border bg-popover shadow-xl z-50 overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
              <Search className="w-4 h-4 shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search events, articles, people…", "कार्यक्रम, आलेख, सदस्य खोजें…")}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
              />
              {isFetching && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
            </div>

            {!showPanel && query.length > 0 && query.length < 2 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                {t("Type at least 2 characters to search", "खोजने के लिए कम से कम 2 अक्षर टाइप करें")}
              </div>
            )}

            {showPanel && !isFetching && results.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                {t("No results found", "कोई परिणाम नहीं मिला")}
              </div>
            )}

            {showPanel && results.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto p-2 space-y-3">
                {groupedKeys.map((type) => {
                  const cfg = typeConfig[type];
                  if (!cfg) return null;
                  const Icon = cfg.icon;
                  const items = grouped[type];
                  return (
                    <div key={type}>
                      <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {t(cfg.labelEn + "s", cfg.labelHi)}
                      </p>
                      <div className="space-y-0.5">
                        {items.map((r) => (
                          <Link
                            key={`${r.type}-${r.id}`}
                            href={cfg.href(r.id)}
                            prefetch={false}
                            onClick={() => setOpen(false)}
                            className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/60 transition-colors group"
                          >
                            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-primary/10">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate group-hover:text-foreground">{r.title}</p>
                              {r.subtitle && (
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{r.subtitle}</p>
                              )}
                            </div>
                            <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!showPanel && query.length < 2 && (
              <div className="px-4 py-6 text-center text-xs text-muted-foreground">
                {t("Start typing to search across events, articles, and members", "कार्यक्रम, आलेख और सदस्यों में खोजने के लिए टाइप करें")}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
