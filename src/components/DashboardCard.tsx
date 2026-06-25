import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DashboardCardProps = {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "saffron" | "blue" | "green" | "slate";
  onClick: () => void;
};

const toneClasses = {
  saffron: "bg-icon-primary/10 text-icon-primary ring-icon-primary/15",
  blue: "bg-icon-info/10 text-icon-info ring-icon-info/15",
  green: "bg-icon-success/10 text-icon-success ring-icon-success/15",
  slate: "bg-icon-admin/10 text-icon-admin ring-icon-admin/15",
};

export function DashboardCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "slate",
  onClick,
}: DashboardCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
    >
      <Card className="h-full border-slate-200 bg-white shadow-sm transition duration-200 group-hover:-translate-y-0.5 group-hover:border-orange-200 group-hover:shadow-md">
        <CardContent className="flex h-full items-start justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{value}</p>
            <p className="mt-2 text-sm leading-5 text-slate-500">{helper}</p>
          </div>
          <span className={cn("rounded-2xl p-3 ring-1", toneClasses[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>
    </button>
  );
}
