# PRD — Lume Area Scout (MVP)

## One-line pitch
Highlight any area on a map, get a **Knock Score** (0–100) that tells you if it's worth knocking.

## Problem
Door-knocking blind wastes hours. You need a fast, visual way to tell whether a Canadian neighborhood is likely to convert window-cleaning leads — without paying for skip-trace data or building a CRM.

## Users
One: me. No multi-tenant, no auth, no analytics.

## Core flow

```
Default state: map pans/zooms normally
→ User taps "Scout Area" button
→ Cursor changes, draw mode activates
→ User drags rectangle on map
→ Score appears, draw mode deactivates automatically
→ Button resets, ready to draw another
```

## Knock Score formula

| Signal | Why | Weight | CA21 Vector |
|---|---|---|---|
| Median household income | Disposable income → willingness to pay | 0.35 | `v_CA21_906` |
| Owner-occupancy rate | Renters don't buy window cleaning | 0.30 | `v_CA21_4238 / 4237` |
| % homes built ≤ 1980 | Older homes → more neglect → more need | 0.20 | `(v_CA21_4264+4265) / 4263` |
| % single-detached dwellings | Apartments are not the customer | 0.15 | `v_CA21_435 / 434` |

Data via CensusMapper API; geography via StatCan ArcGIS REST.

Each signal is normalized to 0–1 against tunable bounds in [src/config/weights.js](../src/config/weights.js), then a weighted sum is multiplied by 100.

When a rectangle covers multiple Dissemination Areas, signals are **population-weighted** across the DAs before normalization — a tiny DA can't swing the score.

## What it does NOT do (locked out for MVP)

- No satellite analysis
- No window counting
- No route optimization
- No lead CRM
- No login
- No backend database (pins live in `localStorage`)
- No deploy — runs on `localhost`

## Acceptance criteria

| # | Capability | Acceptance test |
|---|---|---|
| 1 | Map renders | Open `localhost:5173`, see Leaflet map centered on Oshawa (43.8971, -78.8658), zoom 13 |
| 2 | Scout button toggles draw mode | Click button → cursor turns to crosshair → can draw a rectangle |
| 3 | Rectangle resolves to DAs | After drawing, network tab shows `GET /api/geo/das-in-bbox?...` returning ≥1 DGUID |
| 4 | Census data fetched | Each DGUID hit returns the 4 raw signals |
| 5 | Score appears | Sidebar shows 0–100 score + the 4 raw values + per-signal normalized contributions |
| 6 | Auto-reset | After score renders, draw mode is off; clicking Scout Area again works |
| 7 | Pin persistence | "Drop pin" adds a marker; refresh page → marker still there with note |
| 8 | Graceful failure | Kill Express → draw rectangle → see error message in sidebar, no silent hang |

## Out of scope (next iterations)

- Polygon/freehand draw
- Compare two areas side-by-side
- CSV export of pins
- Score time-series (e.g. trends across census years)
- Mobile-first layout
