"use client";

import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBonsaiLLM } from "@/hooks/use-bonsai-llm";
import { useT } from "@/lib/useT";
import { cn } from "@/lib/utils";

interface BonsaiAssistButtonProps {
  label?: string;
  labelHi?: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function BonsaiAssistButton({
  label,
  labelHi,
  onClick,
  disabled,
  className,
}: BonsaiAssistButtonProps) {
  const { status, isWebGPUSupported } = useBonsaiLLM();
  const t = useT();

  const isUnavailable = status === "unavailable" || !isWebGPUSupported;
  const isLoading =
    status === "downloading" || status === "loading";
  const isGenerating = status === "generating";
  const isReady = status === "ready";

  const displayLabel = label
    ? t(label, labelHi ?? label)
    : t("Sahayak", "सहायक");

  const button = (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-7 gap-1 border border-primary/20 px-2 text-[10px] text-primary hover:bg-primary/5",
        isUnavailable && "opacity-40 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={isUnavailable || isLoading || isGenerating || disabled}
      type="button"
    >
      {isLoading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <span className="relative inline-flex">
          <Sparkles className="h-3 w-3" />
          {isReady && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-500" />
          )}
          {isGenerating && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          )}
        </span>
      )}
      {displayLabel}
    </Button>
  );

  if (isUnavailable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {t(
              "Requires Chrome or Edge 113+ with WebGPU",
              "Chrome या Edge 113+ आवश्यक है"
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
