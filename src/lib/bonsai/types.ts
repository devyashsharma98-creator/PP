export type BonsaiStatus =
  | "unavailable"
  | "idle"
  | "downloading"
  | "loading"
  | "ready"
  | "generating"
  | "error";

export interface BonsaiEngineState {
  status: BonsaiStatus;
  downloadProgress: number;
  downloadedMB: number;
  totalMB: number;
  currentOutput: string;
  isWebGPUSupported: boolean;
  errorMessage?: string;
}

export interface BonsaiPrompt {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  onToken?: (token: string, fullText: string) => void;
}

export interface BonsaiContextValue extends BonsaiEngineState {
  initModel: () => Promise<void>;
  generate: (prompt: BonsaiPrompt) => Promise<string>;
  abort: () => void;
}
