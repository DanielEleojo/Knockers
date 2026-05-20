/**
 * Resolve geography to Dissemination Area DGUIDs using StatCan's ArcGIS REST.
 *
 * Layer 12 of the 2021 Cartographic Boundary MapServer is the DA layer.
 * Verified live URL:
 *   https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/12
 *   fields: OBJECTID, SHAPE, DAUID, DGUID, LANDAREA, PRUID
 *
 * ArcGIS REST supports spatial queries directly, so we send a single
 * bounding-box request and get every intersecting DA in one round trip.
 * We request GeoJSON with generalized geometry so the frontend can outline
 * the actual DAs that were scored.
 */

import { fetchJson } from './client.js';
import { cached } from '../cache.js';

const DA_LAYER_URL =
  'https://geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/12/query';

const MAX_FEATURES = 200; // soft cap so a huge bbox doesn't melt the proxy

/**
 * @param {{south:number, west:number, north:number, east:number}} bbox
 * @returns {Promise<{dguids: string[], geojson: object}>} unique DGUIDs
 *   intersecting the bbox plus a GeoJSON FeatureCollection of their boundaries
 */
export async function dasInBbox(bbox) {
  const geometry = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  const params = new URLSearchParams({
    geometry,
    geometryType: 'esriGeometryEnvelope',
    inSR: '4326',
    outSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: 'DAUID,DGUID',
    returnGeometry: 'true',
    maxAllowableOffset: '0.0002', // generalize polygons to shrink the payload
    resultRecordCount: String(MAX_FEATURES),
    f: 'geojson',
  });
  const url = `${DA_LAYER_URL}?${params}`;

  const res = await cached(url, () => fetchJson(url));
  if (!res.ok) throw new Error(res.error || 'ArcGIS query failed');

  const features = res.data?.features ?? [];
  const dguids = features
    .map((f) => f.properties?.DGUID)
    .filter((d) => typeof d === 'string' && d.length > 0);

  return {
    dguids: [...new Set(dguids)],
    geojson: { type: 'FeatureCollection', features },
  };
}
