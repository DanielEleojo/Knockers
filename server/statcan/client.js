/**
 * Low-level StatCan HTTP client.
 *
 * StatCan APIs are inconsistent: sometimes JSON, sometimes XML, sometimes an HTML
 * error page with a 200. This wrapper:
 *   - Forces JSON Accept header
 *   - Times out at 9s (stays under Netlify's 10s serverless function cap)
 *   - Logs every call (set DEBUG_STATCAN=0 to silence)
 *   - Normalizes errors to { ok: false, status, error }
 */

const DEFAULT_TIMEOUT_MS = 9_000;
const DEBUG = process.env.DEBUG_STATCAN !== '0';

export async function fetchJson(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const start = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    if (DEBUG) console.log(`[statcan] → ${url}`);
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'lume-area-scout/0.1 (personal use)',
      },
      signal: ctrl.signal,
    });

    const text = await res.text();
    const ms = Date.now() - start;

    if (!res.ok) {
      if (DEBUG) console.warn(`[statcan] ← ${res.status} in ${ms}ms (${url})`);
      return { ok: false, status: res.status, error: `StatCan ${res.status}`, body: text.slice(0, 200) };
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      if (DEBUG) console.warn(`[statcan] ← non-JSON in ${ms}ms (${url})`);
      return {
        ok: false,
        status: 502,
        error: 'StatCan returned non-JSON',
        body: text.slice(0, 200),
      };
    }

    if (DEBUG) console.log(`[statcan] ← 200 in ${ms}ms (${url})`);
    return { ok: true, status: 200, data };
  } catch (err) {
    const ms = Date.now() - start;
    const aborted = err?.name === 'AbortError';
    if (DEBUG) console.error(`[statcan] ✗ ${aborted ? 'timeout' : err.message} in ${ms}ms (${url})`);
    return {
      ok: false,
      status: aborted ? 504 : 500,
      error: aborted ? 'StatCan timeout' : err.message,
    };
  } finally {
    clearTimeout(timer);
  }
}
