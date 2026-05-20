# Lume Area Scout (“Knockers”)

A door-knocking field tool with two halves:

- **Scout** an area → get a **Knock Score** (0–100) telling you whether it's worth knocking.
- **Track** every house you talk to — outcome (No answer / Lead / Callback / Not interested / Sold), note, and location — as colored pins that persist on your phone.

Installs to the iPhone home screen as a PWA. Personal-use tool for window-cleaning leads.

## Stack

- **Vite + Vanilla JS** (frontend), installable **PWA** (`vite-plugin-pwa`)
- **Leaflet** + **leaflet-draw** + OpenStreetMap tiles (map)
- **Express** proxy (CORS + LRU cache) — runs locally in dev, wrapped as a Netlify function in prod
- **StatCan ArcGIS REST** for Dissemination Area boundaries (free, no key)
- **CensusMapper API** for 2021 census variables (free, requires key)
- **OSM Nominatim** for reverse-geocoding house addresses (free)
- **localStorage** for the house tracker (key `lume.knocks.v1`; old `lume.pins.v1` auto-migrates)

Total cost to run: **$0**.

## Run it (Arch Linux)

```bash
npm install
cp .env.example .env       # then paste your CensusMapper key
npm run dev
```

Then open <http://localhost:5173>.

This launches both the Vite dev server (`:5173`) and the Express proxy (`:8787`) in one shell via `concurrently`. Vite proxies `/api/*` to the Express process. Without a key the app still works — it falls back to deterministic synthetic data and shows a `⚠ MOCK` banner.

Get a free CensusMapper key at <https://censusmapper.ca/api> (sign in → API Access). Paste the full key (including the `CensusMapper_` prefix) into `.env`.

## How it works

### Track houses
- **＋ I'm here** — drops a house at your phone's GPS location and opens its editor.
- **Tap-add** — then tap the house on the map to log one manually.
- Set an outcome (color-coded), add a note, **Save**. Each house becomes a colored pin; the bottom sheet lists them, filters by status, and shows today's tally. **Export CSV** downloads everything.
- Addresses are filled in automatically via reverse geocoding when online.

### Scout an area
1. Tap **Scout** → drag a rectangle on the map.
2. The app resolves the rectangle to Statistics Canada Dissemination Areas (one ArcGIS call), fetches CA21 census variables for all of them in one CensusMapper call, and computes a population-weighted score:

   | Signal | CA21 Vector | Weight |
   |---|---|---|
   | Median household income | `v_CA21_906` | 35% |
   | Owner-occupancy rate | `v_CA21_4238 / 4237` | 30% |
   | % homes built ≤ 1980 | `(v_CA21_4264 + 4265) / 4263` | 20% |
   | % single-detached dwellings | `v_CA21_435 / 434` | 15% |

3. The scored Dissemination Areas are outlined on the map; the score + breakdown appear in the bottom sheet.

## Put it on your iPhone (free)

Deploy to **Netlify** (static build + the Express proxy wrapped as one serverless function — see [netlify.toml](netlify.toml) and [netlify/functions/api.js](netlify/functions/api.js)):

1. `git init && git add -A && git commit -m "…"`, push to GitHub.
2. In Netlify: **Add new site → Import from GitHub**, pick the repo (build settings come from `netlify.toml`).
3. Site settings → **Environment** → add `CENSUSMAPPER_API_KEY`.
4. On your iPhone, open the Netlify URL in **Safari** → **Share → Add to Home Screen**. It launches full-screen like a native app — no App Store, no Apple Developer account.

Local preview of the production build: `npm run build && npm run preview`.

## File layout

See [docs/TECH_STACK.md](docs/TECH_STACK.md) for the rationale.

```
server/   Express proxy (app.js) + StatCan/Nominatim clients
src/      Frontend — map, draw, score pipeline, house tracker UI, storage
netlify/  Serverless wrapper for the Express app
docs/     PRD + tech stack notes
```

## Tuning the score

Edit [src/config/weights.js](src/config/weights.js). All four weights and their normalization bounds live there.

## Tests

The pure logic (scoring pipeline, CSV parser, house store) is unit-tested with Vitest:

```bash
npm test          # run once
npm run test:watch
```
