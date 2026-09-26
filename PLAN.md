# PLAN: Groundwork PGH, 30-hour build

The *what and why* is in the [design spec](docs/superpowers/specs/2026-09-26-groundwork-pgh-design.md). This file covers **who, where and when**. If this file and older docs disagree, this file wins.

**Budget:** 30 wall-clock hours, from Sat 2pm to Sun 8pm ET, with a submit buffer until 11:59pm.
**Rule:** demoability over coverage. If a task slips more than 1h past its milestone, cut it and move on.
**Demo:** "Homewood CDC wants to know which vacant lots fit what housing." Every task below serves that story.

## 0. Decisions (settled Sat afternoon)
| Topic | Decision |
|---|---|
| Base code | The `zoning-parcels` branch (commit `8ab6c34`), merged into `main` now without review. Every lane branches from `main`. |
| Data store | One **shared Neon Postgres + PostGIS** DB. **City parcels only** (~140k). Owner names stripped. |
| Stack | bun, Turborepo, TanStack Start, oRPC, Drizzle, shadcn (`packages/ui`), `maplibre-gl` 6, Vercel. One new package, `packages/scoring`. **No new runtime dependencies.** |
| AI | **None.** No LLM and no trained model. A transparent rule-based engine suggests, and people decide. |
| Typologies | `sfd`, `adu`, `duplex`, `townhome`, `apartments`, `senior` |
| Scores | Demand (neighborhood), Site (parcel), Access (parcel). Three user sliders. Scoring runs in the browser. |
| Hospitals / fire | Scored under Access |
| Air quality | Scored from the `emissions-inventory` facility tons within 2 km. The nearest monitor's AQI is context only. |
| ADU | Always "not allowed" today, with a note about pending Bill 2025-1545. **No reform toggle.** |
| Extras in scope | City-owned lots layer, compare 2–3 parcels, print-friendly report |
| Basemap | Carto dark (from the branch). Yellow `#F2C230` only for selection and focus. |
| Crime, tornado, water/sewer, school quality | Not used. Listed under "what this tool can't tell you". |
| Owners | Claimed in Discord (§1) |

What the branch already gives us:
- Neon + PostGIS `parcel` table and a streaming countywide import (`packages/db/src/scripts/import-parcels.ts`)
- an oRPC `parcels.getByBounds` endpoint that returns GeoJSON at zoom ≥ 14
- a `maplibre-gl` map (`apps/web/src/components/parcel-map.tsx`) with a zoning layer from `public/data/pittsburgh-zoning.geojson` (1,068 polygons with `zon_new`, `full_zoning_type`, `non_housing`)
- Vite fixes for the MapLibre worker

## 1. Lanes (4; a 5th person takes the A5/A6 neighborhood and air work)
| Lane | Owner | Owns (files) |
|---|---|---|
| **A: Data** | _Discord_ | `packages/db/src/schema/*`, `packages/db/src/scripts/*`, `packages/db/sql/*` |
| **B: Engine + API** (lead / integrator) | _Discord_ | `packages/scoring/*`, `packages/api/src/routers/*` |
| **C: Map** | _Discord_ | `apps/web/src/components/map/*` (move `parcel-map.tsx` here), search |
| **D: Experience + submission** | _Discord_ | `apps/web/src/components/{report,compare}/*`, `apps/web/src/routes/*`, methodology, video |

Each lane opens PRs to `main` and merges with **merge commits**. Never commit `.env` or keys.

## 2. Contracts (M1: every lane builds against these)

