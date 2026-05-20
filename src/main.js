import './style.css';
import { initMap } from './map/map.js';
import { initHouseLayer } from './ui/houseManager.js';
import { initSheet } from './ui/houseSheet.js';
import { initSheetGestures } from './ui/sheetGestures.js';
import { initControls } from './ui/controls.js';

initMap('map');
initHouseLayer();
initSheet();
initSheetGestures();
initControls();
