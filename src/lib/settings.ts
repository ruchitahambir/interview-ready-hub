const KEY = "interviewready.settings.v1";
const PROVIDER_KEY = "interviewready.provider.v1";

export interface AppSettings {
  apiKey: string;
  provider: "openai" | "anthropic";
}

// API keys are kept in sessionStorage only (cleared when the tab closes) to
// reduce exposure vs. localStorage. Provider preference is persisted in
// localStorage since it is non-sensitive.
export function getSettings(): AppSettings {
  let apiKey = "";
  let provider: "openai" | "anthropic" = "openai";
  try {
    apiKey = sessionStorage.getItem(KEY) || "";
  } catch {}
  try {
    const p = localStorage.getItem(PROVIDER_KEY);
    if (p === "openai" || p === "anthropic") provider = p;
  } catch {}
  return { apiKey, provider };
}

export function setSettings(s: AppSettings) {
  try {
    if (s.apiKey) sessionStorage.setItem(KEY, s.apiKey);
    else sessionStorage.removeItem(KEY);
  } catch {}
  try {
    localStorage.setItem(PROVIDER_KEY, s.provider);
  } catch {}
  // Clean up any legacy plaintext key previously stored in localStorage.
  try {
    localStorage.removeItem(KEY);
  } catch {}
}