### 2a. DB tables (Lane A; `packages/db/src/schema/`)
```ts
// existing: parcel(id, pin, properties jsonb, geom geometry(Geometry,4326))
layer_feature(id serial, layer text, props jsonb, geom geometry(Geometry,4326))  // gist(geom), btree(layer)
neighborhood(hood_id text pk, name text, geom geometry)                          // from WPRDC neighborhoods2
neighborhood_metrics(hood_id text pk, metrics jsonb)                             // NeighborhoodMetrics
parcel_features(pin text pk, hood_id text, features jsonb, centroid geometry(Point,4326))  // ParcelFeatures
```
`layer` values: `zoning`, `slope25`, `landslide_prone`, `landslide_event`, `flood`, `undermined`, `parks`, `greenways`, `transit_stop`, `fire_station`, `hospital`, `school`, `shop`, `emitter`, `air_monitor`.

### 2b. Engine types (Lane B; `packages/scoring/src/types.ts`)
```ts
export type TypologyId = "sfd" | "adu" | "duplex" | "townhome" | "apartments" | "senior";
export type Legal = "by_right" | "needs_approval" | "not_allowed" | "uncertain";
export type Label = "evidence" | "assumption";

export interface ParcelFeatures {
  pin: string; hood_id: string; address: string | null; zoning: string;  // zon_new
  lot_sqft: number; is_vacant: boolean | null; city_owned: boolean;
  slope25_share: number;                                 // 0–1 of parcel area
  landslide_prone: boolean; landslide_events_500m: number;
  flood_zone: boolean; undermined: boolean;
  emissions_2km_tpy: number;                             // inverse-distance-weighted criteria-pollutant tons/yr, latest year
  aqi_nearest: number | null;                            // context only: nearest active monitor, median PM2.5 AQI, 12 mo
  m_to_transit: number; m_to_park: number; m_to_school: number;
  m_to_fire: number; m_to_hospital: number; shops_800m: number | null;
}
export interface NeighborhoodMetrics {
  hood_id: string; name: string;
  pct_65_plus: number; pct_under_18: number; avg_hh_size: number; pct_single_person_hh: number;
  vacancy_rate: number; median_income: number; median_rent: number;
  permits_3yr_per_1k_units: number;
}
export interface Fact { id: string; label: string; value: string | number; source: string; source_url: string; as_of: string; kind: Label }
export interface Weights { demand: number; site: number; access: number }   // sum to 1
export interface TypologyResult {
  typology: TypologyId; fit: number;                    // 0–100
  legal: Legal; legal_reason: string;
  sub: { demand: number; site: number; access: number };
  reasons: { fact_id: string; text: string; direction: "+" | "-" }[];  // top 3, plain-language
  red_flags: string[]; coverage: { have: number; total: number };
}
export function scoreParcel(p: ParcelFeatures, h: NeighborhoodMetrics, w: Weights): TypologyResult[];
export function scoreNeighborhood(h: NeighborhoodMetrics, w: Weights): { demand: number; best: TypologyId };
export function factsFor(p: ParcelFeatures, h: NeighborhoodMetrics): Fact[];
```

### 2c. API (Lane B; oRPC in `packages/api/src/routers/`)
| Procedure | Input | Output |
|---|---|---|
| `parcels.getByBounds` (exists) | bbox, `{ cityOwnedOnly?: boolean }` | GeoJSON. **Add** `best`, `best_fit`, `city_owned` properties (default weights), computed server-side with `scoring`. |
| `parcels.get` | `{ pin }` | `{ features: ParcelFeatures, hood: NeighborhoodMetrics, facts: Fact[], geometry }` |
| `parcels.getMany` | `{ pins: string[] }` (≤3) | the same shape as an array, used by compare |
| `parcels.atPoint` | `{ lng, lat }` | `{ pin } \| null`, used by search |
| `hoods.all` | – | `NeighborhoodMetrics[]` + a static `public/data/neighborhoods.geojson` |

**Mocks:** `packages/scoring/fixtures/{parcel-homewood,parcel-beechview,parcel-lawrenceville}.json` + `hoods.json`. Lanes C and D use these until M2.

## 3. Tasks

Legend: **M1** = Sat 5pm · **M2** = Sat 10pm (end-to-end, real data, deployed) · **M3** = Sun 2pm freeze · **M4** = Sun 9pm submit.

