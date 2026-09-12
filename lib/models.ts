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
    inputPricePerMToken: 0.8,
    outputPricePerMToken: 4.0,
  },
  // gemini-2.0-flash-lite는 구글이 폐지함 (404, gemini-3.5-flash-lite로 이전 권고) — 제거함
  {
    id: "claude-sonnet-5",
    label: "Claude Sonnet 5",
    provider: "anthropic",
    inputPricePerMToken: 3.0,
    outputPricePerMToken: 15.0,
  },
  // TODO: 아래 3개는 정확한 단가를 확인하지 못해 잠정치입니다 — 확인 후 수정 필요
  {
    id: "deepseek-v4-pro",
    label: "DeepSeek v4-pro",
    provider: "deepseek",
    inputPricePerMToken: 0.27,
    outputPricePerMToken: 1.1,
  },
  {
    id: "gpt-5-mini",
    label: "GPT-5-mini",
    provider: "openai",
    inputPricePerMToken: 0.25,
    outputPricePerMToken: 2.0,
  },
  // TODO: gemini-3.5-flash-lite는 계정 Prepay 결제 이슈로 API 호출이 막혀있어 임시 비활성화.
  // 결제 충전 후 아래 주석 해제.
  // {
  //   id: "gemini-3.5-flash-lite",
  //   label: "Gemini 3.5 Flash-Lite",
  //   provider: "google",
  //   inputPricePerMToken: 0.1,
  //   outputPricePerMToken: 0.4,
  // },
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
