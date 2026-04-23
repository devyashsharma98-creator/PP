"use client";

import { Download, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBonsaiLLM } from "@/hooks/use-bonsai-llm";
import { useT } from "@/lib/useT";

interface BonsaiModelLoaderProps {
  onCancel: () => void;
}

export function BonsaiModelLoader({ onCancel }: BonsaiModelLoaderProps) {
  const { status, downloadProgress, downloadedMB, totalMB, initModel } = useBonsaiLLM();
  const t = useT();

  if (status === "idle") {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground/80 font-devanagari flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-primary" />
            {t("Sahayak — Lekhan Sahayak", "सहायक — लेखन सहायक")}
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t(
              "To use this feature, the writing model (290 MB) must be downloaded once. It runs entirely in your browser — no data leaves this device.",
              "इस सुविधा के लिए लेखन मॉडल (290 MB) एक बार डाउनलोड करना होगा। यह पूरी तरह आपके ब्राउज़र में चलता है — कोई डेटा बाहर नहीं जाता।"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-[11px] gap-1.5"
            onClick={() => initModel()}
          >
            <Download className="w-3.5 h-3.5" />
            {t("Download and enable Sahayak", "सहायक डाउनलोड करें")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-[11px]"
            onClick={onCancel}
          >
            {t("Cancel", "रद्द करें")}
          </Button>
        </div>
      </div>
    );
  }

  if (status === "downloading") {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-3">
        <p className="text-xs font-semibold text-foreground/80 font-devanagari flex items-center gap-1.5">
          <Download className="w-3.5 h-3.5 text-primary animate-bounce" />
          {t("Downloading Sahayak model…", "सहायक मॉडल डाउनलोड हो रहा है…")}
        </p>
        <div className="space-y-1.5">
          <Progress value={downloadProgress} className="h-1.5" />
          <p className="text-[10px] text-muted-foreground">
            {downloadedMB} MB / {totalMB} MB · {downloadProgress}%
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          {t(
            "This downloads once and is stored in your browser.",
            "यह एक बार डाउनलोड होता है और आपके ब्राउज़र में संग्रहीत रहता है।"
          )}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-semibold text-foreground/80 font-devanagari flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-primary animate-spin" />
          {t("Loading model into memory…", "मॉडल मेमोरी में लोड हो रहा है…")}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {t("Model cached. Loading into GPU memory…", "मॉडल कैश से GPU मेमोरी में लोड हो रहा है…")}
        </p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/8 p-3 text-xs text-destructive space-y-2">
        <p className="font-semibold">
          {t("Sahayak failed to load.", "सहायक लोड नहीं हो सका।")}
        </p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-[11px]"
          onClick={() => initModel()}
        >
          {t("Retry", "पुनः प्रयास करें")}
        </Button>
      </div>
    );
  }

  return null;
}
