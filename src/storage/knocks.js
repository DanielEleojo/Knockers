// localStorage-backed house-knock store.
// Schema: { id, lat, lng, status, note, address, createdAt, updatedAt }

import { DEFAULT_STATUS, isStatus } from '../config/statuses.js';

const KEY = 'lume.knocks.v1';
const LEGACY_PINS_KEY = 'lume.pins.v1';

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }
    // One-time migration from the old area-pin store.
    const migrated = migrateLegacyPins();
    if (migrated) {
      write(migrated);
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

function write(knocks) {
  localStorage.setItem(KEY, JSON.stringify(knocks));
}

/** Convert old `lume.pins.v1` records into knocks, or null if none exist. */
function migrateLegacyPins() {
  try {
    const raw = localStorage.getItem(LEGACY_PINS_KEY);
    if (!raw) return null;
    const pins = JSON.parse(raw);
    if (!Array.isArray(pins) || !pins.length) return null;
    return pins.map((p) => ({
      id: p.id || makeId(),
      lat: p.lat,
      lng: p.lng,
      status: DEFAULT_STATUS,
      note: p.note || '',
      address: '',
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.createdAt || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

function makeId() {
  return `knock_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function listKnocks() {
  return read();
}

export function addKnock({ lat, lng, status = DEFAULT_STATUS, note = '', address = '' }) {
  const knocks = read();
  const now = new Date().toISOString();
  const knock = {
    id: makeId(),
    lat,
    lng,
    status: isStatus(status) ? status : DEFAULT_STATUS,
    note,
    address,
    createdAt: now,
    updatedAt: now,
  };
  knocks.push(knock);
  write(knocks);
  return knock;
}

export function updateKnock(id, patch) {
  const knocks = read();
  const i = knocks.findIndex((k) => k.id === id);
  if (i === -1) return null;
  const next = { ...knocks[i], ...patch, updatedAt: new Date().toISOString() };
  if (!isStatus(next.status)) next.status = DEFAULT_STATUS;
  knocks[i] = next;
  write(knocks);
  return next;
}

export function removeKnock(id) {
  write(read().filter((k) => k.id !== id));
}

export function clearAll() {
  write([]);
}

/**
 * Serialize all knocks to a CSV string (RFC-4180 quoting). Empty store still
 * returns the header row so an exported file is always well-formed.
 */
export function exportCsv() {
  const cols = ['id', 'lat', 'lng', 'status', 'note', 'address', 'createdAt', 'updatedAt'];
  const rows = read().map((k) => cols.map((c) => csvCell(k[c])).join(','));
  return [cols.join(','), ...rows].join('\r\n');
}

function csvCell(value) {
  if (value == null) return '';
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
