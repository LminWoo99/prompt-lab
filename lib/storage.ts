const KEYS = {
  GH_PAT: "gh_pat",
  GH_USERNAME: "gh_username",
  ANTHROPIC_KEY: "anthropic_key",
  GOOGLE_KEY: "google_key",
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
  getGhPat: () => get(KEYS.GH_PAT),
  setGhPat: (v: string) => set(KEYS.GH_PAT, v),

  getGhUsername: () => get(KEYS.GH_USERNAME),
  setGhUsername: (v: string) => set(KEYS.GH_USERNAME, v),

  getAnthropicKey: () => get(KEYS.ANTHROPIC_KEY),
  setAnthropicKey: (v: string) => set(KEYS.ANTHROPIC_KEY, v),

  getGoogleKey: () => get(KEYS.GOOGLE_KEY),
  setGoogleKey: (v: string) => set(KEYS.GOOGLE_KEY, v),

  getPromptDraft: () => get(KEYS.PROMPT_DRAFT),
  setPromptDraft: (v: string) => set(KEYS.PROMPT_DRAFT, v),

  getSelectedModel: () => get(KEYS.SELECTED_MODEL),
  setSelectedModel: (v: string) => set(KEYS.SELECTED_MODEL, v),
};
