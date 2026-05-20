import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MAP_CENTER,
  MAP_ZOOM,
  TILE_URL,
  TILE_SUBDOMAINS,
  TILE_MAX_ZOOM,
  TILE_ATTRIBUTION,
} from '../config/map.js';

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
let _locateLayer;

export function initMap(elementId) {
  // Zoom control re-added top-right so it clears the iOS left-edge back-swipe
  // and the bottom sheet / FABs.
  _map = L.map(elementId, { zoomControl: false }).setView(MAP_CENTER, MAP_ZOOM);
  L.control.zoom({ position: 'topright' }).addTo(_map);

  L.tileLayer(TILE_URL, {
    attribution: TILE_ATTRIBUTION,
    subdomains: TILE_SUBDOMAINS,
    maxZoom: TILE_MAX_ZOOM,
    detectRetina: true,
  }).addTo(_map);

  _pinLayer = L.layerGroup().addTo(_map);
  _scoutLayer = L.layerGroup().addTo(_map);
  _locateLayer = L.layerGroup().addTo(_map);
  return _map;
}

export const getMap = () => _map;
export const getPinLayer = () => _pinLayer;
export const getScoutLayer = () => _scoutLayer;
export const getLocateLayer = () => _locateLayer;
