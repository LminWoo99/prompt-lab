import type { RelationId } from "@/lib/relations";

export const GOAL_IDS = ["hidden_intent", "relationship_decision", "reply_strategy"] as const;
export type GoalId = (typeof GOAL_IDS)[number];

export interface GoalOption {
  goal: GoalId;
  label: string;
}

const LABEL_MAX = 35;

// ASSEMBLY.md "관계별 기본 문구". 모델 응답이 계약을 어긴 항목만 이 문구로 대체한다.
const FALLBACK_LABELS: Record<RelationId, Record<GoalId, string>> = {
  some: {
    hidden_intent: "왜 상대는 이런 반응을 보였을까요?",
    relationship_decision: "이 관계를 더 진전시켜도 될까요?",
    reply_strategy: "지금 뭐라고 답하는 게 좋을까요?",
  },
  crush: {
    hidden_intent: "상대 행동에 호감이 담겼을까요?",
    relationship_decision: "조금 더 다가가도 될까요?",
    reply_strategy: "부담 없이 어떻게 말하면 좋을까요?",
  },
  lover: {
    hidden_intent: "상대가 방어적이거나 멀어진 이유는 뭘까요?",
    relationship_decision: "이 관계를 어떻게 이어가야 할까요?",
    reply_strategy: "갈등을 키우지 않고 어떻게 말할까요?",
  },
  ex: {
    hidden_intent: "다시 연락한 이유는 뭘까요?",
    relationship_decision: "재회를 다시 검토해도 될까요?",
    reply_strategy: "지금 답한다면 뭐라고 해야 할까요?",
  },
};

function isGoalId(value: unknown): value is GoalId {
  return (GOAL_IDS as readonly unknown[]).includes(value);
}

// 모델이 준 순서를 유지하되, 누락·중복·형식 오류 항목은 관계별 기본 문구로 채워 항상 3개를 돌려준다.
export function resolveGoalOptions(raw: unknown, relation: RelationId): GoalOption[] {
  const modelLabels = new Map<GoalId, string>();
  const order: GoalId[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const goal = item?.goal;
      if (!isGoalId(goal) || order.includes(goal)) continue;
      order.push(goal);
      const label = typeof item.label === "string" ? item.label.trim() : "";
      if (label && label.length <= LABEL_MAX) modelLabels.set(goal, label);
    }
  }
  for (const goal of GOAL_IDS) {
    if (!order.includes(goal)) order.push(goal);
  }
  return order.map((goal) => ({ goal, label: modelLabels.get(goal) ?? FALLBACK_LABELS[relation][goal] }));
}