### Everyone (M1)
- [ ] bun installed, `apps/web/.env` created (DATABASE_URL = the shared Neon DB; get it from the lead), `bun install`, `bun run dev` → http://localhost:3001 shows the map.
- [ ] Read the spec + your lane section below.

### Lane A: Data
Get dataset download URLs from `https://data.wprdc.org/api/3/action/package_show?id=<slug>`. Datastore tables can also be read with `datastore_search?resource_id=<id>`. **Record `metadata_modified` as `as_of`** for each layer.
- [ ] **A0 (M1)** Re-run or trim the parcel import. **Keep only parcels whose centroid falls inside the city** (city boundary = union of `neighborhoods2`), because the Neon free tier is 0.5 GB. Strip owner-name fields.
- [ ] **A1 (M1)** Drizzle schema for the 4 new tables (§2a) + `db:push`.
- [ ] **A2 (M1)** `import-layers.ts`: one config array `{ layer, slug | resource_id }` → download → insert into `layer_feature`, reprojecting from EPSG:2272 when needed. Sources:
  - `zoning` (the static file already on disk), `25-or-greater-slope`, `landslide-prone-areas`, `landslides`, `2014-fema-flood-zones`, `undermined-areas`
  - `parks1`, `greenways`, `prt-of-allegheny-county-transit-stops`, `pgh-fire-stations`
  - `hospitals` (CSV lat/lon), `pittsburgh-public-school-locations` (CSV)
  - `neighborhoods2` (→ `neighborhood` table)
- [ ] **A3 (M2)** `sql/build-parcel-features.sql`, one `INSERT … SELECT` using:
  - `ST_PointOnSurface` for the centroid
  - `ST_Area(geom::geography)*10.7639` for lot square feet
  - zoning via the zoning polygon containing the centroid
  - slope share = `ST_Area(ST_Intersection)/ST_Area`
  - hazard booleans via `ST_Intersects`
  - nearest distances via KNN `ORDER BY geom <-> centroid LIMIT 1`, then `ST_Distance(::geography)`
  - `hood_id` via the containing neighborhood

  Script `bun run data:features`. Target: under 5 minutes.
- [ ] **A4 (M2)** `city-owned-properties` CSV joined on PIN → `city_owned`. Vacancy: use assessments `CLASSDESC`/`USEDESC` = vacant land, or the city `ParcelsPublic` `Vacant` flag, whichever joins cleanly in under 1h.
- [ ] **A5 (M2)** `import-neighborhood-metrics.ts` produces `neighborhood_metrics`:
  - Read `profiles_data_20132023.csv` (ACS 2019–23; the dictionary XLSX maps the `Age_1..5` / `hhtype_*` bands) for age, household size and type, vacancy, income and rent.
  - Count `pli-permits` new-residential rows from the last 3 years per neighborhood (lat/lon point-in-polygon).
  - Export `apps/web/public/data/neighborhoods.geojson` (simplified, with metrics as properties).
- [ ] **A6 (M2)** Air quality:
  - `emissions-inventory` (resource `1ab77bb5-5684-430e-bdda-fb401167fb6a`): filter `criteria = 1`, take the latest `year` per facility, and sum `tons_per_yr` per facility into the `emitter` layer.
  - Feature `emissions_2km_tpy = Σ tons / max(d_km, 0.25)` over emitters within 2 km.
- [ ] **A7 (M3)** Context and Should items:
  - Air monitors: `allegheny-county-air-quality` "Sensor Locations" (`b646336a-…`, skip null lat/lon) + "Daily AQI Data" (`4ab1e23f-…`, `parameter` like `PM25%`, last 12 months) → `aqi_nearest`.
  - `allegheny-county-assets` grocery/retail → `shops_800m`.
- [ ] **A8 (M3)** `bun run data:refresh` runs A2→A7 in order. Document it in the README "Keeping it current" section.

