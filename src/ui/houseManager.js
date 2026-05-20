import L from 'leaflet';
import { getPinLayer, getMap } from '../map/map.js';
import { listKnocks } from '../storage/knocks.js';
import { statusIcon } from '../map/markers.js';

// id → Leaflet marker. The map is the only place markers live; the sheet
// drives everything else and calls back in here to keep markers in sync.
const _markers = new Map();
let _onSelect = null;

/** Register the handler fired when a house marker is tapped. Receives the id. */
export function onSelect(cb) {
  _onSelect = cb;
}

/** (Re)render every stored knock as a marker. */
export function initHouseLayer() {
  const layer = getPinLayer();
  layer.clearLayers();
  _markers.clear();
  for (const k of listKnocks()) addMarker(k);
}

export function addMarker(knock) {
  const marker = L.marker([knock.lat, knock.lng], { icon: statusIcon(knock.status) }).addTo(
    getPinLayer()
  );
  marker.on('click', () => _onSelect?.(knock.id));
  _markers.set(knock.id, marker);
  return marker;
}

export function refreshMarker(knock) {
  const marker = _markers.get(knock.id);
  if (marker) marker.setIcon(statusIcon(knock.status));
}

export function removeMarker(id) {
  const marker = _markers.get(id);
  if (marker) {
    getPinLayer().removeLayer(marker);
    _markers.delete(id);
  }
}

export function clearMarkers() {
  getPinLayer().clearLayers();
  _markers.clear();
}

/** Pan/zoom to a knock's marker. */
export function focus(id) {
  const marker = _markers.get(id);
  if (!marker) return;
  const map = getMap();
  map.setView(marker.getLatLng(), Math.max(map.getZoom(), 17));
}
