import { describe, it, expect } from 'vitest';
import { normalize, clamp } from './normalize.js';

describe('normalize', () => {
  const cfg = { lo: 0, hi: 100, invert: false };

  it('maps a value linearly into 0..1', () => {
    expect(normalize(0, cfg)).toBe(0);
    expect(normalize(50, cfg)).toBe(0.5);
    expect(normalize(100, cfg)).toBe(1);
  });

  it('clamps below lo and above hi', () => {
    expect(normalize(-20, cfg)).toBe(0);
    expect(normalize(250, cfg)).toBe(1);
  });

  it('reverses the mapping when invert is true', () => {
    const inv = { lo: 0, hi: 100, invert: true };
    expect(normalize(0, inv)).toBe(1);
    expect(normalize(100, inv)).toBe(0);
    expect(normalize(25, inv)).toBe(0.75);
  });

  it('returns 0 when lo === hi (degenerate range)', () => {
    expect(normalize(5, { lo: 5, hi: 5, invert: false })).toBe(0);
  });

  it('returns 0 for non-finite values', () => {
    expect(normalize(NaN, cfg)).toBe(0);
    expect(normalize(Infinity, cfg)).toBe(0);
    expect(normalize(undefined, cfg)).toBe(0);
  });
});

describe('clamp', () => {
  it('bounds a number to [lo, hi]', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});
