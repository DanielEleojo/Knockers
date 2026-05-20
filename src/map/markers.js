import L from 'leaflet';
import { statusColor } from '../config/statuses.js';

/**
 * A small colored dot marker for a knocked house. Color encodes status.
 * Uses a divIcon so we don't have to bundle a PNG per status color.
 */
export function statusIcon(status) {
  return L.divIcon({
    className: 'knock-marker',
    html: `<span class="knock-dot" style="background:${statusColor(status)}"></span>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}
