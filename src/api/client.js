// Thin wrapper around fetch for the Express proxy. All paths are /api/*.

async function getJson(path) {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || `Request failed: ${res.status}`);
  }
  return data;
}

// → { dguids: string[], geojson: FeatureCollection } for the intersecting DAs.
export function dasInBbox(bbox) {
  const qs = new URLSearchParams({
    south: bbox.south,
    west: bbox.west,
    north: bbox.north,
    east: bbox.east,
  });
  return getJson(`/api/geo/das-in-bbox?${qs}`);
}

export async function censusProfiles(dguids) {
  const res = await fetch('/api/census/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ dguids }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

// Best-effort reverse geocode. Returns a short address string, or '' on failure.
export async function reverseGeocode(lat, lng) {
  try {
    const qs = new URLSearchParams({ lat, lng });
    const { address } = await getJson(`/api/geo/reverse?${qs}`);
    return address || '';
  } catch {
    return '';
  }
}
