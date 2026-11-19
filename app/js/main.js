// Sunset Platinum — main: boot the app, wire the toolbar, tabs and keyboard.
import { applyDemo, exportFile, importFile, loadState, saveState } from './store.js';
import { renderDetail, renderList, renderMissables, renderPlanner, renderRoadmap, updateProgress } from './views.js';

const params = new URLSearchParams(location.search);
const state = loadState();
if (params.get('demo') === '1') applyDemo(state);

const filters = { kind: 'all', grade: 'all', status: 'all', search: '' };
let trophies = [];
let globalSources = [];
let selectedId = null;
let currentView = 'checklist';

const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies || doc;
globalSources = doc.sources || [];

// Deep links for screenshots and sharing: ?view=roadmap|missables|planner,
// ?open=<trophy id>, ?spoilers=on, ?demo=1 (13 earned, counters part way).
if (params.get('spoilers') === 'on') state.spoiler = true;
const startView = params.get('view');
if (['checklist', 'roadmap', 'missables', 'planner'].includes(startView)) currentView = startView;
const openId = Number(params.get('open'));
if (openId && trophies.some((t) => t.id === openId)) selectedId = openId;

function rerender() {
  updateProgress(trophies, state);
  renderList(trophies, state, filters, selectedId, selectTrophy);
  renderDetail(trophies, state, selectedId, globalSources, rerender);
  renderRoadmap(trophies, state, selectTrophy);
  renderMissables(trophies, state, selectTrophy);
  renderPlanner(trophies, state, selectTrophy);
  document.getElementById('onlineNote').hidden = filters.kind !== 'online';
}

function selectTrophy(id, fromCheckbox = false) {
  selectedId = id;
  if (!fromCheckbox) showView('checklist');
  rerender();
  if (!fromCheckbox) {
    document.getElementById('detailPane').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function showView(view) {
  currentView = view;
  document.querySelectorAll('.tab').forEach((tab) => {
    const active = tab.dataset.view === view;
    tab.classList.toggle('active', active);
    if (active) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  document.querySelector('.layout').style.display = view === 'checklist' ? '' : 'none';
  document.querySelector('.toolbar').style.display = view === 'checklist' ? '' : 'none';
  document.getElementById('roadmapPanel').hidden = view !== 'roadmap';
  document.getElementById('missablesPanel').hidden = view !== 'missables';
  document.getElementById('plannerPanel').hidden = view !== 'planner';
  document.getElementById('onlineNote').hidden = true; // only the checklist's Online chip shows it
  window.scrollTo({ top: 0 });
}

// Tabs
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => showView(tab.dataset.view));
});

// Kind chips
document.querySelectorAll('#kindChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#kindChips .chip').forEach((c) => c.classList.remove('active'));
    chip.classList.add('active');
    filters.kind = chip.dataset.kind;
    rerender();
  });
});

// Search, grade, status, spoilers
document.getElementById('search').addEventListener('input', (e) => {
  filters.search = e.target.value;
  renderList(trophies, state, filters, selectedId, selectTrophy);
});
document.getElementById('gradeFilter').addEventListener('change', (e) => {
  filters.grade = e.target.value;
  rerender();
});
document.getElementById('statusFilter').addEventListener('change', (e) => {
  filters.status = e.target.value;
  rerender();
});
const spoilerToggle = document.getElementById('spoilerToggle');
spoilerToggle.checked = state.spoiler;
spoilerToggle.addEventListener('change', () => {
  state.spoiler = spoilerToggle.checked;
  if (!state.demo) saveState(state);
  rerender();
});

// Export and import
document.getElementById('exportBtn').addEventListener('click', () => exportFile(state));
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = await importFile(file);
    Object.assign(state, imported);
    if (!state.demo) saveState(state);
    rerender();
  } catch {
    alert('That file could not be imported — it is not a Sunset Platinum progress file.');
  }
  e.target.value = '';
});

// Keyboard: 1–4 switch sections, / focuses search, e exports, s toggles spoilers.
document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  const views = ['checklist', 'roadmap', 'missables', 'planner'];
  if (['1', '2', '3', '4'].includes(e.key)) showView(views[Number(e.key) - 1]);
  else if (e.key === '/') { e.preventDefault(); document.getElementById('search').focus(); }
  else if (e.key === 'e') exportFile(state);
  else if (e.key === 's') { spoilerToggle.checked = !spoilerToggle.checked; spoilerToggle.dispatchEvent(new Event('change')); }
});

showView(currentView);
rerender();