### Lane B: Engine + API (lead)
- [ ] **B0 (M1)** Merge `zoning-parcels` → `main` (merge commit). Create the shared Neon DB and send out the connection string. Turn off Vercel preview protection.
- [ ] **B1 (M1)** Create `packages/scoring` following the stack-setup.md "new package" pattern. Commit `types.ts` + fixtures (§2b), then tell lanes C and D.
- [ ] **B2 (M2)** `rules.ts`:
  - `ZONING_RULES[zon_new][typology] → Legal`, built from `docs/research/zoning-rules.md`
  - `senior` = the more permissive of `duplex` and `apartments`
  - `adu` = always `not_allowed`, with the reason "ADUs aren't permitted in any district today. Pending Bill 2025-1545 would allow them by right."
- [ ] **B3 (M2)** `factors.ts` and `profiles.ts`:
  - `factors.ts` normalizes each factor: distance thresholds (e.g. transit ≤400 m = 1, ≥1600 m = 0), hazards as 0/1 penalties, emissions and neighborhood metrics as percentiles.
  - `profiles.ts` holds per-typology factor weights and lot minimums: `adu` ≥ 3,000 sq ft with an existing structure, `apartments` ≥ 5,000 sq ft, `townhome` ≥ 3,200 sq ft.
  - `senior` weights hospital, transit, flat slope and `pct_65_plus` higher.
  - `sfd` and `townhome` weight schools and `pct_under_18` higher.
- [ ] **B4 (M2)** `score.ts`: `scoreParcel`, `scoreNeighborhood`, `factsFor`. Also plain-language reason templates ("412 m to a bus stop", "In a landslide-prone area"), red flags and coverage. Write the 4 golden tests from the spec (`bun test`).
- [ ] **B5 (M2)** Routers: `parcels.get`, `parcels.getMany`, `parcels.atPoint`, `hoods.all`. Extend `getByBounds`.
- [ ] **B6 (M2)** Deploy to Vercel. Smoke test on the preview URL.
- [ ] **B7 (M3)** Tune the weights on the 3 demo parcels, then check them by hand against the city zoning map. Give Lane D the final weight table for the methodology page.

### Lane C: Map
- [ ] **C1 (M1)** Move `parcel-map.tsx` to `components/map/`. Make it full-screen (drop the fixed 420px height). Keep the worker fixes and the dark basemap.
- [ ] **C2 (M2)** Neighborhood choropleth at zoom <14 from `neighborhoods.geojson`, colored by `scoreNeighborhood().demand`, recomputed client-side when weights change.
- [ ] **C3 (M2)** Parcels at zoom ≥14 filled by the `best` typology (6-color categorical palette + legend). Click → select `pin` (yellow outline) → report opens. Put `?pin=` in the URL.
- [ ] **C4 (M2)** Search box: Census geocoder (free, no key) for addresses, plus a local neighborhood-name match → `flyTo` → `parcels.atPoint` selects the parcel.
- [ ] **C5 (M2)** **City-owned lots** toggle: outline or highlight `city_owned` parcels. When the toggle is on, `getByBounds` gets `cityOwnedOnly` at zoom 13–14, so they show earlier.
- [ ] **C6 (M3)** Layer toggles: hazards (slope/landslide/flood/undermined, hatched), transit stops, emitters.
- [ ] **C7 (M3)** Recolor parcels live when weights change: score the visible features client-side.

### Lane D: Experience + submission
- [ ] **D1 (M1)** Scaffold cleanup: delete the `login` and `todos` routes and their header links, the "My App" title and the ASCII art. Add shadcn `slider`, `badge`, `tabs`, `sheet`, `table`.
- [ ] **D2 (M2)** Report panel (right side, a sheet on mobile) from fixtures:
  - header: address, neighborhood, zoning, lot size, city-owned badge, context rows for income, rent and AQI
  - 6 **typology cards** ranked: fit bar, legal badge, 3 reasons with source chips (hover → source + as-of + Evidence/Assumption), red flags, coverage badge
