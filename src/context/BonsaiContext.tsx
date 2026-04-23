"use client";

import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { BONSAI_TOTAL_MB, type MLCEngine } from "@/lib/bonsai/engine";
import type { BonsaiContextValue, BonsaiEngineState, BonsaiPrompt } from "@/lib/bonsai/types";

export const BonsaiContext = createContext<BonsaiContextValue | null>(null);

export function BonsaiProvider({ children }: { children: React.ReactNode }) {
  const engineRef = useRef<MLCEngine | null>(null);
  const abortRef = useRef(false);

  const [state, setState] = useState<BonsaiEngineState>({
    status: "idle",
    downloadProgress: 0,
    downloadedMB: 0,
    totalMB: BONSAI_TOTAL_MB,
    currentOutput: "",
    isWebGPUSupported: false,
  });

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      "gpu" in navigator &&
      navigator.gpu !== null;
    setState((s) => ({
      ...s,
      status: supported ? "idle" : "unavailable",
      isWebGPUSupported: supported,
    }));
  }, []);

  const initModel = useCallback(async () => {
    if (
      state.status === "ready" ||
      state.status === "downloading" ||
      state.status === "loading" ||
      state.status === "unavailable"
    )
      return;

    setState((s) => ({ ...s, status: "downloading", downloadProgress: 0, errorMessage: undefined }));

    try {
      const { createBonsaiEngine } = await import("@/lib/bonsai/engine");
      const engine = await createBonsaiEngine((progress) => {
        const pct = Math.round(progress.progress * 100);
        setState((s) => ({
          ...s,
          downloadProgress: pct,
          downloadedMB: Math.round((pct / 100) * BONSAI_TOTAL_MB),
          status: pct < 100 ? "downloading" : "loading",
        }));
      });
      engineRef.current = engine;
      setState((s) => ({
        ...s,
        status: "ready",
        downloadProgress: 100,
        downloadedMB: BONSAI_TOTAL_MB,
      }));
      // remember across visits so the button shows "ready" on next load
      try { localStorage.setItem("bonsai_model_cached", "true"); } catch { /* ignore */ }
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        errorMessage: err instanceof Error ? err.message : "Model failed to load",
      }));
    }
  }, [state.status]);

  const generate = useCallback(
    async (prompt: BonsaiPrompt): Promise<string> => {
      if (!engineRef.current || state.status !== "ready") return "";

      abortRef.current = false;
      setState((s) => ({ ...s, status: "generating", currentOutput: "" }));

      let full = "";
      try {
        const stream = await engineRef.current.chat.completions.create({
          messages: [
            { role: "system", content: prompt.systemPrompt },
            { role: "user", content: prompt.userMessage },
          ],
          max_tokens: prompt.maxTokens ?? 600,
          temperature: prompt.temperature ?? 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          if (abortRef.current) {
            engineRef.current.interruptGenerate?.();
            break;
          }
          const token: string = chunk.choices[0]?.delta?.content ?? "";
          full += token;
          setState((s) => ({ ...s, currentOutput: full }));
          prompt.onToken?.(token, full);
        }
      } catch (err) {
        if (!abortRef.current) {
          setState((s) => ({
            ...s,
            status: "error",
            currentOutput: "",
            errorMessage: err instanceof Error ? err.message : "Generation failed",
          }));
          return "";
        }
      }

      setState((s) => ({ ...s, status: "ready", currentOutput: "" }));
      return full;
    },
    [state.status]
  );

  const abort = useCallback(() => {
    abortRef.current = true;
  }, []);

  return (
    <BonsaiContext.Provider value={{ ...state, initModel, generate, abort }}>
      {children}
    </BonsaiContext.Provider>
  );
}
