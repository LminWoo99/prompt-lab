export type ModelProvider = "anthropic" | "google" | "openai" | "deepseek";

export interface Model {
  id: string;
  label: string;
  provider: ModelProvider;
  inputPricePerMToken: number;
  outputPricePerMToken: number;
}

export const MODELS: Model[] = [
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    provider: "anthropic",
    inputPricePerMToken: 3.0,
    outputPricePerMToken: 15.0,
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    provider: "anthropic",
    inputPricePerMToken: 1.0,
    outputPricePerMToken: 5.0,
  },
  // gemini-2.0-flash-lite는 구글이 폐지함 (404, gemini-3.5-flash-lite로 이전 권고) — 제거함
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    provider: "anthropic",
    inputPricePerMToken: 2.0,
    outputPricePerMToken: 10.0,
  },
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek v4-pro",
    provider: "deepseek",
    inputPricePerMToken: 0.435,
    outputPricePerMToken: 0.87,
  },
  {
    id: "deepseek-v4-flash",
    label: "DeepSeek v4-flash",
    provider: "deepseek",
    inputPricePerMToken: 0.14,
    outputPricePerMToken: 0.28,
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5-mini",
    provider: "openai",
    inputPricePerMToken: 0.25,
    outputPricePerMToken: 2.0,
  },
  {
    id: "gpt-5-nano",
    label: "GPT-5-nano",
    provider: "openai",
    inputPricePerMToken: 0.05,
    outputPricePerMToken: 0.4,
  },
  {
    id: "gemini-3.5-flash-lite",
    label: "Gemini 3.5 Flash-Lite",
    provider: "google",
    inputPricePerMToken: 0.3,
    outputPricePerMToken: 2.5,
  },
];

export function calcCost(
  model: Model,
  inputTokens: number,
  outputTokens: number
): number {
  return (
    (inputTokens / 1_000_000) * model.inputPricePerMToken +
    (outputTokens / 1_000_000) * model.outputPricePerMToken
  );
}
