/**
 * Population-weighted aggregation across multiple Dissemination Areas.
 *
 * Each DA profile contributes to the four signals in proportion to its
 * population. DAs with population 0 (or missing) get a weight of 1 as a
 * sensible fallback so they're not silently dropped.
 */

const SIGNAL_KEYS = [
  'medianHouseholdIncome',
  'ownerOccupancyRate',
  'oldHomesRate',
  'singleDetachedRate',
];

/**
 * @param {Array<{population:number, medianHouseholdIncome:number, ownerOccupancyRate:number, oldHomesRate:number, singleDetachedRate:number}>} profiles
 */
export function aggregate(profiles) {
  if (!profiles.length) return null;

  const totals = Object.fromEntries(SIGNAL_KEYS.map((k) => [k, 0]));
  let weightSum = 0;

  for (const p of profiles) {
    const w = p.population > 0 ? p.population : 1;
    for (const k of SIGNAL_KEYS) {
      const v = Number(p[k]);
      if (Number.isFinite(v)) totals[k] += v * w;
    }
    weightSum += w;
  }

  if (weightSum === 0) return null;
  const means = {};
  for (const k of SIGNAL_KEYS) means[k] = totals[k] / weightSum;
  return { means, daCount: profiles.length, totalPopulation: profiles.reduce((a, p) => a + (p.population || 0), 0) };
}
