const KEY = "interviewready.settings.v1";

export interface AppSettings {
  apiKey: string;
  provider: "openai" | "anthropic";
}

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { apiKey: "", provider: "openai" };
}

export function setSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
