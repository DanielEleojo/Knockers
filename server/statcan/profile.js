/**
 * Census Profile data for a batch of Dissemination Areas.
 *
 * Source priority:
 *   1. CensusMapper API (real CA21 data) — when CENSUSMAPPER_API_KEY is set
 *   2. Deterministic synthetic fallback — when the key is missing or the API errors
 *
 * The synthetic fallback keeps the UI/scoring usable without a key and means
 * a network outage degrades gracefully instead of hard-failing.
 *
 * The 4 signals returned:
 *   - medianHouseholdIncome  ($)
 *   - ownerOccupancyRate     (0..1)
 *   - oldHomesRate           (0..1, share built ≤1980)
 *   - singleDetachedRate     (0..1)
 *
 * Each response is { ok, data:[…profiles], mock:boolean }.
 */

import { cached } from '../cache.js';
import { fetchProfiles } from './censusmapper.js';

const API_KEY = process.env.CENSUSMAPPER_API_KEY || '';

/**
 * Fetch profiles for many DGUIDs in one call (CensusMapper batches efficiently).
 * @param {string[]} dguids
 * @returns {Promise<{ok:true, data:Array, mock:boolean}>}
 */
export async function profilesForDguids(dguids) {
  if (!dguids?.length) return { ok: true, data: [], mock: false };

  if (API_KEY) {
    try {
      const data = await cached(`cm::${dguids.slice().sort().join(',')}`, () =>
        fetchProfiles(dguids, API_KEY)
      );
      if (data.length > 0) return { ok: true, data, mock: false };
      console.warn('[census] CensusMapper returned empty; falling back to synthetic.');
    } catch (err) {
      console.warn(`[census] CensusMapper failed (${err.message}); falling back to synthetic.`);
    }
  } else {
    console.warn('[census] No CENSUSMAPPER_API_KEY set — using synthetic data.');
  }

  return { ok: true, data: dguids.map(syntheticProfile), mock: true };
}

/**
 * Deterministic synthetic profile keyed on DGUID. Same DGUID → same numbers.
 * Values land in plausible Canadian ranges so the UI looks correct.
 */
function syntheticProfile(dguid) {
  const r = makeRng(hash(dguid));
  return {
    dguid,
    population: 300 + Math.floor(r() * 1400),
    medianHouseholdIncome: 45_000 + Math.floor(r() * 105_000),
    ownerOccupancyRate: 0.30 + r() * 0.60,
    oldHomesRate: r(),
    singleDetachedRate: 0.10 + r() * 0.85,
  };
}

function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function makeRng(seed) {
  let s = seed >>> 0;
  return function next() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
