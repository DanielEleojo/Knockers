import { Router } from 'express';
import { dasInBbox } from '../statcan/geographic.js';
import { reverseGeocode } from '../statcan/nominatim.js';

const router = Router();

/**
 * GET /api/geo/das-in-bbox?south&west&north&east
 * → { dguids: string[], geojson: FeatureCollection }
 */
router.get('/das-in-bbox', async (req, res) => {
  const parsed = parseBbox(req.query);
  if (parsed.error) {
    console.warn('[geo] bad bbox query:', req.query, '→', parsed.error);
    return res.status(400).json({ error: parsed.error, received: req.query });
  }

  try {
    const result = await dasInBbox(parsed.bbox);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/geo/reverse?lat&lng
 * → { address: string }  (best-effort; '' when nothing is found)
 */
router.get('/reverse', async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: 'Missing or invalid lat/lng.' });
  }
  try {
    const address = await reverseGeocode({ lat, lng });
    res.json({ address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function parseBbox(q) {
  const south = Number(q.south);
  const west = Number(q.west);
  const north = Number(q.north);
  const east = Number(q.east);

  const missing = ['south', 'west', 'north', 'east'].filter((k) => !Number.isFinite(Number(q[k])));
  if (missing.length) {
    return { error: `Missing or non-numeric bbox params: ${missing.join(', ')}` };
  }

  // Normalize ordering so a rectangle drawn right-to-left or top-to-bottom still works.
  const s = Math.min(south, north);
  const n = Math.max(south, north);
  const w = Math.min(west, east);
  const e = Math.max(west, east);

  if (s === n || w === e) {
    return { error: 'Degenerate bbox (zero width or height). Draw a larger rectangle.' };
  }
  return { bbox: { south: s, west: w, north: n, east: e } };
}

export default router;
