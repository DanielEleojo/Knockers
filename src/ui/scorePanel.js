// Pure HTML builders for the area-scout score card. The bottom sheet decides
// where these go; this module just turns a score result into markup.

export function scoreLoadingHtml() {
  return `<p class="score-msg">Scoring area…</p>`;
}

export function scoreErrorHtml(msg) {
  return `<p class="score-msg error">${escape(msg)}</p>`;
}

export function scoreCardHtml(result) {
  const { score, breakdown, daCount, population, mock } = result;
  return `
    ${mock ? '<div class="mock-banner">⚠ MOCK census data</div>' : ''}
    <div class="score-hero ${tierClass(score)}">
      <div class="score-number">${score}</div>
      <div class="score-label">Knock Score</div>
    </div>
    <div class="score-meta">${daCount} DA${daCount === 1 ? '' : 's'} · pop. ${Number(population).toLocaleString()}</div>
    <ul class="breakdown">
      ${Object.values(breakdown)
        .map(
          (b) => `
        <li>
          <div class="bk-row">
            <span>${escape(b.label)}</span>
            <span class="bk-value">${b.format ? escape(b.format(b.raw)) : escape(b.raw)}</span>
          </div>
          <div class="bk-bar" style="--w:${Math.round(b.normalized * 100)}%"></div>
        </li>`
        )
        .join('')}
    </ul>
    <button id="score-done-btn" class="wide-btn ghost" type="button">Done</button>
  `;
}

export function tierClass(s) {
  if (s >= 75) return 'tier-hot';
  if (s >= 55) return 'tier-warm';
  if (s >= 35) return 'tier-mid';
  return 'tier-cold';
}

export function escape(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
