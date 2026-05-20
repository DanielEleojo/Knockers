import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import { getMap, getScoutLayer } from './map.js';

let _handler = null;
let _onComplete = null;

/**
 * Enter rectangle draw mode. Calls onComplete({bounds, layer}) on finish.
 * Auto-disables after one rectangle.
 */
export function startRectangleDraw(onComplete) {
  const map = getMap();
  if (!map) throw new Error('Map not initialized');

  cancelDraw();
  _onComplete = onComplete;

  _handler = new L.Draw.Rectangle(map, {
    shapeOptions: {
      color: '#ff7b00',       // bright orange stroke
      weight: 3,
      opacity: 1,
      fillColor: '#ff7b00',
      fillOpacity: 0.25,      // clearly visible orange tint
      dashArray: '6 4',       // dashed border = "drawing in progress"
    },
    showArea: false,
    metric: false,
    repeatMode: false,
  });
  _handler.enable();

  map.once(L.Draw.Event.CREATED, handleCreated);
}

function handleCreated(e) {
  const layer = e.layer;
  const bounds = layer.getBounds();
  const scoutLayer = getScoutLayer();
  scoutLayer.clearLayers();
  // Lock-in style: solid border (no dashes), slightly stronger fill.
  layer.setStyle({
    color: '#ff7b00',
    weight: 3,
    opacity: 1,
    fillColor: '#ff7b00',
    fillOpacity: 0.18,
    dashArray: null,
  });
  scoutLayer.addLayer(layer);

  const bbox = {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  };

  if (_onComplete) _onComplete({ bbox, layer });
  _handler = null;
  _onComplete = null;
}

export function cancelDraw() {
  if (_handler) {
    _handler.disable();
    _handler = null;
  }
  const map = getMap();
  if (map) map.off(L.Draw.Event.CREATED, handleCreated);
  _onComplete = null;
}

export function clearScoutShapes() {
  getScoutLayer()?.clearLayers();
}

/**
 * Outline the Dissemination Areas that were scored, on top of the drawn
 * rectangle. Thin orange stroke, no fill, so both stay legible.
 */
export function renderScoutAreas(geojson) {
  if (!geojson?.features?.length) return;
  L.geoJSON(geojson, {
    style: {
      color: '#ffae5a',
      weight: 1.5,
      opacity: 0.9,
      fill: false,
    },
  }).addTo(getScoutLayer());
}
