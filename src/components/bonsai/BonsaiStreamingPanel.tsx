"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Square, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBonsaiLLM } from "@/hooks/use-bonsai-llm";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { repairBrokenHindi } from "@/lib/useT";
import { cn } from "@/lib/utils";

interface BonsaiStreamingPanelProps {
  output: string;
  isGenerating: boolean;
  onAccept: (text: string) => void;
  onDiscard: () => void;
  label?: string;
}

export function BonsaiStreamingPanel({
  output,
  isGenerating,
  onAccept,
  onDiscard,
  label,
}: BonsaiStreamingPanelProps) {
  const { abort } = useBonsaiLLM();
  const { lang } = useAppContext();
  const t = useT();

  const displayText =
    lang === "hi" ? repairBrokenHindi(output) : output;

  return (
    <AnimatePresence>
      {(isGenerating || output) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="rounded-lg border border-primary/20 bg-primary/3 p-3 space-y-2 mt-2">
            {label && (
              <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">
                {label}
              </p>
            )}

            <div
              className={cn(
                "text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap min-h-[3rem]",
                lang === "hi" && "font-devanagari"
              )}
            >
              {displayText}
              {isGenerating && (
                <span className="inline-block w-1.5 h-3.5 bg-primary/60 ml-0.5 animate-pulse align-middle" />
              )}
            </div>

            <div className="flex items-center gap-1.5 pt-1 border-t border-primary/10">
              {isGenerating ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 gap-1 px-2 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/8"
                  onClick={abort}
                >
                  <Square className="w-2.5 h-2.5" />
                  {t("Stop", "रोकें")}
                </Button>
              ) : (
                <>
                  <Button
                    size="sm"
                    className="h-6 gap-1 px-2 text-[10px]"
                    onClick={() => onAccept(displayText)}
                  >
                    <Check className="w-2.5 h-2.5" />
                    {t("Accept", "स्वीकार करें")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 px-2 text-[10px] text-muted-foreground"
                    onClick={onDiscard}
                  >
                    <X className="w-2.5 h-2.5" />
                    {t("Discard", "अस्वीकार करें")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