- [ ] **D3 (M2)** Weights panel (left): 3 sliders (Demand/Site/Access) that auto-normalize. State lives in the URL (`?w=d,s,a`).
- [ ] **D4 (M3)** **Compare:**
  - A "Pin" button on the report, up to 3 parcels (`?pins=a,b,c`).
  - A compare tray at the bottom opens `/compare`: a table with rows for typologies and key factors, columns for parcels, using `parcels.getMany`.
- [ ] **D5 (M3)** **Print:** `@media print` CSS turns the report into a one-page brief: map snapshot optional, cards, sources and the date. Add a "Print brief" button.
- [ ] **D6 (M3)** `/methodology` route:
  - typologies and the factor table (source, as-of, Evidence/Assumption)
  - weights and legality rules, with the "simplified interpretation, verify with Zoning Administrator" note
  - "No AI: how suggestions are made"
  - "What this tool can't tell you" (from the spec)
- [ ] **D7 (M3)** Landing state: a first-load overlay card with a one-line pitch and a "Start with Homewood" button, plus 2 other demo parcels.
- [ ] **D8 (M4)** Video, recording and submission:
  - Script: 3–5 min, following the spec's Homewood story. Open with the hackathon name + team, and say plainly what's cut.
  - Record the video.
  - Submit the Google Form.
  - Make the repo public after a key scrub.

## 4. Timeline (ET)
| When | What |
|---|---|
| Sat 2–5pm | **M1.** Branch merged, Neon shared, contracts + fixtures committed, everyone running locally. Lane A has city parcels + layers importing. |
| Sat 5–10pm | Build v1 against fixtures (C, D) and real data (A, B). |
| **Sat 10pm** | **M2 checkpoint:** on the Vercel preview, search Homewood, toggle city-owned, click a lot → 6 ranked cards with sources; sliders rerank. |
| Sat 10pm–1am | Compare, choropleth recolor, layer toggles, methodology draft. |
| Sat 1am–8am | Sleep (at least 6h each; stagger if needed). |
| Sun 8am–2pm | Print, AQI and shops context, weight tuning, design pass, demo parcels verified by hand. |
| **Sun 2pm** | **M3 freeze.** Only bug fixes and copy after this point. |
| Sun 2–5pm | Bug bash on a phone plus a fresh browser; methodology final; README "keeping it current". |
| Sun 5–8pm | Record and edit the video. |
| **Sun 9pm** | **M4 submit.** Form, public repo, keys scrubbed. |

## 5. Cut order if behind (cut from the top first)
1. A7 shops, C7 live parcel recolor (the choropleth still recolors)
2. A7 AQI context row
3. C6 layer toggles
4. D5 print
5. D4 compare (becomes a "pin" list only)

**Never cut:** Homewood search → city-owned layer → parcel click → ranked cards with sources, sliders, methodology page, video.

## 6. Risks
| Risk | Mitigation |
|---|---|
| Neon free-tier storage (0.5 GB) | City-only parcels, `ST_SimplifyPreserveTopology` (0.00001), drop unneeded properties. |
| Feature SQL is slow | GiST indexes on every geom. KNN `<->` for nearest. Run it once offline, never per request. |
| WPRDC layer CRS/format differs | Check `crs` in each GeoJSON. Reproject with `ST_Transform` from 2272 when needed (same as the parcel import). |
| Zoning rules wrong | Show the "simplified interpretation, verify with Zoning Administrator" note. Check 3 demo parcels by hand. |
| Judges expect AI at an "AI for Housing" event | Say it up front in the video and on the methodology page: a transparent engine was a deliberate integrity choice. Every suggestion is explainable and sourced. |
| Vercel cold start + DB latency | `getByBounds` LIMIT 5000 already exists. Add `Cache-Control` on `hoods.all` / static geojson. |
| Merge collisions | Lanes own folders (§1). Only Lane B touches `routers/index.ts`. Only Lane D touches `__root.tsx`. |
