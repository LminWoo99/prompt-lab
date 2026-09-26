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

// 대화 내용만 추출한다. [관계 유형]/[티어]는 요청 시점에 현재 선택값으로 붙인다
// (텍스트에 박아두면 드롭다운을 나중에 바꿔도 안 따라가는 문제가 있었음).
export function formatCaseAsInput(caseData: CaseData): string {
  return caseData.messages.map((m) => `${m.speaker}: ${m.text}`).join("\n");
}
