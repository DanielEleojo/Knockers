// Bottom sheet: the app's primary surface. Owns three views — the knock list,
// the single-house editor, and the area-scout score card — plus the tally,
// status filter, CSV export, and the "log a house" orchestration.

import { listKnocks, addKnock, updateKnock, removeKnock, exportCsv } from '../storage/knocks.js';
import { STATUSES, STATUS_ORDER, statusColor } from '../config/statuses.js';
import { reverseGeocode } from '../api/client.js';
import * as houses from './houseManager.js';
import { snapTo } from './sheetGestures.js';
import { scoreCardHtml, scoreLoadingHtml, scoreErrorHtml, escape } from './scorePanel.js';
import { iconDownload, iconBack, iconTrash, iconCheck } from './icons.js';

let _filter = 'all';
let _toastTimer = null;

const $ = (id) => document.getElementById(id);

export function initSheet() {
  // The handle's drag/tap is owned by sheetGestures; the sheet itself just
  // reacts to view changes by snapping open.
  $('export-btn').innerHTML = `${iconDownload()} Export CSV`;
  $('export-btn').addEventListener('click', onExport);

  // Tapping a marker opens its editor.
  houses.onSelect((id) => openEditor(id));

  renderChips();
  refresh();
}

/* ---------- view switching ---------- */

const VIEWS = ['list-view', 'editor-view', 'score-view'];

function currentView() {
  return VIEWS.find((v) => !$(v).hidden) || 'list-view';
}

function showView(id) {
  for (const v of VIEWS) $(v).hidden = v !== id;
  if (id !== 'list-view') snapTo('full');
}

/* ---------- list view ---------- */

export function refresh() {
  renderTally();
  renderChips();
  renderList();
}

function renderTally() {
  const all = listKnocks();
  const el = $('tally');
  if (!all.length) {
    el.textContent = 'No houses logged yet';
    return;
  }
  const today = all.filter((k) => k.createdAt?.slice(0, 10) === todayStr());
  const leads = today.filter((k) => k.status === 'interested').length;
  const sold = today.filter((k) => k.status === 'sold').length;
  el.textContent = `Today ${today.length} · ${leads} lead${leads === 1 ? '' : 's'} · ${sold} sold`;
}

function renderChips() {
  const counts = countByStatus();
  const chip = (key, label, color) =>
    `<button class="chip${_filter === key ? ' active' : ''}" data-filter="${key}"
       ${color ? `style="--c:${color}"` : ''}>${escape(label)} ${counts[key] ?? 0}</button>`;

  const el = $('filter-chips');
  el.innerHTML =
    chip('all', 'All', null) +
    STATUS_ORDER.map((s) => chip(s, STATUSES[s].short, STATUSES[s].color)).join('');

  el.querySelectorAll('.chip').forEach((b) =>
    b.addEventListener('click', () => {
      _filter = b.dataset.filter;
      renderChips();
      renderList();
    })
  );
}

function renderList() {
  const ul = $('knock-list');
  const knocks = listKnocks()
    .filter((k) => _filter === 'all' || k.status === _filter)
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  if (!knocks.length) {
    ul.innerHTML = `<li class="muted">${_filter === 'all' ? 'Tap “I’m here” or “Tap-add” to log a house.' : 'No houses with this status.'}</li>`;
    return;
  }

  ul.innerHTML = knocks
    .map(
      (k) => `
      <li>
        <button class="knock-row" data-id="${k.id}">
          <span class="row-dot" style="background:${statusColor(k.status)}"></span>
          <span class="row-main">
            <span class="row-title">${escape(primaryLabel(k))}</span>
            <span class="row-sub">${escape(STATUSES[k.status]?.label || k.status)}${k.note ? ' · ' + escape(k.note) : ''}</span>
          </span>
        </button>
      </li>`
    )
    .join('');

  ul.querySelectorAll('.knock-row').forEach((b) =>
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      houses.focus(id);
      openEditor(id);
    })
  );
}

/* ---------- editor view ---------- */

