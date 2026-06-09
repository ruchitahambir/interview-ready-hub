import { SavedBrief, SavedBatch } from "./types";

const KEY = "interviewready.history.v1";
const BATCH_KEY = "interviewready.batches.v1";

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
  localStorage.setItem(KEY, JSON.stringify(all.slice(0, 200)));
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

// Batches
export function listBatches(): SavedBatch[] {
  try {
    const raw = localStorage.getItem(BATCH_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedBatch[];
  } catch {
    return [];
  }
}

export function saveBatch(b: SavedBatch) {
  const all = listBatches();
  const idx = all.findIndex((x) => x.id === b.id);
  if (idx >= 0) all[idx] = b;
  else all.unshift(b);
  localStorage.setItem(BATCH_KEY, JSON.stringify(all.slice(0, 50)));
}

export function getBatch(id: string): SavedBatch | undefined {
  return listBatches().find((b) => b.id === id);
}
