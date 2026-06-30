"use client";

import { Clock, Plus, X, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  type Weekday,
  type WeeklyAvailability,
  type TimeSlot,
} from "@/lib/validators/scholars";

function ensureSlots(value: WeeklyAvailability | null | undefined, day: string): TimeSlot[] {
  const raw = value?.[day];
  return Array.isArray(raw) ? raw : [];
}

// ── Editor (for forms) ────────────────────────────────────────────────────────

export function WeeklyAvailabilityEditor({
  value,
  onChange,
}: {
  value: WeeklyAvailability;
  onChange: (value: WeeklyAvailability) => void;
}) {
  const t = useT();

  function addSlot(day: Weekday) {
    const slots = ensureSlots(value, day);
    onChange({ ...value, [day]: [...slots, { from: "09:00", to: "10:00" }] });
  }

  function updateSlot(day: Weekday, index: number, field: keyof TimeSlot, time: string) {
    const slots = ensureSlots(value, day);
    const updated = slots.map((s, i) => (i === index ? { ...s, [field]: time } : s));
    onChange({ ...value, [day]: updated });
  }

  function removeSlot(day: Weekday, index: number) {
    const slots = ensureSlots(value, day);
    const filtered = slots.filter((_, i) => i !== index);
    const next = { ...value };
    if (filtered.length === 0) {
      delete next[day];
    } else {
      next[day] = filtered;
    }
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {WEEKDAYS.map((day) => {
        const slots = ensureSlots(value, day);
        const labels = WEEKDAY_LABELS[day];
        return (
          <div key={day} className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/40 p-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 sm:w-32 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/70">
                {t(labels.en, labels.hi)}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              {slots.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60 italic py-1">
                  {t("No slots set", "कोई समय निर्धारित नहीं")}
                </p>
              ) : (
                slots.map((slot, i) => {
                  const invalid = Boolean(slot.from && slot.to && slot.from >= slot.to);
                  return (
                  <div key={i} className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="time"
                        value={slot.from}
                        aria-label={t(`${labels.en} start time`, `${labels.hi} आरंभ समय`)}
                        aria-invalid={invalid}
                        onChange={(e) => updateSlot(day, i, "from", e.target.value)}
                        className={cn("h-11 w-28 rounded-lg text-xs", invalid && "border-destructive/60")}
                      />
                      <span className="text-muted-foreground text-xs">–</span>
                      <Input
                        type="time"
                        value={slot.to}
                        aria-label={t(`${labels.en} end time`, `${labels.hi} समाप्ति समय`)}
                        aria-invalid={invalid}
                        onChange={(e) => updateSlot(day, i, "to", e.target.value)}
                        className={cn("h-11 w-28 rounded-lg text-xs", invalid && "border-destructive/60")}
                      />
                      <button
                        type="button"
                        onClick={() => removeSlot(day, i)}
                        aria-label={t(`Remove ${labels.en} slot`, `${labels.hi} समय हटाएँ`)}
                        className="min-h-[44px] min-w-[44px] rounded-lg border border-border/60 bg-background flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {invalid && (
                      <p className="text-[10px] text-destructive">{t("End time must be after start time.", "समाप्ति समय आरंभ समय के बाद होना चाहिए।")}</p>
                    )}
                  </div>
                  );
                })
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addSlot(day)}
              aria-label={t(`Add ${labels.en} slot`, `${labels.hi} समय जोड़ें`)}
              className="min-h-[44px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-primary hover:text-primary"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> {t("Add", "जोड़ें")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}

// ── Display (read-only) ───────────────────────────────────────────────────────

export function WeeklyAvailabilityDisplay({
  value,
  isHi = false,
}: {
  value: WeeklyAvailability | null | undefined;
  isHi?: boolean;
}) {
  const t = useT();

  const hasSlots = WEEKDAYS.some((day) => ensureSlots(value, day).length > 0);

  if (!hasSlots) {
    return (
      <div className="flex items-center gap-2 py-2">
        <Clock className="w-4 h-4 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground/60 italic">
          {t("No weekly schedule set.", "कोई साप्ताहिक समय निर्धारित नहीं।")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {WEEKDAYS.map((day) => {
        const slots = ensureSlots(value, day);
        if (slots.length === 0) return null;
        const labels = WEEKDAY_LABELS[day];
        return (
          <div key={day} className="flex items-center gap-3">
            <span className={cn("text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-24 shrink-0", isHi && "font-devanagari")}>
              {isHi ? labels.hi : labels.en}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {slots.map((slot, i) => (
                <Badge
                  key={i}
                  className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-mono font-bold tracking-tight px-2.5 py-1"
                >
                  {slot.from} – {slot.to}
                </Badge>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
