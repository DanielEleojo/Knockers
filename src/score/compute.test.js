import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dasInBbox, censusProfiles } from '../api/client.js';
import { scoreBbox } from './compute.js';

vi.mock('../api/client.js', () => ({
  dasInBbox: vi.fn(),
  censusProfiles: vi.fn(),
}));

const BBOX = { south: 43, west: -79, north: 44, east: -78 };

// Values sit at the midpoint of every weights.js range → each signal
// normalizes to 0.5 → weighted score is 0.5 * 100 = 50.
const MIDPOINT_PROFILE = {
  dguid: '2021S051200000001',
  population: 100,
  medianHouseholdIncome: 95_000,
  ownerOccupancyRate: 0.6,
  oldHomesRate: 0.45,
  singleDetachedRate: 0.5,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('scoreBbox', () => {
  it('computes a population-weighted score and breakdown', async () => {
    const geojson = { type: 'FeatureCollection', features: [{ id: 1 }] };
    dasInBbox.mockResolvedValue({ dguids: ['2021S051200000001'], geojson });
    censusProfiles.mockResolvedValue({ data: [MIDPOINT_PROFILE], mock: false });

    const result = await scoreBbox(BBOX);

    expect(result.score).toBe(50);
    expect(result.daCount).toBe(1);
    expect(result.population).toBe(100);
    expect(result.mock).toBe(false);
    expect(result.geojson).toBe(geojson); // passed through for the map
    expect(Object.keys(result.breakdown)).toEqual([
      'medianHouseholdIncome',
      'ownerOccupancyRate',
      'oldHomesRate',
      'singleDetachedRate',
    ]);
    expect(result.breakdown.medianHouseholdIncome.normalized).toBeCloseTo(0.5, 10);
  });

  it('propagates the mock flag from the census layer', async () => {
    dasInBbox.mockResolvedValue({ dguids: ['x'], geojson: null });
    censusProfiles.mockResolvedValue({ data: [MIDPOINT_PROFILE], mock: true });
    const result = await scoreBbox(BBOX);
    expect(result.mock).toBe(true);
  });

  it('throws when no DAs intersect the rectangle', async () => {
    dasInBbox.mockResolvedValue({ dguids: [], geojson: null });
    await expect(scoreBbox(BBOX)).rejects.toThrow(/No Dissemination Areas/);
  });

  it('throws when census data is empty', async () => {
    dasInBbox.mockResolvedValue({ dguids: ['x'], geojson: null });
    censusProfiles.mockResolvedValue({ data: [], mock: false });
    await expect(scoreBbox(BBOX)).rejects.toThrow(/No census data/);
  });
});
