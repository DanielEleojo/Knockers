import L from 'leaflet';
import { getMap, getLocateLayer } from './map.js';
import { watchPosition } from '../ui/geolocate.js';

// Live "you are here": a pulsing dot + accuracy ring that tracks the user, with
// an optional follow mode that recenters the map until the user pans away.

const DOT_ICON = L.divIcon({
  className: 'locate-marker',
  html: '<span class="locate-dot"></span>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

let _stop = null;
let _dot = null;
let _ring = null;
let _last = null;
let _follow = false;
let _onState = null; // notified when follow/active state changes

export function isLocating() {
  return Boolean(_stop);
}

export function isFollowing() {
  return _follow;
}

export function onLocateState(cb) {
  _onState = cb;
}

/** Begin watching position. Idempotent. `onError` surfaces permission issues. */
export function startLocating({ onError } = {}) {
  if (_stop) return;

  // A user-initiated pan cancels follow so the map doesn't fight the operator.
  getMap().on('dragstart', () => setFollow(false));

  _stop = watchPosition({
    onUpdate: (fix) => {
      _last = fix;
      render(fix);
      if (_follow) getMap().panTo([fix.lat, fix.lng], { animate: true });
    },
    onError: (err) => {
      stopLocating();
      onError?.(err);
    },
  });
  notify();
}

export function stopLocating() {
  _stop?.();
  _stop = null;
  setFollow(false);
  getLocateLayer().clearLayers();
  _dot = _ring = null;
  notify();
}

/** Center on the latest fix and turn follow on. Starts locating if needed. */
export function recenter({ onError } = {}) {
  if (!_stop) startLocating({ onError });
  setFollow(true);
  if (_last) getMap().setView([_last.lat, _last.lng], Math.max(getMap().getZoom(), 17), { animate: true });
}

function render(fix) {
  const latlng = [fix.lat, fix.lng];
  const layer = getLocateLayer();
  if (!_dot) {
    _ring = L.circle(latlng, {
      radius: fix.accuracy || 0,
      color: '#2f7bff',
      weight: 1,
      fillColor: '#2f7bff',
      fillOpacity: 0.12,
      interactive: false,
    }).addTo(layer);
    _dot = L.marker(latlng, { icon: DOT_ICON, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(layer);
  } else {
    _dot.setLatLng(latlng);
    _ring.setLatLng(latlng);
    _ring.setRadius(fix.accuracy || 0);
  }
}

function setFollow(on) {
  if (_follow === on) return;
  _follow = on;
  notify();
}

function notify() {
  _onState?.({ active: Boolean(_stop), following: _follow });
}
