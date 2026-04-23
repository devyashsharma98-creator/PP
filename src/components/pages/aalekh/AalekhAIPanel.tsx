"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useBonsaiLLM } from "@/hooks/use-bonsai-llm";
import { useAppContext } from "@/context/AppContext";
import { useT } from "@/lib/useT";
import { BonsaiAssistButton } from "@/components/bonsai/BonsaiAssistButton";
import { BonsaiModelLoader } from "@/components/bonsai/BonsaiModelLoader";
import { BonsaiStreamingPanel } from "@/components/bonsai/BonsaiStreamingPanel";
import { BonsaiCompatCheck } from "@/components/bonsai/BonsaiCompatCheck";
import {
  aalekhSystemPrompt,
  aalekhImproveUser,
  aalekhSummaryUser,
  aalekhHeadlineUser,
  aalekhValuesUser,
} from "@/lib/bonsai/prompts";
import type { Lang } from "@/lib/app/contracts";

type AalekhMode = "improve" | "summary" | "headlines" | "values" | null;

interface AalekhAIPanelProps {
  content: string;
  category: string;
  onAcceptContent: (text: string) => void;
  onAcceptSummary: (text: string) => void;
  onAcceptTitle: (text: string) => void;
}

// Parse a numbered-list response and return individual items
function parseNumberedList(text: string): string[] {
  return text
    .split(/\n/)
    .map((l) => l.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter(Boolean);
}

export function AalekhAIPanel({
  content,
  category,
  onAcceptContent,
  onAcceptSummary,
  onAcceptTitle,
}: AalekhAIPanelProps) {
  const { status, generate, initModel } = useBonsaiLLM();
  const { lang } = useAppContext();
  const t = useT();

  const [mode, setMode] = useState<AalekhMode>(null);
  const [output, setOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [headlineItems, setHeadlineItems] = useState<string[]>([]);
  const [valuesWarning, setValuesWarning] = useState<string | null>(null);

  const needsLoader =
    status === "idle" || status === "downloading" || status === "loading" || status === "error";

  const runGenerate = async (selectedMode: AalekhMode) => {
    if (!selectedMode) return;
    if (!content.trim()) return;

    // If model not ready, trigger init first
    if (status === "idle" || status === "error") {
      setMode(selectedMode);
      await initModel();
      return;
    }
    if (status !== "ready") return;

    setMode(selectedMode);
    setOutput("");
    setHeadlineItems([]);
    setValuesWarning(null);
    setIsGenerating(true);

    const sysPrompt = aalekhSystemPrompt(lang as Lang, category);

    let userMsg: string;
    switch (selectedMode) {
      case "improve":
        userMsg = aalekhImproveUser(lang as Lang, content);
        break;
      case "summary":
        userMsg = aalekhSummaryUser(lang as Lang, content);
        break;
      case "headlines":
        userMsg = aalekhHeadlineUser(lang as Lang, content);
        break;
      case "values":
        userMsg = aalekhValuesUser(content);
        break;
    }

    const result = await generate({
      systemPrompt: sysPrompt,
      userMessage: userMsg,
      maxTokens: selectedMode === "improve" ? 700 : selectedMode === "headlines" ? 120 : 200,
      temperature: selectedMode === "values" ? 0.3 : 0.7,
      onToken: (_token, full) => setOutput(full),
    });

    setIsGenerating(false);

    if (selectedMode === "headlines") {
      setHeadlineItems(parseNumberedList(result));
    } else if (selectedMode === "values") {
      const isClean = result.toLowerCase().includes("no concerns identified");
      setValuesWarning(isClean ? null : result);
    }

    setOutput(result);
  };

  const handleCancel = () => {
    setMode(null);
    setOutput("");
    setIsGenerating(false);
  };

  const handleDiscard = () => {
    setOutput("");
    setMode(null);
    setHeadlineItems([]);
    setValuesWarning(null);
  };

  const noContent = !content.trim();

  return (
    <div className="space-y-2 pt-1">
      <BonsaiCompatCheck />

      {/* Action row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold mr-1">
          {t("Sahayak", "सहायक")}
        </span>
        <BonsaiAssistButton
          label="Improve Draft"
          labelHi="प्रारूप सुधारें"
          onClick={() => runGenerate("improve")}
          disabled={noContent || isGenerating}
        />
        <BonsaiAssistButton
          label="Write Summary"
          labelHi="सारांश लिखें"
          onClick={() => runGenerate("summary")}
          disabled={noContent || isGenerating}
        />
        <BonsaiAssistButton
          label="Suggest Headlines"
          labelHi="शीर्षक सुझाएं"
          onClick={() => runGenerate("headlines")}
          disabled={noContent || isGenerating}
        />
        <BonsaiAssistButton
          label="Values Check"
          labelHi="मर्यादा जांच"
          onClick={() => runGenerate("values")}
          disabled={noContent || isGenerating}
        />
      </div>

      {/* Model download/loading panel */}
      {needsLoader && mode !== null && (
        <BonsaiModelLoader onCancel={handleCancel} />
      )}

      {/* Headlines picker */}
      {mode === "headlines" && headlineItems.length > 0 && !isGenerating && (
        <div className="rounded-lg border border-primary/20 bg-primary/3 p-3 space-y-1.5 mt-2">
          <p className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">
            {t("Select a headline", "शीर्षक चुनें")}
          </p>
          {headlineItems.map((h, i) => (
            <button
              key={i}
              className="w-full text-left text-xs px-2 py-1.5 rounded border border-transparent hover:border-primary/30 hover:bg-primary/5 transition-colors text-foreground/80"
              onClick={() => {
                onAcceptTitle(h);
                handleDiscard();
              }}
            >
              {h}
            </button>
          ))}
          <button
            onClick={handleDiscard}
            className="text-[10px] text-muted-foreground hover:text-foreground mt-1"
          >
            {t("Discard", "अस्वीकार करें")}
          </button>
        </div>
      )}

      {/* Values check advisory */}
      {mode === "values" && !isGenerating && valuesWarning && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/8 p-3 space-y-1.5 mt-2">
          <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            {t("Editorial Advisory", "संपादकीय सलाह")}
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/70 whitespace-pre-wrap">
            {valuesWarning}
          </p>
          <button
            onClick={handleDiscard}
            className="text-[10px] text-muted-foreground hover:text-foreground"
          >
            {t("Dismiss", "बंद करें")}
          </button>
        </div>
      )}

      {/* Values check — clean */}
      {mode === "values" && !isGenerating && !valuesWarning && output && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/8 p-2.5 text-xs text-green-700 dark:text-green-400 flex items-center gap-2 mt-2">
          <span>✓</span>
          <span>{t("No editorial concerns identified.", "कोई संपादकीय आपत्ति नहीं पाई गई।")}</span>
          <button onClick={handleDiscard} className="ml-auto text-[10px] opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Streaming output for improve/summary */}
      {(mode === "improve" || mode === "summary") && (
        <BonsaiStreamingPanel
          output={output}
          isGenerating={isGenerating}
          onAccept={(text) => {
            if (mode === "improve") onAcceptContent(text);
            if (mode === "summary") onAcceptSummary(text);
            handleDiscard();
          }}
          onDiscard={handleDiscard}
          label={
            mode === "improve"
              ? t("Improved Draft", "परिष्कृत प्रारूप")
              : t("Generated Summary", "तैयार सारांश")
          }
        />
      )}

      {/* Streaming cursor for headlines/values while generating */}
      {(mode === "headlines" || mode === "values") && isGenerating && (
        <div className="rounded-lg border border-border/50 bg-muted/20 p-3 mt-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-3.5 bg-primary/60 animate-pulse" />
            {t("Sahayak is thinking…", "सहायक सोच रहा है…")}
          </p>
        </div>
      )}
    </div>
  );
}
