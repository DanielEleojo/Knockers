// Map a raw signal value to a 0–1 contribution using its weights config.

export function normalize(value, cfg) {
  if (!Number.isFinite(value)) return 0;
  const { lo, hi, invert } = cfg;
  if (lo === hi) return 0;
  const t = (value - lo) / (hi - lo);
  const n = invert ? 1 - t : t;
  return clamp(n, 0, 1);
}

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
