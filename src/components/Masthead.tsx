"use client";
import React from "react";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";

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
}: MastheadProps) {
  const t = useT();
  const { lang: activeLang } = useAppContext();
  const showAlternateTitle = activeLang !== "hi" && titleHi && titleHi !== title;

  return (
    <div className={className ?? "mb-6 space-y-5"}>
      <div className="dashboard-masthead relative overflow-hidden">
        <MastheadMandala />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            {seal && (
              sealHi && sealHi !== seal ? (
                <p className="home-editorial-eyebrow">
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
          {actions && <div className="shrink-0 lg:pb-1">{actions}</div>}
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
                  <p className="home-editorial-eyebrow !px-2.5 !py-1 !text-[10px] !tracking-[0.16em]">
                    <span>{ctx.labelEn}</span>
                    <span className="font-devanagari tracking-[0.1em]">{ctx.labelHi}</span>
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
