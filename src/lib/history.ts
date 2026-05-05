import { SavedBrief } from "./types";

const KEY = "interviewready.history.v1";

export function listBriefs(): SavedBrief[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedBrief[];
  } catch {
    return [];
  }
}

export function saveBrief(b: SavedBrief) {
  const all = listBriefs();
  const existing = all.findIndex((x) => x.id === b.id);
  if (existing >= 0) all[existing] = b;
  else all.unshift(b);
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 100)));
}

export function getBrief(id: string): SavedBrief | undefined {
  return listBriefs().find((b) => b.id === id);
}

export function deleteBrief(id: string) {
  localStorage.setItem(KEY, JSON.stringify(listBriefs().filter((b) => b.id !== id)));
}

export function renameBrief(id: string, title: string) {
  const all = listBriefs();
  const b = all.find((x) => x.id === id);
  if (b) {
    b.title = title;
    localStorage.setItem(KEY, JSON.stringify(all));
  }
}
