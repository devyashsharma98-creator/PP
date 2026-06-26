"use client";
import React, { useState } from "react";
import { ChevronUp, Info } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

export interface MastheadContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
  icon?: React.ReactNode;
}

interface MastheadProps {
  title: string;
  titleHi?: string;
  subtitle?: string;
  subtitleHi?: string;
  seal?: string;
  sealHi?: string;
  icon?: React.ReactNode;
  stats?: Array<{ label: string; value: string | number }>;
  contexts?: MastheadContextItem[];
  actions?: React.ReactNode;
  lang?: "en" | "hi";
  className?: string;
  /** When true, renders a compact single-row header. Context cards are hidden behind an Info toggle. */
  compact?: boolean;
}

function MastheadMandala() {
  const petals = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg
      viewBox="0 0 240 240"
      className="pointer-events-none absolute -right-10 -top-10 hidden h-56 w-56 text-primary md:block lg:h-64 lg:w-64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="120" cy="120" r="112" stroke="currentColor" strokeWidth="0.8" opacity="0.16" />
      <circle cx="120" cy="120" r="78" stroke="currentColor" strokeWidth="0.8" opacity="0.2" />
      <circle cx="120" cy="120" r="42" stroke="currentColor" strokeWidth="0.8" opacity="0.26" />
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="120"
          cy="62"
          rx="14"
          ry="44"
          fill="currentColor"
          fillOpacity="0.06"
          stroke="currentColor"
          strokeOpacity="0.24"
          strokeWidth="0.8"
          transform={`rotate(${angle} 120 120)`}
        />
      ))}
      <circle cx="120" cy="120" r="16" fill="currentColor" fillOpacity="0.16" />
    </svg>
  );
}

export function Masthead({
  title,
  titleHi,
  subtitle,
  subtitleHi,
  seal,
  sealHi,
  icon,
  stats,
  contexts,
  actions,
  className,
  compact = false,
}: MastheadProps) {
  const t = useT();
  const { lang: activeLang } = useAppContext();
  const showAlternateTitle = activeLang !== "hi" && titleHi && titleHi !== title;
  const [contextOpen, setContextOpen] = useState(false);

  if (compact) {
    return (
      <div className={className ?? "mb-4"}>
        <div className="flex min-h-[3rem] items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && <div className="shrink-0 text-primary">{icon}</div>}
            <div className="min-w-0">
              {seal && (
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  {t(seal, sealHi ?? seal)}
                </p>
              )}
              <h1 className="truncate text-sm font-bold tracking-tight text-foreground md:text-base">
                {t(title, titleHi ?? title)}
              </h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            {contexts && contexts.length > 0 && (
              <button
                type="button"
                onClick={() => setContextOpen((v) => !v)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
                  contextOpen
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border/60 bg-background text-muted-foreground hover:text-foreground",
                )}
                aria-label={t("Toggle context info", "संदर्भ जानकारी दिखाएँ")}
              >
                <Info className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {contextOpen && contexts && contexts.length > 0 && (
          <div className="mt-2 rounded-xl border border-border/50 bg-muted/20 p-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contexts.map((ctx) => (
                <div key={ctx.labelEn} className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {t(ctx.labelEn, ctx.labelHi)}
                  </p>
                  <p className="text-xs font-semibold text-foreground">
                    {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
                  </p>
                  <p className="text-[11px] leading-5 text-muted-foreground">
                    {t(ctx.detailEn, ctx.detailHi)}
                  </p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setContextOpen(false)}
              className="mt-3 flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="h-3 w-3" /> {t("Close", "बंद करें")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={className ?? "mb-6 space-y-5"}>
      <div className="dashboard-masthead relative overflow-hidden">
        <MastheadMandala />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            {seal && (
              sealHi && sealHi !== seal ? (
                <p className="home-editorial-eyebrow max-w-full flex-wrap whitespace-normal">
                  <span>{seal}</span>
                  <span className="font-devanagari tracking-[0.12em]">{sealHi}</span>
                </p>
              ) : (
                <p className="section-seal">{seal}</p>
              )
            )}
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {icon && <div className="shrink-0">{icon}</div>}
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-[2.125rem] lg:leading-[1.15]">
                  {t(title, titleHi ?? title)}
                </h1>
              </div>
              {showAlternateTitle && (
                <p className="font-devanagari text-base font-medium text-foreground/85 md:text-lg">
                  {titleHi}
                </p>
              )}
              {(subtitle || subtitleHi) && (
                <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                  {t(subtitle ?? "", subtitleHi ?? subtitle ?? "")}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="w-full shrink-0 lg:w-auto lg:pb-1">{actions}</div>}
        </div>

        {stats && stats.length > 0 && (
          <div className="relative mt-5 flex flex-wrap gap-4 border-t border-border/60 pt-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-sm">
                <span className="font-semibold text-foreground">{stat.value}</span>{" "}
                <span className="text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {contexts && contexts.length > 0 && (
        <div className="dashboard-context-grid sm:grid-cols-2 lg:grid-cols-3">
          {contexts.map((ctx) => (
            <div
              key={ctx.labelEn}
              className="dashboard-context-card group relative overflow-hidden p-4 md:p-5"
            >
              <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:bg-primary/10" />
              <div className="relative flex items-start gap-3">
                {ctx.icon && (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    {ctx.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="dashboard-context-label">
                    <span>{ctx.labelEn}</span>
                    <span className="font-devanagari tracking-[0.08em]">{ctx.labelHi}</span>
                  </p>
                  <p className="text-sm font-semibold leading-snug text-foreground">
                    {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
                  </p>
                  <p className="text-xs leading-5 text-muted-foreground md:text-[13px] md:leading-6">
                    {t(ctx.detailEn, ctx.detailHi)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