export function openEditor(id) {
  const knock = findKnock(id);
  if (!knock) return;

  $('editor-view').innerHTML = `
    <div class="editor">
      <button class="back-btn ghost" data-act="back">${iconBack()} List</button>
      <div class="editor-addr">${escape(primaryLabel(knock))}</div>
      <div class="status-grid">
        ${STATUS_ORDER.map(
          (s) => `<button class="status-btn${s === knock.status ? ' sel' : ''}"
            data-status="${s}" style="--c:${STATUSES[s].color}">${escape(STATUSES[s].label)}</button>`
        ).join('')}
      </div>
      <textarea class="editor-note" placeholder="Notes — gate code, best time, dog…">${escape(knock.note || '')}</textarea>
      <div class="editor-actions">
        <button class="wide-btn danger" data-act="delete">${iconTrash()} Delete</button>
        <button class="wide-btn primary" data-act="save">${iconCheck()} Save</button>
      </div>
    </div>`;

  const view = $('editor-view');
  view.onclick = (e) => {
    const statusBtn = e.target.closest('.status-btn');
    if (statusBtn) {
      const updated = updateKnock(id, { status: statusBtn.dataset.status });
      if (updated) {
        houses.refreshMarker(updated);
        view.querySelectorAll('.status-btn').forEach((b) => b.classList.toggle('sel', b === statusBtn));
        renderTally();
      }
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'save') {
      saveNote(id, view);
      backToList();
    } else if (act === 'back') {
      saveNote(id, view);
      backToList();
    } else if (act === 'delete') {
      removeKnock(id);
      houses.removeMarker(id);
      backToList();
    }
  };

  showView('editor-view');
}

function saveNote(id, view) {
  const note = view.querySelector('.editor-note')?.value ?? '';
  updateKnock(id, { note });
}

function backToList() {
  showView('list-view');
  refresh();
  snapTo('half');
}

/* ---------- score view ---------- */

export function scoreLoading() {
  setScoreView(scoreLoadingHtml());
}

export function scoreError(msg) {
  setScoreView(scoreErrorHtml(msg));
}

export function scoreResult(result) {
  setScoreView(scoreCardHtml(result));
}

function setScoreView(html) {
  const view = $('score-view');
  view.innerHTML = html;
  view.querySelector('#score-done-btn')?.addEventListener('click', () => showView('list-view'));
  showView('score-view');
}

/* ---------- logging a house ---------- */

/**
 * Create a knock at a position, drop its marker, and open its editor.
 * Reverse-geocodes in the background to label the row with an address.
 */
export function logKnockAt({ lat, lng }) {
  const knock = addKnock({ lat, lng });
  houses.addMarker(knock, { drop: true });
  houses.focus(knock.id);
  refresh();
  openEditor(knock.id);

  reverseGeocode(lat, lng).then((address) => {
    if (!address) return;
    const updated = updateKnock(knock.id, { address });
    if (!updated) return;
    refresh();
    // If still editing this knock, refresh its header line.
    if (currentView() === 'editor-view') {
      const addrEl = $('editor-view').querySelector('.editor-addr');
      if (addrEl) addrEl.textContent = primaryLabel(updated);
    }
  });

  return knock;
}

/* ---------- misc ---------- */

function onExport() {
  if (!listKnocks().length) {
    toast('No houses to export yet.');
    return;
  }
  const blob = new Blob([exportCsv()], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `knockers-${todayStr()}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.removeAttribute('hidden');
  // rAF so the transition runs from the hidden state on first show.
  requestAnimationFrame(() => el.classList.add('show'));
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

function findKnock(id) {
  return listKnocks().find((k) => k.id === id) || null;
}

function primaryLabel(k) {
  return k.address || `${k.lat.toFixed(5)}, ${k.lng.toFixed(5)}`;
}

function countByStatus() {
  const counts = { all: 0 };
  for (const k of listKnocks()) {
    counts.all++;
    counts[k.status] = (counts[k.status] || 0) + 1;
  }
  return counts;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
