/**
 * Icon + colour resolution for intellectual event types.
 * Colours reuse the vishaya palette for a consistent institutional system.
 */
import { BookOpen, Tent, GraduationCap, Users, Mic, BookMarked, CalendarDays, type LucideIcon } from "lucide-react";
import { vishayaColor, type VishayaColorClasses } from "./vishaya-style";
import { getEventType } from "./event-types";

const EVENT_ICONS: Record<string, LucideIcon> = {
  BookOpen, Tent, GraduationCap, Users, Mic, BookMarked, CalendarDays,
};

export function eventTypeIcon(typeKey: string | null | undefined): LucideIcon {
  const def = getEventType(typeKey);
  return (def && EVENT_ICONS[def.icon]) || CalendarDays;
}

export function eventTypeColor(typeKey: string | null | undefined): VishayaColorClasses {
  const def = getEventType(typeKey);
  return vishayaColor(def?.color);
}
