// Dynamic import only — never executed during SSR.
// All consumers must import this via a useEffect or dynamic() boundary.

export const BONSAI_MODEL_ID = "SmolLM2-1.7B-Instruct-q0f16-MLC";
export const BONSAI_TOTAL_MB = 290;

export type ProgressCallback = (progress: {
  progress: number;
  text: string;
}) => void;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MLCEngine = any;

export async function createBonsaiEngine(
  onProgress: ProgressCallback
): Promise<MLCEngine> {
  const { CreateMLCEngine } = await import("@mlc-ai/web-llm");
  return CreateMLCEngine(BONSAI_MODEL_ID, {
    initProgressCallback: onProgress,
  });
}
