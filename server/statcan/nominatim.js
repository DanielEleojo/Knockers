/**
 * Reverse geocoding via OpenStreetMap Nominatim (free, no key).
 *
 * Usage policy: ≤1 request/second and a valid User-Agent identifying the app
 * (set by fetchJson). Results are cached so repeated lookups of the same spot
 * don't re-hit the service. Best-effort: returns '' rather than throwing.
 */

import { fetchJson } from './client.js';
import { cached } from '../cache.js';

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

export async function reverseGeocode({ lat, lng }) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '18',
    addressdetails: '1',
  });
  const url = `${ENDPOINT}?${params}`;
  const res = await cached(url, () => fetchJson(url));
  if (!res.ok) return '';
  return shortAddress(res.data);
}

function shortAddress(data) {
  const a = data?.address || {};
  const road = a.road || a.pedestrian || a.footway || a.residential;
  if (road) return a.house_number ? `${a.house_number} ${road}` : road;
  if (data?.display_name) return data.display_name.split(',').slice(0, 2).join(', ').trim();
  return '';
}
