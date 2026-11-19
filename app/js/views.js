// Sunset Platinum — views: checklist, detail pane, roadmap, missables, planner.
import { KIND_LABELS, filterTrophies, gradeCounts, isSpoilerHidden, nextUp, stageProgress } from './filters.js';
import { saveState, setCount, toggleEarned } from './store.js';

export const ROADMAP_STAGES = [
  { stage: 1, title: 'Play the story', text: 'Chapters 1–4, the final mission and the named story missions. Watch the missable list as you go — the seven flagged trophies are tied to story moments and choices.' },
  { stage: 2, title: 'Strangers & side missions', text: 'Andy, Kenton, Billy, Randy, Tyrone and Bret, plus 8 stranger strands across Leonida. These open in the open world between story missions.' },
  { stage: 3, title: 'Activities & challenges', text: 'Stunts, the shooting range, races, fishing, arcade and bowling, robberies and the 50 challenges. The long grinds live here — log your counts as you play.' },
  { stage: 4, title: 'Collectibles & exploration', text: 'Card sets, WAiNK locations, vehicles, meditation spots, garages and the whole map of Leonida. Best done once you can travel freely.' },
  { stage: 5, title: '100% & the platinum', text: 'Attain 100% completion for the gold A Long Road, and the platinum Vice Got a Price! follows automatically.' },
];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}

function gradeBadge(grade) {
  const b = el('span', `grade-badge grade-${grade}`, grade);
  return b;
}

export function updateProgress(trophies, state) {
  const earned = state.earned.size;
  const total = trophies.length;
  const pct = total ? Math.round((earned / total) * 100) : 0;
  document.getElementById('earnedCount').textContent = earned;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const bar = document.getElementById('progressBar');
  bar.setAttribute('aria-valuenow', String(earned));
  document.getElementById('progressText').textContent = `${pct}% to the platinum — ${earned} of ${total} earned`;
  const gc = gradeCounts(trophies, state);
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  document.getElementById('gradeLine').textContent = Object.keys(gc)
    .map((g) => `${cap(g)} ${gc[g][0]}/${gc[g][1]}`).join(' · ');
}

