"use client";
import React from "react";
import { useT } from "@/lib/useT";

export interface MastheadContextItem {
  labelEn: string;
  labelHi: string;
  valueEn: string;
  valueHi?: string;
  detailEn: string;
  detailHi: string;
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
  lang = "en",
  className,
}: MastheadProps) {
  const t = useT();

  return (
    <div className={className ?? "mb-6"}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          {seal && (
            <p className="section-seal">{t(seal, sealHi ?? seal)}</p>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {icon && <div className="shrink-0">{icon}</div>}
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {lang === "hi" && titleHi ? titleHi : title}
              </h1>
            </div>
            {(subtitle || subtitleHi) && (
              <p className="max-w-2xl text-xs leading-5 text-muted-foreground md:text-sm md:leading-6">
                {lang === "hi" && subtitleHi ? subtitleHi : subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="lg:pb-1 shrink-0">{actions}</div>}
      </div>

      {contexts && contexts.length > 0 && (
        <div className="dashboard-context-grid sm:grid-cols-2 lg:grid-cols-3">
          {contexts.map((ctx) => (
            <div key={ctx.labelEn} className="dashboard-context-card">
              <p className="shell-copy">{t(ctx.labelEn, ctx.labelHi)}</p>
              <p className="dashboard-context-value">
                {t(ctx.valueEn, ctx.valueHi ?? ctx.valueEn)}
              </p>
              <p className="dashboard-context-detail">
                {t(ctx.detailEn, ctx.detailHi)}
              </p>
            </div>
          ))}
        </div>
      )}

      {stats && stats.length > 0 && (
        <div className="flex gap-4 mt-3">
          {stats.map((stat, i) => (
            <div key={i} className="text-sm">
              <span className="font-semibold">{stat.value}</span>{" "}
              <span className="text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
