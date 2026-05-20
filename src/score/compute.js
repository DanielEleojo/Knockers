import { WEIGHTS } from '../config/weights.js';
import { normalize } from './normalize.js';
import { aggregate } from './aggregate.js';
import { dasInBbox, censusProfiles } from '../api/client.js';

/**
 * End-to-end: bbox → score breakdown.
 * @param {{south,west,north,east}} bbox
 */
export async function scoreBbox(bbox) {
  const { dguids, geojson } = await dasInBbox(bbox);
  if (!dguids?.length) {
    throw new Error('No Dissemination Areas found in that rectangle.');
  }

  const { data: usable, mock } = await censusProfiles(dguids);
  if (!usable?.length) throw new Error('No census data returned for those areas.');

  const agg = aggregate(usable);
  if (!agg) throw new Error('Could not aggregate census signals.');

  const breakdown = {};
  let scoreFraction = 0;

  for (const [key, cfg] of Object.entries(WEIGHTS)) {
    const raw = agg.means[key];
    const norm = normalize(raw, cfg);
    const contribution = norm * cfg.weight;
    scoreFraction += contribution;
    breakdown[key] = { raw, normalized: norm, weight: cfg.weight, contribution, label: cfg.label, format: cfg.format };
  }

  return {
    score: Math.round(scoreFraction * 100),
    breakdown,
    daCount: agg.daCount,
    population: agg.totalPopulation,
    bbox,
    geojson,
    mock,
  };
}
