"use client";

/**
 * VishayChips — read-only display of the vishayas linked to a content item.
 * Lazily fetches links (pass `enabled={false}` to defer until visible, e.g.
 * only when a card is expanded). Renders nothing when there are no links.
 */
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/useT";
import { useVishayas, useVishayLinks, type VishayContentType } from "@/hooks/api/use-vishayas";
import { vishayaColor, vishayaIcon } from "@/lib/app/vishaya-style";

export interface VishayChipsProps {
  contentType: VishayContentType;
  contentId: string | null | undefined;
  enabled?: boolean;
  className?: string;
  /** Hide the small section label above the chips. */
  bare?: boolean;
}

export function VishayChips({ contentType, contentId, enabled = true, className, bare }: VishayChipsProps) {
  const t = useT();
  const isHi = t("en", "hi") === "hi";
  const { data: linkedIds = [] } = useVishayLinks(contentType, enabled ? contentId : null);
  const { data: vishayas = [] } = useVishayas();

  if (linkedIds.length === 0) return null;
  const linked = vishayas.filter((v) => linkedIds.includes(v.id));
  if (linked.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      {!bare && (
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("Vishay", "विषय")}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {linked.map((v) => {
          const c = vishayaColor(v.color);
          const Icon = vishayaIcon(v.icon);
          return (
            <Badge
              key={v.id}
              variant="outline"
              className={cn("gap-1 font-normal", c.bg, c.border, c.text)}
            >
              <Icon className="h-3 w-3" />
              {isHi ? v.nameHi : v.nameEn}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
