const KEYS = {
  RELATION_MODULE_DRAFT_PREFIX: "relation_module_draft:",
  SELECTED_MODEL: "selected_model",
  SELECTED_RELATION: "selected_relation",
} as const;

function get(key: string): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(key) ?? "";
}

function set(key: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, value);
}

export const storage = {
  // 관계 모듈만 편집 가능하므로 초안도 관계별로 분리해서 저장한다.
  getRelationModuleDraft: (relation: string) => get(KEYS.RELATION_MODULE_DRAFT_PREFIX + relation),
  setRelationModuleDraft: (relation: string, v: string) => set(KEYS.RELATION_MODULE_DRAFT_PREFIX + relation, v),

  getSelectedModel: () => get(KEYS.SELECTED_MODEL),
  setSelectedModel: (v: string) => set(KEYS.SELECTED_MODEL, v),

  getSelectedRelation: () => get(KEYS.SELECTED_RELATION),
  setSelectedRelation: (v: string) => set(KEYS.SELECTED_RELATION, v),
};
