// Sunset Platinum — filters: kind, grade, status, search, and the spoiler rule.
export const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectible: 'Collectible',
  activity: 'Activity',
  side: 'Side mission',
  misc: 'Open world',
  platinum: 'Platinum',
  online: 'Online',
};

// A trophy counts as hidden by the spoiler setting while it is a story trophy
// the player has not earned yet. Its name and description stay hidden.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

export function filterTrophies(trophies, state, filters) {
  const q = (filters.search || '').trim().toLowerCase();
  return trophies.filter((t) => {
    if (filters.kind === 'missable' && !t.missable) return false;
    if (filters.kind === 'online') return false; // the list has no online trophies
    if (filters.kind !== 'all' && filters.kind !== 'missable' && t.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && t.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !state.earned.has(t.id)) return false;
    if (filters.status === 'remaining' && state.earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) ||
      (KIND_LABELS[t.kind] || '').toLowerCase().includes(q) || (t.targetLabel || '').toLowerCase().includes(q))) return false;
    return true;
  });
}

export function gradeCounts(trophies, state) {
  const out = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const t of trophies) {
    out[t.grade][1] += 1;
    if (state.earned.has(t.id)) out[t.grade][0] += 1;
  }
  return out;
}

export function stageProgress(trophies, state, stage) {
  const list = trophies.filter((t) => t.stage === stage);
  const earned = list.filter((t) => state.earned.has(t.id)).length;
  return { list, earned, total: list.length };
}

// Roadmap order: the next trophy is the earliest-stage, earliest-id trophy not earned.
export function nextUp(trophies, state, count = 6) {
  const remaining = trophies
    .filter((t) => !state.earned.has(t.id))
    .sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
  return remaining.slice(0, count);
}
