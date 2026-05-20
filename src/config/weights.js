/**
 * Knock Score weights + per-signal normalization bounds.
 *
 * Each signal is mapped from its raw value to a 0–1 contribution using `lo`/`hi`:
 *   contribution = clamp((value - lo) / (hi - lo), 0, 1)
 *   - If `invert: true`, the mapping is reversed (e.g. age: older = better).
 *
 * Then: knockScore = 100 * Σ (contribution_i * weight_i)
 *
 * Weights must sum to 1.
 */

export const WEIGHTS = {
  medianHouseholdIncome: {
    weight: 0.35,
    lo: 40_000,
    hi: 150_000,
    invert: false,
    label: 'Median household income',
    format: (v) => `$${Math.round(v).toLocaleString()}`,
  },
  ownerOccupancyRate: {
    weight: 0.3,
    lo: 0.3,
    hi: 0.9,
    invert: false,
    label: 'Owner-occupancy rate',
    format: (v) => `${Math.round(v * 100)}%`,
  },
  oldHomesRate: {
    // Share of dwellings built in 1980 or earlier. Older homes → more neglect → better lead.
    weight: 0.2,
    lo: 0.10,
    hi: 0.80,
    invert: false,
    label: '% homes built ≤ 1980',
    format: (v) => `${Math.round(v * 100)}%`,
  },
  singleDetachedRate: {
    weight: 0.15,
    lo: 0.1,
    hi: 0.9,
    invert: false,
    label: '% single-detached homes',
    format: (v) => `${Math.round(v * 100)}%`,
  },
};

// Sanity check at import time so a bad edit fails loud.
const _sum = Object.values(WEIGHTS).reduce((a, b) => a + b.weight, 0);
if (Math.abs(_sum - 1) > 0.001) {
  console.warn(`[weights] Weights sum to ${_sum}, should be 1.`);
}
