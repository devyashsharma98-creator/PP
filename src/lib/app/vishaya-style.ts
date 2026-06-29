/**
 * Shared style + icon resolution for the Vishay (विषय) taxonomy.
 *
 * Vishayas store a `color` token key and an `icon` (lucide name) as strings in
 * the DB. This module turns those strings into concrete Tailwind classes and
 * lucide components so the page and the selector stay visually consistent.
 */
import {
  ArrowLeftRight,
  BookMarked,
  BrainCircuit,
  Building2,
  FlaskConical,
  Flame,
  Globe,
  GraduationCap,
  Hash,
  Heart,
  HeartHandshake,
  Landmark,
  Languages,
  Leaf,
  Map,
  Newspaper,
  Palette,
  Scale,
  Scroll,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

export type VishayaColorClasses = {
  text: string;
  border: string;
  bg: string;
  dot: string;
};

// Token key → Tailwind classes. Keys must match the `color` values seeded in
// src/db/seed-vishaya.ts and offered in the create/edit form.
export const VISHAYA_COLORS: Record<string, VishayaColorClasses> = {
  slate: { text: "text-slate-600 dark:text-slate-300", border: "border-slate-500/30", bg: "bg-slate-500/10", dot: "bg-slate-500" },
  blue: { text: "text-blue-600 dark:text-blue-300", border: "border-blue-500/30", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  indigo: { text: "text-indigo-600 dark:text-indigo-300", border: "border-indigo-500/30", bg: "bg-indigo-500/10", dot: "bg-indigo-500" },
  violet: { text: "text-violet-600 dark:text-violet-300", border: "border-violet-500/30", bg: "bg-violet-500/10", dot: "bg-violet-500" },
  purple: { text: "text-purple-600 dark:text-purple-300", border: "border-purple-500/30", bg: "bg-purple-500/10", dot: "bg-purple-500" },
  fuchsia: { text: "text-fuchsia-600 dark:text-fuchsia-300", border: "border-fuchsia-500/30", bg: "bg-fuchsia-500/10", dot: "bg-fuchsia-500" },
  pink: { text: "text-pink-600 dark:text-pink-300", border: "border-pink-500/30", bg: "bg-pink-500/10", dot: "bg-pink-500" },
  rose: { text: "text-rose-600 dark:text-rose-300", border: "border-rose-500/30", bg: "bg-rose-500/10", dot: "bg-rose-500" },
  red: { text: "text-red-600 dark:text-red-300", border: "border-red-500/30", bg: "bg-red-500/10", dot: "bg-red-500" },
  orange: { text: "text-orange-600 dark:text-orange-300", border: "border-orange-500/30", bg: "bg-orange-500/10", dot: "bg-orange-500" },
  amber: { text: "text-amber-600 dark:text-amber-300", border: "border-amber-500/30", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  green: { text: "text-green-600 dark:text-green-300", border: "border-green-500/30", bg: "bg-green-500/10", dot: "bg-green-500" },
  emerald: { text: "text-emerald-600 dark:text-emerald-300", border: "border-emerald-500/30", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  teal: { text: "text-teal-600 dark:text-teal-300", border: "border-teal-500/30", bg: "bg-teal-500/10", dot: "bg-teal-500" },
  cyan: { text: "text-cyan-600 dark:text-cyan-300", border: "border-cyan-500/30", bg: "bg-cyan-500/10", dot: "bg-cyan-500" },
  sky: { text: "text-sky-600 dark:text-sky-300", border: "border-sky-500/30", bg: "bg-sky-500/10", dot: "bg-sky-500" },
};

export const VISHAYA_COLOR_KEYS = Object.keys(VISHAYA_COLORS);

export function vishayaColor(color: string | null | undefined): VishayaColorClasses {
  return VISHAYA_COLORS[color ?? "slate"] ?? VISHAYA_COLORS.slate;
}

// Lucide name → component. Offered in the create/edit form.
export const VISHAYA_ICONS: Record<string, LucideIcon> = {
  Hash,
  Users,
  Landmark,
  TrendingUp,
  Scroll,
  BrainCircuit,
  BookMarked,
  Scale,
  Map,
  Leaf,
  Newspaper,
  Globe,
  HeartHandshake,
  Languages,
  ArrowLeftRight,
  Flame,
  Palette,
  GraduationCap,
  FlaskConical,
  Sparkles,
  Heart,
  Building2,
};

export const VISHAYA_ICON_KEYS = Object.keys(VISHAYA_ICONS);

export function vishayaIcon(icon: string | null | undefined): LucideIcon {
  return VISHAYA_ICONS[icon ?? "Hash"] ?? Hash;
}
