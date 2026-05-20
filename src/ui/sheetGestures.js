// Draggable bottom sheet with three snap points. The sheet is full-height and
// pushed down via `--sheet-y` (a translateY in px); dragging the handle moves
// it, and on release it snaps to the nearest point. Drag is bound to the handle
// only, so the scrollable body never fights the gesture.

const POINTS = ['peek', 'half', 'full'];

let _sheet;
let _handle;
let _peek;
let _y = { peek: 0, half: 0, full: 0 };
let _snap = 'peek';

export function initSheetGestures() {
  _sheet = document.getElementById('sheet');
  _handle = document.getElementById('sheet-handle');
  _peek = document.getElementById('sheet-peek');
  compute();
  apply('peek', false);
  attachDrag();
  window.addEventListener('resize', () => {
    compute();
    apply(_snap, false);
  });
}

export function snapTo(point) {
  if (POINTS.includes(point)) apply(point, true);
}

/* translateY (px) for each snap point: 0 = fully open, larger = pushed down. */
function compute() {
  const vh = window.innerHeight;
  const h = _sheet.getBoundingClientRect().height || vh * 0.82;
  // Peek leaves the whole header (handle + actions + tally) visible.
  const headerH = _peek?.offsetHeight || 150;
  const peekPx = headerH + 6;
  // Publish the header height so map controls (attribution) can sit above it.
  document.documentElement.style.setProperty('--peek-h', `${headerH}px`);
  _y = {
    full: 0,
    half: clamp(Math.round(h - Math.max(vh * 0.46, peekPx)), 0, h),
    peek: clamp(Math.round(h - peekPx), 0, h),
  };
}

function apply(point, animate) {
  _snap = point;
  if (!animate) _sheet.style.transition = 'none';
  _sheet.style.setProperty('--sheet-y', `${_y[point]}px`);
  _sheet.dataset.snap = point;
  if (!animate) {
    // Force a reflow so the next change animates again.
    void _sheet.offsetHeight;
    _sheet.style.transition = '';
  }
}

function attachDrag() {
  let startY = 0;
  let startT = 0;
  let moved = 0;
  let dragging = false;

  _handle.addEventListener('pointerdown', (e) => {
    dragging = true;
    moved = 0;
    startY = e.clientY;
    startT = currentTranslate();
    _sheet.style.transition = 'none';
    _handle.setPointerCapture?.(e.pointerId);
  });

  _handle.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    moved = Math.max(moved, Math.abs(dy));
    _sheet.style.setProperty('--sheet-y', `${clamp(startT + dy, _y.full, _y.peek)}px`);
  });

  const end = () => {
    if (!dragging) return;
    dragging = false;
    _sheet.style.transition = '';
    if (moved < 6) {
      apply(_snap === 'peek' ? 'half' : 'peek', true); // treat as a tap
    } else {
      apply(nearest(currentTranslate()), true);
    }
  };
  _handle.addEventListener('pointerup', end);
  _handle.addEventListener('pointercancel', end);
}

function currentTranslate() {
  return parseFloat(getComputedStyle(_sheet).getPropertyValue('--sheet-y')) || 0;
}

function nearest(y) {
  return POINTS.reduce((best, p) => (Math.abs(_y[p] - y) < Math.abs(_y[best] - y) ? p : best), 'peek');
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
