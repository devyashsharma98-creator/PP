import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Network,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { FlameBell, GranthNib, VimarshCircles } from "@/components/icons/heritage-icons";
import type { IconTone } from "@/components/ui/AppIcon";

export type IconEntry = { icon: LucideIcon; tone: IconTone };

/**
 * Module identity map: route → icon + organisation tone. Single source of
 * truth for module iconography. Call-sites can opt in gradually — this does
 * NOT force migration anywhere by itself.
 */
export const MODULE_ICONS: Record<string, IconEntry> = {
  "/dashboard": { icon: LayoutDashboard, tone: "primary" },
  "/aalekh": { icon: GranthNib, tone: "primary" },
  "/prachar": { icon: Megaphone, tone: "prachar" },
  "/prachar-vishleshan": { icon: BarChart3, tone: "info" },
  "/calendar": { icon: CalendarDays, tone: "info" },
  "/impact": { icon: Trophy, tone: "warning" },
  "/directory": { icon: Users, tone: "admin" },
  "/scholars": { icon: GraduationCap, tone: "research" },
  "/ikai": { icon: Building2, tone: "yuva" },
  "/dayitv": { icon: Network, tone: "research" },
  "/vimarsh": { icon: VimarshCircles, tone: "vimarsh" },
  "/charcha": { icon: VimarshCircles, tone: "vimarsh" },
  "/library": { icon: BookOpen, tone: "sanskriti" },
  "/super-admin": { icon: ShieldCheck, tone: "admin" },
};

export function getModuleIcon(path: string): IconEntry | undefined {
  return MODULE_ICONS[path];
}

/**
 * Notification kind → icon + tone + bilingual label. Replaces the previous
 * raw-Tailwind colour mapping (text-blue-500, text-purple-500, …) with
 * organisation tones.
 */
export type NotificationKindEntry = IconEntry & { label: string; labelHi: string };

export const NOTIFICATION_KINDS: Record<string, NotificationKindEntry> = {
  event_status_change: { icon: CalendarDays, tone: "info", label: "Event", labelHi: "कार्यक्रम" },
  article_status_change: { icon: GranthNib, tone: "primary", label: "Article", labelHi: "आलेख" },
  review_assigned: { icon: ClipboardCheck, tone: "sanskriti", label: "Review", labelHi: "समीक्षा" },
  review_completed: { icon: CheckCheck, tone: "success", label: "Review Done", labelHi: "समीक्षा पूर्ण" },
  poll_finalized: { icon: VimarshCircles, tone: "vimarsh", label: "Poll", labelHi: "मतदान" },
  registration_received: { icon: UserPlus, tone: "success", label: "Registration", labelHi: "पंजीकरण" },
  mention: { icon: MessageSquare, tone: "prachar", label: "Mention", labelHi: "उल्लेख" },
  system: { icon: FlameBell, tone: "muted", label: "System", labelHi: "सिस्टम" },
};

export const DEFAULT_NOTIFICATION_KIND: NotificationKindEntry = {
  icon: FlameBell,
  tone: "primary",
  label: "Notification",
  labelHi: "सूचना",
};

export function getNotificationKind(kind: string): NotificationKindEntry {
  return NOTIFICATION_KINDS[kind] ?? DEFAULT_NOTIFICATION_KIND;
}
