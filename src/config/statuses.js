/**
 * Door-knock outcome statuses. Each house (knock) carries exactly one.
 * `color` drives the map marker + UI chips; `short` is used in tight rows.
 */
export const STATUSES = {
  no_answer:      { label: 'No answer',      short: 'No ans', color: '#9aa0a6' },
  interested:     { label: 'Interested',     short: 'Lead',   color: '#2ecc71' },
  callback:       { label: 'Callback later', short: 'Callbk', color: '#f1c40f' },
  not_interested: { label: 'Not interested', short: 'Nope',   color: '#e74c3c' },
  sold:           { label: 'Sold',           short: 'Sold',   color: '#ff7b00' },
};

// Display/iteration order (also the order of buttons in the editor).
export const STATUS_ORDER = ['no_answer', 'interested', 'callback', 'not_interested', 'sold'];

export const DEFAULT_STATUS = 'no_answer';

export function isStatus(s) {
  return Object.prototype.hasOwnProperty.call(STATUSES, s);
}

export function statusColor(s) {
  return (STATUSES[s] || STATUSES[DEFAULT_STATUS]).color;
}

export function statusLabel(s) {
  return (STATUSES[s] || STATUSES[DEFAULT_STATUS]).label;
}
