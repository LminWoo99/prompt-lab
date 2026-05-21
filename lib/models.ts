export type ModelProvider = "anthropic" | "google";

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
    inputPricePerMToken: 0.8,
    outputPricePerMToken: 4.0,
  },
  {
    id: "gemini-2.0-flash-lite",
    label: "Gemini Flash 3.1 Lite",
    provider: "google",
    inputPricePerMToken: 0.075,
    outputPricePerMToken: 0.3,
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
