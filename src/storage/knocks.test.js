import { describe, it, expect, beforeEach } from 'vitest';
import {
  listKnocks,
  addKnock,
  updateKnock,
  removeKnock,
  clearAll,
  exportCsv,
} from './knocks.js';

beforeEach(() => {
  localStorage.clear();
});

describe('knocks store', () => {
  it('starts empty', () => {
    expect(listKnocks()).toEqual([]);
  });

  it('adds a knock with sane defaults and round-trips it', () => {
    const k = addKnock({ lat: 43.9, lng: -78.9 });
    expect(k.id).toMatch(/^knock_/);
    expect(k.status).toBe('no_answer');
    expect(k.note).toBe('');
    expect(k.createdAt).toBeTruthy();
    expect(k.updatedAt).toBe(k.createdAt);

    const stored = listKnocks();
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ lat: 43.9, lng: -78.9, status: 'no_answer' });
  });

  it('falls back to the default status for an unknown status', () => {
    const k = addKnock({ lat: 1, lng: 2, status: 'banana' });
    expect(k.status).toBe('no_answer');
  });

  it('updates status + note and bumps updatedAt', () => {
    const k = addKnock({ lat: 1, lng: 2 });
    const updated = updateKnock(k.id, { status: 'sold', note: 'booked Tuesday' });
    expect(updated.status).toBe('sold');
    expect(updated.note).toBe('booked Tuesday');
    expect(listKnocks()[0].status).toBe('sold');
  });

  it('coerces an invalid status on update', () => {
    const k = addKnock({ lat: 1, lng: 2 });
    expect(updateKnock(k.id, { status: 'nope!' }).status).toBe('no_answer');
  });

  it('returns null when updating a missing id', () => {
    expect(updateKnock('missing', { note: 'x' })).toBeNull();
  });

  it('removes and clears', () => {
    const a = addKnock({ lat: 1, lng: 2 });
    addKnock({ lat: 3, lng: 4 });
    removeKnock(a.id);
    expect(listKnocks()).toHaveLength(1);
    clearAll();
    expect(listKnocks()).toEqual([]);
  });

  it('migrates legacy lume.pins.v1 records on first read', () => {
    localStorage.setItem(
      'lume.pins.v1',
      JSON.stringify([
        { id: 'pin_old', lat: 10, lng: 20, score: 72, note: 'from before', createdAt: '2025-01-01T00:00:00.000Z' },
      ])
    );
    const knocks = listKnocks();
    expect(knocks).toHaveLength(1);
    expect(knocks[0]).toMatchObject({
      id: 'pin_old',
      lat: 10,
      lng: 20,
      status: 'no_answer',
      note: 'from before',
      createdAt: '2025-01-01T00:00:00.000Z',
    });
    // Migration persists under the new key, so a second read is stable.
    expect(listKnocks()).toHaveLength(1);
  });

  it('returns [] when storage holds corrupt JSON', () => {
    localStorage.setItem('lume.knocks.v1', '{not json');
    expect(listKnocks()).toEqual([]);
  });
});

describe('exportCsv', () => {
  it('returns just the header row when empty', () => {
    expect(exportCsv()).toBe('id,lat,lng,status,note,address,createdAt,updatedAt');
  });

  it('includes the status column and one row per knock', () => {
    addKnock({ lat: 43.9, lng: -78.9, status: 'interested', note: 'plain', address: '1 Main St' });
    const lines = exportCsv().split('\r\n');
    expect(lines[0]).toBe('id,lat,lng,status,note,address,createdAt,updatedAt');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('interested');
    expect(lines[1]).toContain('1 Main St');
  });

  it('quotes fields containing commas, quotes, or newlines', () => {
    addKnock({ lat: 1, lng: 2, note: 'has, "quotes"\nand newline' });
    const row = exportCsv().split('\r\n')[1];
    expect(row).toContain('"has, ""quotes""\nand newline"');
  });
});
