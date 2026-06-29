"use client";

/**
 * VishaySelect — reusable multi-select for tagging any content with vishayas.
 *
 * Controlled: pass `value` (vishay IDs) and `onChange`. Pulls the active vishay
 * list from the API. Use this inside article/event/scholar/project forms.
 */
import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useVishayas } from "@/hooks/api/use-vishayas";
import { vishayaColor, vishayaIcon } from "@/lib/app/vishaya-style";

export interface VishaySelectProps {
  value: string[];
  onChange: (vishayIds: string[]) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function VishaySelect({ value, onChange, disabled, className, placeholder }: VishaySelectProps) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { data: vishayas = [], isLoading } = useVishayas();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => vishayas.filter((v) => value.includes(v.id)),
    [vishayas, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vishayas;
    return vishayas.filter(
      (v) => v.nameEn.toLowerCase().includes(q) || v.nameHi.includes(query.trim()),
    );
  }, [vishayas, query]);

  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || isLoading}
            className="w-full justify-between font-normal"
          >
            <span className="truncate text-muted-foreground">
              {selected.length > 0
                ? t(`${selected.length} vishay selected`, `${selected.length} विषय चयनित`)
                : (placeholder ?? t("Select vishayas…", "विषय चुनें…"))}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("Search vishayas…", "विषय खोजें…")}
                className="h-9 pl-8"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                {t("No vishayas found.", "कोई विषय नहीं मिला।")}
              </p>
            )}
            {filtered.map((v) => {
              const c = vishayaColor(v.color);
              const Icon = vishayaIcon(v.icon);
              const isSelected = value.includes(v.id);
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => toggle(v.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted",
                    isSelected && "bg-muted/60",
                  )}
                >
                  <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-md border", c.bg, c.border)}>
                    <Icon className={cn("h-3.5 w-3.5", c.text)} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {isHi ? v.nameHi : v.nameEn}
                  </span>
                  <Check className={cn("h-4 w-4 shrink-0 text-primary", isSelected ? "opacity-100" : "opacity-0")} />
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((v) => {
            const c = vishayaColor(v.color);
            return (
              <Badge
                key={v.id}
                variant="outline"
                className={cn("gap-1 pr-1 font-normal", c.bg, c.border, c.text)}
              >
                {isHi ? v.nameHi : v.nameEn}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => toggle(v.id)}
                    className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10"
                    aria-label={t("Remove", "हटाएँ")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
