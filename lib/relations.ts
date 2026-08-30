// experiments/psych-engine/cases/CASE_SCHEMA.md의 기존 네이밍을 따른다.
export const RELATIONS = [
  { id: "ex", label: "전연인" },
  { id: "some", label: "썸" },
  { id: "lover", label: "연인" },
  { id: "crush", label: "짝사랑" },
  { id: "friend", label: "친구" },
  { id: "work", label: "직장" },
] as const;

export type RelationId = (typeof RELATIONS)[number]["id"];

export const RELATION_MODULE_MARKER = "<!-- RELATION_MODULE -->";

// build.py의 마커 치환 로직과 동일하게 core + 관계 모듈을 조립한다.
export function assemblePrompt(core: string, relationModule: string): string {
  if (!core.includes(RELATION_MODULE_MARKER)) {
    throw new Error(`core.md에 마커 ${RELATION_MODULE_MARKER}가 없습니다.`);
  }
  return core.replace(RELATION_MODULE_MARKER, relationModule.trimEnd() + "\n");
}