export function renderList(trophies, state, filters, selectedId, onSelect) {
  const list = document.getElementById('trophyList');
  const visible = filterTrophies(trophies, state, filters);
  list.replaceChildren();
  document.getElementById('emptyState').hidden = visible.length > 0;
  document.getElementById('listMeta').textContent =
    `Showing ${visible.length} of ${trophies.length} trophies · ${state.earned.size} earned`;
  for (const t of visible) {
    const li = el('li', 'trophy-row' + (state.earned.has(t.id) ? ' earned' : '') + (t.id === selectedId ? ' selected' : ''));
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} earned`);
    box.addEventListener('change', () => {
      toggleEarned(state, t.id);
      if (!state.demo) saveState(state);
      onSelect(t.id, true);
    });
    const body = el('div');
    const hidden = isSpoilerHidden(t, state);
    body.append(el('div', 'trophy-name' + (hidden ? ' spoiler-name' : ''), hidden ? 'Hidden story trophy — earn it to reveal' : t.name));
    body.append(el('div', 'trophy-desc', hidden ? 'Spoilers hidden. Turn the spoiler setting off, or earn this trophy, to see it.' : t.description));
    const meta = el('div', 'trophy-meta');
    meta.append(el('span', 'trophy-kind', KIND_LABELS[t.kind] || t.kind));
    if (t.missable) meta.append(el('span', 'missable-flag', '⚠ Missable'));
    if (t.target) meta.append(el('span', 'trophy-kind', `${state.counts[t.id] || 0} / ${t.target.toLocaleString()} ${t.targetLabel || ''}`));
    body.append(meta);
    const badge = gradeBadge(t.grade);
    li.append(box, body, badge);
    li.addEventListener('click', (e) => {
      if (e.target === box) return;
      onSelect(t.id, false);
    });
    list.append(li);
  }
}

export function renderDetail(trophies, state, selectedId, globalSources, onRerender) {
  const pane = document.getElementById('detailPane');
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    pane.replaceChildren(el('p', 'detail-hint', 'Select a trophy to read its guide, sources and progress counter.'));
    return;
  }
  pane.replaceChildren();
  const hidden = isSpoilerHidden(t, state);
  pane.append(gradeBadge(t.grade));
  pane.append(el('h2', null, hidden ? 'Hidden story trophy' : t.name));
  pane.append(el('p', 'detail-desc', hidden ? 'This story trophy is hidden by your spoiler setting.' : t.description));
  const actions = el('div', 'detail-actions');
  const earnedBtn = el('button', 'earned-btn' + (state.earned.has(t.id) ? ' earned' : ''),
    state.earned.has(t.id) ? '✓ Earned — click to undo' : 'Mark as earned');
  earnedBtn.type = 'button';
  earnedBtn.addEventListener('click', () => {
    toggleEarned(state, t.id);
    if (!state.demo) saveState(state);
    onRerender();
  });
  actions.append(earnedBtn);
  if (t.missable) actions.append(el('span', 'missable-flag', '⚠ Missable — do not skip'));
  pane.append(actions);

  if (!hidden && t.target) {
    const wrap = el('div', 'counter');
    const minus = el('button', null, '−'); minus.type = 'button';
    const plus = el('button', null, '+'); plus.type = 'button';
    const val = el('span', 'count-value', `${state.counts[t.id] || 0} / ${t.target.toLocaleString()} ${t.targetLabel || ''}`);
    const bar = el('div', 'count-bar');
    const fill = el('span');
    fill.style.width = `${Math.min(100, ((state.counts[t.id] || 0) / t.target) * 100)}%`;
    bar.append(fill);
    const step = (d) => {
      setCount(state, t.id, (state.counts[t.id] || 0) + d, t.target);
      if (!state.demo) saveState(state);
      onRerender();
    };
    minus.addEventListener('click', () => step(-1));
    plus.addEventListener('click', () => step(1));
    wrap.append(minus, val, plus, bar);
    pane.append(wrap);
  }

  if (!hidden) {
    const guide = el('div', 'detail-guide');
    guide.append(el('h3', null, 'Guide'));
    guide.append(el('p', null, t.guide));
    pane.append(guide);
    const src = el('div', 'detail-sources');
    src.append(el('h3', null, 'Sources'));
    const ul = document.createElement('ul');
    const sources = t.sources && t.sources.length ? t.sources : globalSources;
    for (const s of sources) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      li.append(a);
      ul.append(li);
    }
    src.append(ul);
    src.append(el('p', null, 'Guide text is written for this entry, in our own words, from the official description — never copied from another guide.'));
    pane.append(src);
  } else {
    pane.append(el('p', null, 'Turn the spoiler setting off to read this trophy’s guide, or earn it in-game.'));
  }

  const note = el('div', 'detail-note');
  note.append(el('h3', null, 'Your note'));
  const ta = document.createElement('textarea');
  ta.value = state.notes[t.id] || '';
  ta.placeholder = 'e.g. “Found 2 card sets near Vice City — 1 to go.”';
  ta.setAttribute('aria-label', 'Your note for this trophy');
  ta.addEventListener('change', () => {
    if (ta.value.trim()) state.notes[t.id] = ta.value.trim();
    else delete state.notes[t.id];
    if (!state.demo) saveState(state);
  });
  note.append(ta);
  note.append(el('p', null, 'Notes are saved in your browser with your progress.'));
  pane.append(note);
}

export function renderRoadmap(trophies, state, onSelect) {
  const host = document.getElementById('roadmapStages');
  host.replaceChildren();
  for (const s of ROADMAP_STAGES) {
    const p = stageProgress(trophies, state, s.stage);
    const card = el('div', 'stage-card');
    const h = el('h3');
    h.append(el('span', 'stage-num', String(s.stage)));
    h.append(document.createTextNode(s.title));
    card.append(h, el('p', null, s.text));
    const prog = el('div', 'stage-progress', `${p.earned} of ${p.total} earned in this stage`);
    const bar = el('div', 'bar');
    const fill = el('span');
    fill.style.width = `${p.total ? (p.earned / p.total) * 100 : 0}%`;
    bar.append(fill);
    prog.append(bar);
    card.append(prog);
    const chips = el('div', 'stage-trophies');
    for (const t of p.list) {
      const c = el('button', 'mini' + (state.earned.has(t.id) ? ' earned' : ''), `${state.earned.has(t.id) ? '✓ ' : ''}${t.name}`);
      c.type = 'button';
      c.addEventListener('click', () => onSelect(t.id));
      chips.append(c);
    }
    card.append(chips);
    host.append(card);
  }
}

export function renderMissables(trophies, state, onSelect) {
  const host = document.getElementById('missablesList');
  host.replaceChildren();
  const list = trophies.filter((t) => t.missable);
  for (const t of list) {
    const card = el('div', 'miss-card');
    card.append(el('div', 'when', `Missable · ${t.kind === 'story' ? 'Story' : 'Open world'} · Stage ${t.stage}`));
    card.append(el('h3', null, `${state.earned.has(t.id) ? '✓ ' : ''}${t.name}`));
    card.append(el('p', null, t.guide));
    card.addEventListener('click', () => onSelect(t.id));
    host.append(card);
  }
}

export function renderPlanner(trophies, state, onSelect) {
  const next = nextUp(trophies, state, 6);
  const host = document.getElementById('plannerNext');
  host.replaceChildren();
  if (!next.length) {
    host.append(el('p', null, 'Every trophy is earned — the platinum is yours. Congratulations, Leonida Legend!'));
  } else {
    const first = next[0];
    const card = el('div', 'next-card');
    card.append(el('div', 'when', 'Next up'));
    card.append(el('h3', null, first.name));
    card.append(el('p', null, first.description));
    card.append(el('p', null, first.guide));
    card.addEventListener('click', () => onSelect(first.id));
    host.append(card);
    const ul = el('ul', 'next-list');
    for (const t of next.slice(1)) {
      const li = document.createElement('li');
      li.append(el('span', null, t.name));
      li.append(el('span', 'trophy-kind', `Stage ${t.stage} · ${t.grade}`));
      li.addEventListener('click', () => onSelect(t.id));
      ul.append(li);
    }
    host.append(ul);
  }
  const counters = document.getElementById('plannerCounters');
  counters.replaceChildren();
  const counted = trophies.filter((t) => t.target).sort((a, b) => a.id - b.id);
  for (const t of counted) {
    const row = el('div', 'counter-row');
    row.append(el('div', 'counter-name', t.name));
    row.append(el('div', 'counter-sub', t.description));
    const wrap = el('div', 'counter');
    const minus = el('button', null, '−'); minus.type = 'button';
    const plus = el('button', null, '+'); plus.type = 'button';
    const val = el('span', 'count-value', `${state.counts[t.id] || 0} / ${t.target.toLocaleString()}`);
    const step = (d) => {
      setCount(state, t.id, (state.counts[t.id] || 0) + d, t.target);
      if (!state.demo) saveState(state);
      renderPlanner(trophies, state, onSelect);
      updateProgress(trophies, state);
    };
    minus.addEventListener('click', () => step(-1));
    plus.addEventListener('click', () => step(1));
    wrap.append(minus, val, plus);
    row.append(wrap);
    counters.append(row);
  }
}
