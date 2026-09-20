import type { Tier } from "./cases";

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

// 팀 회의에서 정한 티어별 기본 모델 (basic: 저렴, deep: 안정적인 고성능).
export const TIER_DEFAULT_MODEL_ID: Record<Tier, string> = {
  basic: "gpt-5-mini",
  deep: "claude-sonnet-4-6",
};

// 대략적인 비용 감을 주기 위한 가정치. 모델별 실제 토크나이저/이미지 처리 방식과는 차이가 있다.
export const SAMPLE_TEXT_TOKENS = 500; // 텍스트 1000자 ≈ 500토큰
export const SAMPLE_IMAGE_TOKENS = 1000; // 카톡 이미지 1장 ≈ 1000토큰

// "텍스트 1000자 + 이미지 1장" 입력을 보냈을 때 드는 대략적인 비용 (출력 비용 제외).
export function estimateSampleCost(model: Model): number {
  return calcCost(model, SAMPLE_TEXT_TOKENS + SAMPLE_IMAGE_TOKENS, 0);
}
