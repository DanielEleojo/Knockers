// Map defaults. Center is Oshawa, ON (where the operator is working).
export const MAP_CENTER = [43.8971, -78.8658];
export const MAP_ZOOM = 13;

// CARTO "Positron" light raster basemap — free, no API key, clean and neutral
// so colored house markers pop. {r} = retina suffix on HiDPI.
//
// Note: CARTO's free basemaps target non-commercial / low-volume use, which is
// fine for a single operator. To be fully clean for commercial volume, swap
// this URL for a free MapTiler key style — it's a one-line change here.
export const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
export const TILE_SUBDOMAINS = 'abcd';
export const TILE_MAX_ZOOM = 20;
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
