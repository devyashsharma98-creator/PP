"use client";

/**
 * Icon Lab body — Phase 2A/2B review surface for the custom hero icons.
 * Rendered only in non-production via the server guard in page.tsx.
 * Standalone, NOT linked from navigation. Review-only; safe to delete.
 */

import type { ComponentProps } from "react";
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Network,
  PenLine,
  Vote,
  type LucideIcon,
} from "lucide-react";

import {
  BinduNetwork,
  FlameBell,
  GranthNib,
  VimarshCircles,
  type HeritageIcon,
} from "@/components/icons/heritage-icons";
import { AppIcon, type IconTone } from "@/components/ui/AppIcon";

/* ── Phase-2A "old" variants, kept local for before/after only ──────────────── */
function rawSvg(props: ComponentProps<"svg">) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function OldGranthNib(props: ComponentProps<"svg">) {
  return rawSvg({
    ...props,
    children: (
      <>
        <path d="M12 7C10.3 5.8 8 5.4 4.4 6v11c3.6-.6 5.9-.2 7.6 1" />
        <path d="M12 7c1.7-1.2 4-1.6 7.6-1v11c-3.6-.6-5.9-.2-7.6 1" />
        <path d="M12 7 10.8 4.4 12 2.8l1.2 1.6Z" />
        <path d="M12 4.3v2" />
      </>
    ),
  });
}

function OldBinduNetwork(props: ComponentProps<"svg">) {
  return rawSvg({
    ...props,
    children: (
      <>
        <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
        <circle cx="12" cy="3.8" r="1.35" />
        <circle cx="5.4" cy="16.2" r="1.35" />
        <circle cx="18.6" cy="16.2" r="1.35" />
        <path d="M11.8 10.4c-.5-1.9-.4-3.6.2-5.2" />
        <path d="M10.8 12.9c-1.8 1.1-3.4 1.7-4.4 2.3" />
        <path d="M13.2 12.9c1.8 1.1 3.4 1.7 4.4 2.3" />
      </>
    ),
  });
}

type AnyIcon = (props: ComponentProps<"svg">) => React.ReactNode;

type Hero = {
  name: string;
  hindi: string;
  meaning: string;
  Icon: HeritageIcon;
  tone: IconTone;
  badge: string;
  status: string;
  lucide: { label: string; Icon: LucideIcon }[];
};

const HEROES: Hero[] = [
  {
    name: "FlameBell",
    hindi: "दीप-घंटी",
    meaning: "Notification + steady wisdom flame",
    Icon: FlameBell,
    tone: "primary",
    badge: "bg-icon-primary/10 text-icon-primary ring-icon-primary/15",
    status: "approved · unchanged",
    lucide: [{ label: "Bell", Icon: Bell }],
  },
  {
    name: "GranthNib",
    hindi: "ग्रंथ-लेखनी",
    meaning: "Articles / Aalekh / knowledge creation",
    Icon: GranthNib,
    tone: "sanskriti",
    badge: "bg-icon-sanskriti/10 text-icon-sanskriti ring-icon-sanskriti/15",
    status: "refined (2B)",
    lucide: [
      { label: "PenLine", Icon: PenLine },
      { label: "BookOpen", Icon: BookOpen },
    ],
  },
  {
    name: "VimarshCircles",
    hindi: "विमर्श",
    meaning: "Dialogue / discussion / poll",
    Icon: VimarshCircles,
    tone: "vimarsh",
    badge: "bg-icon-vimarsh/10 text-icon-vimarsh ring-icon-vimarsh/15",
    status: "approved · unchanged",
    lucide: [
      { label: "MessageSquare", Icon: MessageSquare },
      { label: "Vote", Icon: Vote },
    ],
  },
  {
    name: "BinduNetwork",
    hindi: "बिंदु-प्रवाह",
    meaning: "Org identity / knowledge-flow / network",
    Icon: BinduNetwork,
    tone: "research",
    badge: "bg-icon-research/10 text-icon-research ring-icon-research/15",
    status: "redesigned (2B)",
    lucide: [
      { label: "Network", Icon: Network },
      { label: "LayoutDashboard", Icon: LayoutDashboard },
    ],
  },
];

const SIZE_CLASS = ["h-4 w-4", "h-5 w-5", "h-6 w-6"];
const SIZE_LABEL = ["16px", "20px", "24px"];

