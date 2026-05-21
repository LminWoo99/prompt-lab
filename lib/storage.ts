const KEYS = {
  PROMPT_DRAFT: "prompt_draft",
  SELECTED_MODEL: "selected_model",
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
  getPromptDraft: () => get(KEYS.PROMPT_DRAFT),
  setPromptDraft: (v: string) => set(KEYS.PROMPT_DRAFT, v),

  getSelectedModel: () => get(KEYS.SELECTED_MODEL),
  setSelectedModel: (v: string) => set(KEYS.SELECTED_MODEL, v),
};
