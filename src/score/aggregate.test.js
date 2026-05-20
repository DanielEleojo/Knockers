import { describe, it, expect } from 'vitest';
import { aggregate } from './aggregate.js';

const profile = (over = {}) => ({
  population: 100,
  medianHouseholdIncome: 50_000,
  ownerOccupancyRate: 0.5,
  oldHomesRate: 0.4,
  singleDetachedRate: 0.6,
  ...over,
});

describe('aggregate', () => {
  it('returns null for an empty list', () => {
    expect(aggregate([])).toBeNull();
  });

  it('weights signals by population', () => {
    const agg = aggregate([
      profile({ population: 300, medianHouseholdIncome: 100_000 }),
      profile({ population: 100, medianHouseholdIncome: 60_000 }),
    ]);
    // (300*100k + 100*60k) / 400 = 90k
    expect(agg.means.medianHouseholdIncome).toBe(90_000);
    expect(agg.daCount).toBe(2);
    expect(agg.totalPopulation).toBe(400);
  });

  it('treats zero/missing population as weight 1 instead of dropping the DA', () => {
    const agg = aggregate([
      profile({ population: 0, medianHouseholdIncome: 40_000 }),
      profile({ population: 0, medianHouseholdIncome: 60_000 }),
    ]);
    expect(agg.means.medianHouseholdIncome).toBe(50_000);
    expect(agg.totalPopulation).toBe(0);
  });

  it('skips non-finite signal values', () => {
    const agg = aggregate([
      profile({ population: 100, ownerOccupancyRate: NaN }),
      profile({ population: 100, ownerOccupancyRate: 0.8 }),
    ]);
    // Only the second DA contributes a finite rate, but both weights count.
    expect(agg.means.ownerOccupancyRate).toBeCloseTo((0.8 * 100) / 200, 10);
  });
});
