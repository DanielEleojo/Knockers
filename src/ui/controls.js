import { startRectangleDraw, cancelDraw, clearScoutShapes, renderScoutAreas } from '../map/draw.js';
import { scoreBbox } from '../score/compute.js';
import { getMap } from '../map/map.js';
import { getCurrentPosition } from './geolocate.js';
import { startLocating, recenter, onLocateState } from '../map/locate.js';
import { logKnockAt, scoreLoading, scoreError, scoreResult, toast } from './houseSheet.js';
import { iconHere, iconPinPlus, iconScout, iconCrosshair } from './icons.js';

let _scouting = false;
let _adding = false;

export function initControls() {
  const hereFab = document.getElementById('here-fab');
  const addFab = document.getElementById('add-fab');
  const scoutFab = document.getElementById('scout-fab');
  const recenterBtn = document.getElementById('recenter-btn');

  hereFab.innerHTML = `${iconHere()}<span>I’m here</span>`;
  addFab.innerHTML = `${iconPinPlus()}<span>Tap-add</span>`;
  scoutFab.innerHTML = `${iconScout()}<span>Scout</span>`;
  recenterBtn.innerHTML = iconCrosshair();

  // Reflect locate/follow state on the recenter button.
  onLocateState(({ active, following }) => {
    recenterBtn.classList.toggle('active', active);
    recenterBtn.classList.toggle('following', following);
  });
  recenterBtn.addEventListener('click', () => recenter({ onError: (err) => toast(err.message) }));

  // "I'm here" — log a house at the phone's current GPS fix.
  hereFab.addEventListener('click', async () => {
    setAdding(false);
    hereFab.disabled = true;
    hereFab.classList.add('busy');
    startLocating({ onError: () => {} }); // show the live dot too
    try {
      const { lat, lng } = await getCurrentPosition();
      logKnockAt({ lat, lng });
    } catch (err) {
      toast(err.message || 'Could not get your location.');
    } finally {
      hereFab.disabled = false;
      hereFab.classList.remove('busy');
    }
  });

  // "Tap-add" — next map tap logs a house there.
  addFab.addEventListener('click', () => {
    if (_scouting) toggleScout(false);
    setAdding(!_adding);
    if (_adding) {
      toast('Tap the house on the map.');
      getMap().once('click', (e) => {
        setAdding(false);
        logKnockAt({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    } else {
      getMap().off('click');
    }
  });

  // "Scout" — draw a rectangle to score the area.
  scoutFab.addEventListener('click', () => toggleScout(!_scouting));
}

function toggleScout(on) {
  _scouting = on;
  const btn = document.getElementById('scout-fab');
  btn.classList.toggle('active', on);
  document.body.classList.toggle('drawing', on);

  if (!on) {
    cancelDraw();
    return;
  }
  setAdding(false);
  clearScoutShapes();
  toast('Drag a rectangle to score the area.');
  startRectangleDraw(async ({ bbox }) => {
    _scouting = false;
    btn.classList.remove('active');
    document.body.classList.remove('drawing');
    scoreLoading();
    try {
      const result = await scoreBbox(bbox);
      renderScoutAreas(result.geojson);
      scoreResult(result);
    } catch (err) {
      scoreError(err.message || 'Scoring failed.');
    }
  });
}

function setAdding(on) {
  _adding = on;
  const btn = document.getElementById('add-fab');
  btn.classList.toggle('active', on);
  document.body.classList.toggle('adding', on);
  if (!on) getMap().off('click');
}
