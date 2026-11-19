// Sunset Platinum — store: saved progress in localStorage, export/import, demo seed.
const STORAGE_KEY = 'sunset-platinum-v1';

// Demo progress used for screenshots (?demo=1): 13 of 55 earned, counters part way.
// It lives in memory only and is never written to localStorage.
export const DEMO_EARNED = [2, 3, 4, 5, 8, 15, 16, 18, 21, 28, 33, 44, 46];
export const DEMO_COUNTS = { 15: 120, 17: 18, 19: 9, 31: 34, 32: 22, 35: 41, 52: 95000, 53: 42000 };

export function emptyState() {
  return { earned: new Set(), counts: {}, notes: {}, spoiler: false };
}

export function loadState() {
  const state = emptyState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return state;
    const data = JSON.parse(raw);
    if (Array.isArray(data.earned)) state.earned = new Set(data.earned);
    if (data.counts && typeof data.counts === 'object') state.counts = data.counts;
    if (data.notes && typeof data.notes === 'object') state.notes = data.notes;
    if (typeof data.spoiler === 'boolean') state.spoiler = data.spoiler;
  } catch {
    // A corrupt save is ignored; the tracker starts empty rather than crashing.
  }
  return state;
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      earned: [...state.earned],
      counts: state.counts,
      notes: state.notes,
      spoiler: state.spoiler,
    }));
  } catch {
    // Storage full or blocked (private mode): progress still works in memory.
  }
}

export function applyDemo(state) {
  state.earned = new Set(DEMO_EARNED);
  state.counts = { ...DEMO_COUNTS };
  state.demo = true;
  return state;
}

export function toggleEarned(state, id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
}

export function setCount(state, id, value, target) {
  const n = Math.max(0, Math.min(target ?? 999999, Math.round(value) || 0));
  if (n === 0) delete state.counts[id];
  else state.counts[id] = n;
  return n;
}

export function exportFile(state) {
  const blob = new Blob([JSON.stringify({
    app: 'Sunset Platinum — GTA VI Trophy Guide',
    exportedAt: new Date().toISOString(),
    earned: [...state.earned],
    counts: state.counts,
    notes: state.notes,
  }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'sunset-platinum-progress.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export async function importFile(file) {
  const data = JSON.parse(await file.text());
  if (!data || typeof data !== 'object') throw new Error('not a progress file');
  const state = emptyState();
  const ids = new Set();
  if (Array.isArray(data.earned)) for (const id of data.earned) ids.add(Number(id));
  if (Array.isArray(data)) for (const id of data) ids.add(Number(id)); // plain array of ids also accepted
  state.earned = ids;
  if (data.counts && typeof data.counts === 'object') state.counts = data.counts;
  if (data.notes && typeof data.notes === 'object') state.notes = data.notes;
  return state;
}
