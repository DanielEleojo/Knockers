import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MAP_CENTER, MAP_ZOOM, TILE_URL, TILE_ATTRIBUTION } from '../config/map.js';

// Default Leaflet marker icons use relative URLs that break under Vite.
// Patch to use the bundled images so markers render.
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

let _map;
let _pinLayer;
let _scoutLayer;

export function initMap(elementId) {
  _map = L.map(elementId).setView(MAP_CENTER, MAP_ZOOM);
  L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(_map);

  _pinLayer = L.layerGroup().addTo(_map);
  _scoutLayer = L.layerGroup().addTo(_map);
  return _map;
}

export const getMap = () => _map;
export const getPinLayer = () => _pinLayer;
export const getScoutLayer = () => _scoutLayer;
