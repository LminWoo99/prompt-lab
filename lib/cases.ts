export interface CaseMessage {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface CaseData {
  id: string;
  relationship_type: string;
  situation_memo: string;
  speaker_user: string;
  speaker_other: string;
  messages: CaseMessage[];
  expected_read: Record<string, unknown>;
}

export const TIERS = ["basic", "deep"] as const;
export type Tier = (typeof TIERS)[number];

// core.md의 [관계 유형]/[티어]/[대화 내용] 입력 형식에 맞춰 케이스를 변환한다.
export function formatCaseAsInput(caseData: CaseData, relationLabel: string, tier: Tier = "basic"): string {
  const conversation = caseData.messages.map((m) => `${m.speaker}: ${m.text}`).join("\n");
  return `[관계 유형] ${relationLabel}\n[티어] ${tier}\n[대화 내용]\n${conversation}`;
}
