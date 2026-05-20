# Tech Stack

Why each piece, and what to swap if it ever stops working.

## Frontend: Vite + Vanilla JS

**Why:** ES modules, hot reload, no framework overhead. The app is small enough that React would be cargo-culted weight.

**Swap to React** if/when:
- Score panel needs reactive state across more than 3 components
- You add comparison view (two scores side-by-side)
- You want `react-leaflet` for typed map components

## Map: Leaflet + leaflet-draw + OSM tiles

**Why:** Free, mature, no API key. `leaflet-draw` gives the rectangle tool out of the box.

**Tile risk:** OpenStreetMap throttles heavy use from one origin. Personal use is fine. If tiles 429, swap `src/config/map.js` to a free CARTO or Stadia URL.

## Backend: Express proxy (`server/`)

**Why this exists at all:**
1. **CORS.** StatCan endpoints don't reliably set `Access-Control-Allow-Origin` for browsers.
2. **Caching.** DA boundaries change every 5 years; profile data changes every 5 years. Caching is free latency.
3. **Error normalization.** StatCan inconsistently returns XML, HTML error pages, or JSON. The proxy normalizes everything to `{ ok, data, error }`.

**Runs separate from Vite.** Vite proxies `/api/*` → `:8787`. Both are launched together by `concurrently`.

**Swap to serverless** (Netlify Functions, Cloudflare Workers) if you ever want to host this publicly. The route handlers in `server/routes/` are pure functions of `(req, res)` and port easily.

## Data sources

Two endpoints, one per scoring run:

1. **StatCan ArcGIS REST** ([server/statcan/geographic.js](../server/statcan/geographic.js)) —
   `geo.statcan.gc.ca/geo_wa/rest/services/2021/Cartographic_boundary_files/MapServer/12`.
   One spatial query (bbox → list of DA DGUIDs). Free, no key.

2. **CensusMapper API** ([server/statcan/censusmapper.js](../server/statcan/censusmapper.js)) —
   `POST https://censusmapper.ca/api/v1/data.csv`. One call returns all 4 signals
   for every DA in the bbox. Free, key required (`CENSUSMAPPER_API_KEY` in `.env`).

**Why CensusMapper instead of StatCan's WDS:** StatCan's official SDMX endpoint
(`api.statcan.gc.ca/.../sdmx/rest/`) exists but its dataflow/key format is opaque
and data queries reliably 404 or timeout. CensusMapper wraps the same underlying
data in one REST endpoint that batches regions efficiently.

**Mock fallback:** when the key is missing or CensusMapper errors, the proxy
returns deterministic synthetic values seeded by DGUID. The score still renders
end-to-end with a `⚠ MOCK` banner so you never confuse synthetic with real.

**Pinned to:** Census 2021. When 2026 lands, change the `dataset: 'CA21'`
constant in [server/statcan/censusmapper.js](../server/statcan/censusmapper.js)
and re-verify the vector IDs.

**Vector IDs:** see the table at the top of
[server/statcan/censusmapper.js](../server/statcan/censusmapper.js).
Verify any time the census cycle changes by calling
`GET https://censusmapper.ca/api/v1/vector_info/CA21.csv?api_key=...` and
grepping for the label.

## Persistence: localStorage

**Why:** No DB process, no schema migrations, no backup story. For one user with a handful of pins it's the right call.

**Storage key:** `lume.pins.v1`. Bump the `v1` suffix if you change the schema.

**Swap to SQLite + Better-SQLite3** if you ever want pin history, geo-indexed search, or sync across devices.

## File layout rationale

```
server/                     # Process #1: Express :8787
├── index.js                # boot
├── routes/                 # HTTP-layer (req/res)
├── statcan/                # vendor-specific client (no Express deps here)
└── cache.js                # cross-cutting concern

src/                        # Process #2: Vite :5173
├── main.js                 # composition root
├── config/                 # tunables that aren't logic
├── map/                    # Leaflet concerns only
├── api/                    # HTTP client wrappers
├── score/                  # pure scoring logic, framework-free
├── ui/                     # DOM manipulation only
└── storage/                # localStorage I/O
```

**Rule:** `score/` and `storage/` are pure — no Leaflet, no DOM. That makes them trivial to unit-test later.

## Running on Arch

```bash
sudo pacman -S nodejs npm     # if you don't already have them
cd ~/Documents/Knockers
npm install
npm run dev
```

Open <http://localhost:5173>. Stop with `Ctrl+C` (kills both processes via `concurrently`).
