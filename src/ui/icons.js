// Inline SVG icon set. Each is a function returning an <svg> string sized to
// 1em so it inherits font-size and color (stroke/fill use currentColor).
// Keep stroke-based, 24x24 viewBox, rounded joins for a consistent look.

const svg = (paths, { fill = false } = {}) =>
  `<svg class="icon" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false"
     fill="${fill ? 'currentColor' : 'none'}" stroke="${fill ? 'none' : 'currentColor'}"
     stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

// Location arrow (filled paper-plane / nav arrow) — "I'm here"
export const iconHere = () => svg('<path d="M12 2 4.5 21l7.5-4 7.5 4z"/>', { fill: true });

// Pin with a plus — "Tap-add"
export const iconPinPlus = () =>
  svg('<path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11Z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/>');

// Dashed scan rectangle — "Scout"
export const iconScout = () =>
  svg('<rect x="3.5" y="3.5" width="17" height="17" rx="2" stroke-dasharray="3 3"/><path d="M9 12h6M12 9v6"/>');

// Crosshair — recenter / locate me
export const iconCrosshair = () =>
  svg('<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><line x1="12" y1="1.5" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22.5"/><line x1="1.5" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22.5" y2="12"/>');

// Download — export CSV
export const iconDownload = () =>
  svg('<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>');

// Chevron back
export const iconBack = () => svg('<path d="m15 5-7 7 7 7"/>');

// Trash — delete
export const iconTrash = () =>
  svg('<path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>');

// Check — save
export const iconCheck = () => svg('<path d="m4 12 5 5L20 6"/>');