function SizeRow({ Icon, toneClass }: { Icon: AnyIcon; toneClass: string }) {
  return (
    <div className="flex items-end gap-4">
      {SIZE_CLASS.map((c, i) => (
        <div key={c} className="flex flex-col items-center gap-1">
          <Icon className={`${c} ${toneClass} shrink-0`} strokeWidth={1.75} aria-hidden />
          <span className="text-[10px] text-muted-foreground">{SIZE_LABEL[i]}</span>
        </div>
      ))}
    </div>
  );
}

function BeforeAfter({
  title,
  Old,
  New,
  toneClass,
}: {
  title: string;
  Old: AnyIcon;
  New: AnyIcon;
  toneClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-dashed border-border p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Before (2A)
          </p>
          <SizeRow Icon={Old} toneClass={toneClass} />
        </div>
        <div className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-foreground">
            After (2B)
          </p>
          <SizeRow Icon={New} toneClass={toneClass} />
        </div>
      </div>
    </div>
  );
}

function HeroCard({ hero }: { hero: Hero }) {
  const { Icon, tone, badge } = hero;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {hero.name} <span className="font-devanagari text-muted-foreground">· {hero.hindi}</span>
          </h3>
          <p className="text-xs text-muted-foreground">{hero.meaning}</p>
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          {hero.status}
        </span>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Sizes</p>
        <div className="flex items-end gap-5">
          {(["sm", "md", "lg"] as const).map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <AppIcon icon={Icon} tone={tone} size={s} label={hero.name} />
              <span className="text-[10px] text-muted-foreground">{SIZE_LABEL[i]}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1">
            <Icon className="h-6 w-6 text-foreground shrink-0" strokeWidth={1.75} aria-hidden />
            <span className="text-[10px] text-muted-foreground">ink</span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          vs current Lucide
        </p>
        <div className="flex items-end gap-5">
          <div className="flex flex-col items-center gap-1">
            <AppIcon icon={Icon} tone={tone} size="lg" label={hero.name} />
            <span className="text-[10px] text-foreground">{hero.name}</span>
          </div>
          {hero.lucide.map((l) => (
            <div key={l.label} className="flex flex-col items-center gap-1">
              <AppIcon icon={l.Icon} tone="muted" size="lg" />
              <span className="text-[10px] text-muted-foreground">{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">In context</p>

        <div className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <AppIcon icon={Icon} tone={tone} size="sm" label={hero.name} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug text-foreground">{hero.meaning}</p>
            <p className="text-[10px] text-muted-foreground">2h ago · notification row</p>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{hero.name}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">24</p>
          </div>
          <span className={`rounded-2xl p-3 ring-1 ${badge}`}>
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} aria-hidden />
          </span>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-[hsl(var(--sidebar-background))] px-3 py-2.5 text-[hsl(var(--sidebar-foreground))]">
          <Icon className="h-5 w-5 shrink-0 text-[hsl(var(--sidebar-primary))]" strokeWidth={1.75} aria-hidden />
          <span className="text-sm">{hero.name}</span>
        </div>
      </div>
    </div>
  );
}

function LabBody() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="text-xl font-semibold text-foreground">Hero Icon Lab — Phase 2B</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Custom Pragya Pravah hero icons · strokeWidth 1.75 · currentColor · review-only
      </p>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Before / After (2B refinements)
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <BeforeAfter title="GranthNib — nib enlarged, slit removed" Old={OldGranthNib} New={GranthNib} toneClass="text-icon-sanskriti" />
        <BeforeAfter title="BinduNetwork — 4 nodes, cross-linked, off-centre" Old={OldBinduNetwork} New={BinduNetwork} toneClass="text-icon-research" />
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Full set in context
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {HEROES.map((h) => (
          <HeroCard key={h.name} hero={h} />
        ))}
      </div>
    </div>
  );
}

export function IconLabClient() {
  return (
    <div>
      <section className="bg-background text-foreground">
        <div className="mx-auto max-w-6xl px-6 pt-6">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            LIGHT MODE
          </span>
        </div>
        <LabBody />
      </section>

      {/* Dark — `.dark` re-scopes the design tokens for this subtree */}
      <section className="dark">
        <div className="bg-background text-foreground">
          <div className="mx-auto max-w-6xl px-6 pt-6">
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              DARK MODE
            </span>
          </div>
          <LabBody />
        </div>
      </section>
    </div>
  );
}
