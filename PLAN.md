# PLAN: Groundwork PGH, 30-hour build

The *what and why* is in the [design spec](docs/superpowers/specs/2026-09-26-groundwork-pgh-design.md). This file covers **who, where and when**. If this file and older docs disagree, this file wins.

**Budget:** 30 wall-clock hours, from Sat 2pm to Sun 8pm ET, with a submit buffer until 11:59pm.
**Rule:** demoability over coverage. If a task slips more than 1h past its milestone, cut it and move on.
**Demo:** "Homewood CDC wants to know which vacant lots fit what housing." Every task below serves that story.

## 0. Decisions (settled Sat afternoon)
| Topic | Decision |
|---|---|
| Base code | `zoning-parcels`, **merged into `main`** (`fc23f54`). Every lane branches from `main`. |
| Data store | One **shared Neon Postgres + PostGIS** DB. **City parcels only** (~140k). Owner names stripped. |
| Stack | bun, Turborepo, TanStack Start, oRPC, Drizzle, shadcn (`packages/ui`), `maplibre-gl` 6, Vercel. New package `packages/scoring`. The only new dependency is the shadcn `resizable` component. |
| Modes | **Explore** (parcel → typologies) and **Find** ("I want to build X" → parcels). **Compare favorites** is a low-priority end goal. |
| Algorithm | Deterministic consideration scores + **Parcel Score = user-weighted mean, one weight per consideration**. Also legality and shortlists. Runs in the browser. |
| AI | **Jev only** (TypeSafe, via Cloudflare Workers AI `typesafe/jev`). It answers "how good is this parcel for purpose X": typology fit in Explore, ranking in Find, choice in Compare. **No Claude, no generated text.** It never decides legality. Rule-based fallback, labeled. |
| Typologies | `sfd`, `adu`, `duplex`, `townhome`, `apartments`, `senior`, each with a demand profile (senior = air, health, transit, flat ground, 65+ share) |
| UI | Resizable, collapsible panes: map (top left), considerations + notes (right), typology cards / shortlist (bottom). Super minimal dark, following the Grammarly content → comment → warning model. |
| Hospitals / fire | Consideration "Health & emergency" |
| Air quality | `emissions-inventory` tons within 2 km (scored). Monitor AQI is context only. |
| "Safety" card | Becomes **Hazards** (landslide/flood/undermined). Crime is never used. |
| ADU | Always "not allowed" today, with a note about Bill 2025-1545. No reform toggle. |
| Extras | City-owned lots layer (Must), print (Should) |
| Basemap | Carto dark. Yellow `#F2C230` only for selection. |
| Owners | Claimed in Discord (§1) |

## 1. Lanes (4; a 5th person takes Lane J)
| Lane | Owner | Owns (files) |
|---|---|---|
| **A: Data** | _Discord_ | `packages/db/src/schema/*`, `packages/db/src/scripts/*`, `packages/db/sql/*` |
| **B: Algorithm + API** (lead / integrator) | _Discord_ | `packages/scoring/src/{types,considerations,rules,profiles,score}.ts`, `packages/api/src/routers/*` |
| **J: Jev** (5th person, or B if only 4) | _Discord_ | `packages/scoring/src/jev/*`, `packages/api/src/routers/jev.ts`, `packages/api/src/routers/find.ts` |
| **C: Map + panes shell** | _Discord_ | `apps/web/src/components/map/*`, `apps/web/src/components/shell/*` (panes, mode switch, search) |
| **D: Panels + submission** | _Discord_ | `apps/web/src/components/{considerations,typologies,shortlist,weights}/*`, `apps/web/src/routes/*`, methodology, video |

Each lane opens PRs to `main` and merges with **merge commits**. Never commit `.env` or keys.

## 2. Contracts (M1: every lane builds against these)

### 2a. DB tables (Lane A; `packages/db/src/schema/`)
```ts
// existing: parcel(id, pin, properties jsonb, geom geometry(Geometry,4326))
layer_feature(id serial, layer text, props jsonb, geom geometry(Geometry,4326))   // gist(geom), btree(layer)
neighborhood(hood_id text pk, name text, geom geometry)                           // neighborhoods2
neighborhood_metrics(hood_id text pk, metrics jsonb)                              // NeighborhoodMetrics
parcel_features(pin text pk, hood_id text, features jsonb, centroid geometry(Point,4326))
jev_cache(key text pk, result jsonb, created_at timestamptz default now())       // Lane J
```
`layer` values: `zoning`, `slope25`, `landslide_prone`, `landslide_event`, `flood`, `undermined`, `parks`, `greenways`, `transit_stop`, `fire_station`, `hospital`, `school`, `shop`, `emitter`, `air_monitor`.

### 2b. Engine types (Lane B; `packages/scoring/src/types.ts`)
```ts
export type TypologyId = "sfd" | "adu" | "duplex" | "townhome" | "apartments" | "senior";
export type ConsiderationId = "lot" | "zoning" | "hazards" | "slope" | "air" | "transit"
  | "parks" | "health" | "schools" | "shops" | "demand";
export type Legal = "by_right" | "needs_approval" | "not_allowed" | "uncertain";
export type Severity = "ok" | "consider" | "warn";
export type Label = "evidence" | "assumption";

export interface ParcelFeatures {
  pin: string; hood_id: string; address: string | null; zoning: string;
  lot_sqft: number; is_vacant: boolean | null; city_owned: boolean;
  slope25_share: number; landslide_prone: boolean; landslide_events_500m: number;
  flood_zone: boolean; undermined: boolean;
  emissions_2km_tpy: number; aqi_nearest: number | null;
  m_to_transit: number; m_to_park: number; m_to_school: number;
  m_to_fire: number; m_to_hospital: number; shops_800m: number | null;
}
export interface NeighborhoodMetrics {
  hood_id: string; name: string;
  pct_65_plus: number; pct_under_18: number; avg_hh_size: number; pct_single_person_hh: number;
  vacancy_rate: number; median_income: number; median_rent: number; permits_3yr_per_1k_units: number;
}
export interface Consideration {
  id: ConsiderationId; name: string; score: number | null;   // 0–100; null = no data
  severity: Severity; value: string;                         // "180 m", "40% ≥25% slope"
  comment: string;                                           // one templated line
  source: string; source_url: string; as_of: string; kind: Label;
}
export interface Note { severity: Severity; text: string; typology?: TypologyId }
export type Weights = Record<ConsiderationId, number>;       // 0–3, default 1
export interface TypologyEval {
  typology: TypologyId; legal: Legal; legal_reason: string;
  demands: ConsiderationId[];                                // from profiles.ts
  failing_demands: ConsiderationId[];                        // demands with severity ≠ ok (deterministic)
  fit: number | null;                                        // 0–100, null if not_allowed
  confidence: number | null;                                 // Jev; null for fallback
  source: "jev" | "rules";
  major_concern_p?: number;                                  // Jev noul
}
export interface ParcelReport {
  features: ParcelFeatures; hood: NeighborhoodMetrics;
  considerations: Consideration[]; notes: Note[]; context: { label: string; value: string; source_url: string }[];
}
// pure functions (browser + server)
export function considerationsFor(p: ParcelFeatures, h: NeighborhoodMetrics): Consideration[];
export function parcelScore(c: Consideration[], w: Weights): number;
export function legality(zoning: string, t: TypologyId): { legal: Legal; reason: string };
export function ruleFit(c: Consideration[], t: TypologyId): number;  // fallback
export function notesFor(r: ParcelReport, t?: TypologyId): Note[];
```

### 2c. API (oRPC in `packages/api/src/routers/`)
| Procedure | Lane | Input | Output |
|---|---|---|---|
| `parcels.getByBounds` (exists) | B | bbox, `{ cityOwnedOnly? }` | GeoJSON + `score_default`, `city_owned` props |
| `parcels.report` | B | `{ pin }` | `ParcelReport` + geometry |
| `parcels.atPoint` | B | `{ lng, lat }` | `{ pin } \| null` |
| `hoods.all` | B | – | `NeighborhoodMetrics[]` (+ static `public/data/neighborhoods.geojson`) |
| `jev.evaluate` | J | `{ pin }` | `TypologyEval[]` (6, cached; rules fallback) |
| `find.parcels` | J | `{ typology, purpose?: string, scope: { hood_id? , pins? }, weights }` | `{ pin, address, fit, confidence, source, failing_demands }[]` (≤10), shortlisted from the top 40 |
| `jev.compare` *(low)* | J | `{ pins (≤6), typology, purpose? }` | `{ pin, p_best, fit, confidence }[]` |

**Mocks:** `packages/scoring/fixtures/{report-homewood,report-beechview,report-lawrenceville,evals-homewood,find-senior-homewood}.json` + `hoods.json`. Lanes C and D build against these until M2.

## 3. Tasks

Legend: **M1** = Sat 5pm · **M2** = Sat 10pm (Explore end-to-end, real data, deployed) · **M3** = Sun 2pm freeze (Jev + Find in) · **M4** = Sun 9pm submit.

### Everyone (M1)
- [ ] bun installed, `apps/web/.env` created (the shared `DATABASE_URL`; `CF_ACCOUNT_ID`/`CF_AI_TOKEN` for Lane J only), `bun install`, `bun run dev` → http://localhost:3001 shows the map.
- [ ] Read the spec + your lane section below.

### Lane A: Data
Get dataset URLs from `https://data.wprdc.org/api/3/action/package_show?id=<slug>`. Datastore tables can also be read with `datastore_search?resource_id=<id>`. **Record `metadata_modified` as `as_of`**.
- [ ] **A0 (M1)** Trim parcels to the city (centroid inside the union of `neighborhoods2`). Strip owner-name fields. Neon free tier = 0.5 GB.
- [ ] **A1 (M1)** Drizzle schema for the tables in §2a + `db:push`.
- [ ] **A2 (M1)** `import-layers.ts`: config array `{ layer, slug | resource_id }` → `layer_feature` (reproject from 2272 when needed). Sources:
  - `zoning`, `25-or-greater-slope`, `landslide-prone-areas`, `landslides`, `2014-fema-flood-zones`, `undermined-areas`
  - `parks1`, `greenways`, `prt-of-allegheny-county-transit-stops`, `pgh-fire-stations`
  - `hospitals` (CSV), `pittsburgh-public-school-locations` (CSV)
  - `neighborhoods2` → `neighborhood`
- [ ] **A3 (M2)** `sql/build-parcel-features.sql`, one `INSERT … SELECT`:
  - `ST_PointOnSurface` for the centroid
  - `ST_Area(geom::geography)*10.7639` for lot square feet
  - zoning via the polygon containing the centroid
  - slope share via `ST_Intersection` area
  - hazards via `ST_Intersects`
  - nearest distances via KNN `<->` + `ST_Distance(::geography)`
  - `hood_id` via the containing neighborhood

  Run as `bun run data:features`, under 5 minutes.
- [ ] **A4 (M2)** `city-owned-properties` joined on PIN → `city_owned`. Vacancy from assessments `USEDESC` (vacant land) or the `ParcelsPublic` `Vacant` flag, whichever joins cleanly in under 1h.
- [ ] **A5 (M2)** `import-neighborhood-metrics.ts`:
  - `profiles_data_20132023.csv` (age, household type/size, vacancy, income, rent)
  - plus `pli-permits` new-residential counts from the last 3 years per neighborhood
  - export `public/data/neighborhoods.geojson`
- [ ] **A6 (M2)** Emitters: `emissions-inventory` (`1ab77bb5-5684-430e-bdda-fb401167fb6a`). Filter `criteria = 1`, take the latest `year` per facility, and sum tons → `emitter` layer. Then `emissions_2km_tpy = Σ tons / max(d_km, 0.25)`.
- [ ] **A7 (M3)** Context and Should items:
  - AQI context: `allegheny-county-air-quality` Sensor Locations (`b646336a-…`, skip null lat/lon) + Daily AQI (`4ab1e23f-…`, PM2.5, last 12 months) → `aqi_nearest`.
  - Shops: `allegheny-county-assets` → `shops_800m`.
- [ ] **A8 (M3)** `bun run data:refresh` runs everything in order. Document it in the README "Keeping it current" section.

### Lane B: Algorithm + API (lead)
- [ ] **B0 (M1)** Set up the shared Neon DB, send out the connection string, and turn off Vercel preview protection. Add `CF_ACCOUNT_ID` and `CF_AI_TOKEN` to `apps/web/.env.schema`.
- [ ] **B1 (M1)** Create `packages/scoring`. Commit `types.ts` + fixtures (§2b), then tell lanes C, D and J.
- [ ] **B2 (M2)** `considerations.ts`: one entry per `ConsiderationId` holding its normalizer, thresholds, severity cutoffs (≥70 ok, 40–69 consider, <40 or any hazard = warn), comment template, source and kind. Examples:
  - Transit: ≤400 m = 100, ≥1600 m = 0
  - Hazards: landslide-prone = 30, undermined = 40, flood = 20; take the min; none = 100
- [ ] **B3 (M2)** `rules.ts` (`ZONING_RULES` from `docs/research/zoning-rules.md`; `senior` = the more permissive of duplex and apartments; `adu` always `not_allowed` with the Bill 2025-1545 note) and `profiles.ts` (per typology: `demands`, demand weights, lot minimum — `adu` 3,000, `townhome` 3,200, `apartments` 5,000 sq ft).
- [ ] **B4 (M2)** `score.ts`: `considerationsFor`, `parcelScore`, `ruleFit`, `notesFor`. Write the golden tests from the spec (`bun test`).
- [ ] **B5 (M2)** Routers: `parcels.report`, `parcels.atPoint`, `hoods.all`. Extend `getByBounds` with `score_default`.
- [ ] **B6 (M2)** Deploy to Vercel. Smoke test on the preview URL.
- [ ] **B7 (M3)** Tune thresholds on the 3 demo parcels, check zoning by hand, and hand the final table to Lane D for the methodology page.

### Lane J: Jev
- [ ] **J0 (M1)** Get the Workers AI token (Cloudflare dashboard → AI → REST API token) and confirm `typesafe/jev` answers with a curl smoke test. If the team's TypeSafe early-access key is easier, use that transport instead; the questions stay the same.
- [ ] **J1 (M2)** `packages/scoring/src/jev/client.ts`: `runJev(state, questions)` over `fetch` → `POST https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/typesafe/jev`, 8 s timeout, typed result. Server-only.
- [ ] **J2 (M2)** `jev/rubrics.ts`: per-typology `score` question (5 levels poor→excellent, instructions naming its demands in plain language) + `noul` `major_concern`. Add `RUBRIC_VERSION`. `jev/state.ts`: `ParcelReport` → compact facts JSON (no PII, under 2k tokens).
- [ ] **J3 (M2)** `jev.evaluate` router:
  - Skip `not_allowed` typologies.
  - Ask one call with ≤5 score + ≤5 noul questions.
  - Map levels 0–4 → 0/25/50/75/100 and attach the confidence.
  - Compute `failing_demands` deterministically.
  - Use `jev_cache`, and fall back to `ruleFit` with `source: "rules"`.
- [ ] **J4 (M3)** `find.parcels`:
  1. SQL shortlist: legal for the typology (zoning codes from `ZONING_RULES`), `lot_sqft ≥ min`, in scope, top 40 by the profile-weighted score.
  2. Fan out Jev with one `score` question that includes the free-text `purpose`, 10 concurrent.
  3. Sort by `fit`, then `confidence`, and return the top 10.
  4. Cache each result.
- [ ] **J5 (M3)** Precompute the cache for the demo parcels and the "senior housing in Homewood" Find query, so the demo never waits.
- [ ] **J6 (M4-, low)** `jev.compare`: a `choice` over ≤6 favorites (option descriptions are fact summaries) + a `score` per option.

### Lane C: Map + panes shell
- [ ] **C1 (M1)** `shell/Explorer.tsx`: shadcn `resizable` panes (map | right; bottom row). Each pane collapses (keyboard `[` `]` `\`). Sizes saved in `localStorage`. Move `parcel-map.tsx` into `map/` and fill its pane.
- [ ] **C2 (M1)** Visual tokens in `packages/ui` styles:
  - `--bg #0B0B0C`, `--pane #111113`, `--line #222`, `--text #E7E7E9`, `--muted #8A8A90`
  - `--ok #4C9F70`, `--consider #C9A227`, `--warn #D0564B`, `--select #F2C230`
  - 13px DM Sans, `tabular-nums`, no shadows
- [ ] **C3 (M2)** Top bar: `Explore | Find` segmented switch, ⌘K search (Census geocoder + neighborhood names → `flyTo` → `parcels.atPoint`), and a weights button.
- [ ] **C4 (M2)** Layers:
  - Neighborhood Demand choropleth at zoom <14.
  - Parcels at zoom ≥14 colored by **Parcel Score**, recomputed client-side from the current weights (monochrome ramp; color reserved for severity).
  - Selected parcel = yellow outline. `?pin=` in the URL.
- [ ] **C5 (M2)** **City-owned lots** toggle (`cityOwnedOnly` from zoom 13).
- [ ] **C6 (M3)** Find-mode map: highlight shortlist parcels with rank numbers. Hovering a row in the shortlist pane highlights the parcel, and vice versa.
- [ ] **C7 (M3, Should)** Hazard / transit / emitter layer toggles.

### Lane D: Panels + submission
- [ ] **D1 (M1)** Scaffold cleanup: delete the `login` and `todos` routes and their header links, the "My App" title and the ASCII art. Add shadcn `resizable`, `slider`, `popover`, `badge`, `tooltip`, `collapsible`, `toggle-group`.
- [ ] **D2 (M2)** **Considerations pane** (right, from fixtures):
  - header: `SCORE 64`, address, neighborhood, zoning, lot, city-owned badge
  - a list of consideration rows: severity dot, name, value, one-line comment. Click to expand the source, as-of and Evidence/Assumption label.
  - Warnings sort first. Context rows (income, rent, AQI) sit in a muted section.
- [ ] **D3 (M2)** **Notes** section under considerations: collapsible, holding `notesFor()` output (hazards, "verify with Zoning Administrator", Jev "uncertain" when confidence < 0.5).
- [ ] **D4 (M2)** **Typology cards** (bottom pane): big fit number, legal badge, demand chips, and `Fair · 71%` (or "rule-based") from `jev.evaluate`. Selecting a card highlights its demands in the considerations pane (dimming the others) and filters the notes to that typology.
- [ ] **D5 (M2)** **Weights popover**: one slider per consideration (0–3), reset, `?w=` in the URL. The Parcel Score updates live.
- [ ] **D6 (M3)** **Find mode**:
  - bottom pane becomes "I want to build [typology ▾] for [purpose text, optional] in [Homewood ▾ / city / favorites]" → Run
  - the ranked shortlist rows: rank, address, fit, confidence, failing demands, ☆
  - clicking a row opens that parcel in Explore
- [ ] **D7 (M3)** Favorites: ☆ on the report and on shortlist rows, stored as `?fav=` + `localStorage`. *(Low)* "Compare for [typology]" → `jev.compare` → a probability bar per parcel.
- [ ] **D8 (M3)** `/methodology`:
  - considerations table (thresholds, source, as-of, kind)
  - Parcel Score formula
  - legality rules + the Zoning Administrator note
  - "Algorithm vs. Jev" (what each decides, confidence, fallback)
  - "What this tool can't tell you"
- [ ] **D9 (M3, Should)** Print CSS: considerations + typology cards + notes as one page with sources and the date.
- [ ] **D10 (M4)** Video, recording and submission:
  - Script: 3–5 min, following the spec's Homewood story. Open with the hackathon name + team. Explain Explore → Find, then algorithm vs. Jev.
  - Record the video.
  - Submit the Google Form.
  - Make the repo public after a key scrub.

## 4. Timeline (ET)
| When | What |
|---|---|
| Sat 2–5pm | **M1.** Neon shared, contracts + fixtures committed, pane shell renders, Jev smoke test passes, layers importing. |
| Sat 5–10pm | Build Explore against fixtures (C, D) and real data (A, B). Jev evaluate against fixtures (J). |
| **Sat 10pm** | **M2:** on the Vercel preview, search Homewood, toggle city-owned, click a lot → considerations, notes, Parcel Score, 6 typology cards (rule-based at minimum); weights recolor. |
| Sat 10pm–1am | Jev evaluate wired in, Find shortlist SQL, methodology draft. |
| Sat 1am–8am | Sleep (at least 6h each; stagger if needed). |
| Sun 8am–2pm | Find mode end-to-end, demo cache precomputed, threshold tuning, design pass, favorites. Compare only if everything else is green. |
| **Sun 2pm** | **M3 freeze.** Only bug fixes and copy after this point. |
| Sun 2–5pm | Bug bash (phone + fresh browser), methodology final, print, README "keeping it current". |
| Sun 5–8pm | Record and edit the video. |
| **Sun 9pm** | **M4 submit.** |

## 5. Cut order if behind (cut from the top first)
1. J6/D7 Jev Compare (keep the ☆ list only)
2. A7 shops + AQI context, C7 layer toggles
3. D9 print
4. J4/D6 purpose free text (Find stays typology-only)
5. Jev in Find (the shortlist ranks by the algorithm and is labeled "rule-based")
6. Jev in Explore (the cards show `ruleFit`, labeled "rule-based")

**Never cut:** panes, Homewood search → city-owned layer → parcel click → considerations + notes + Parcel Score + typology cards with legality, weights, methodology page, video.

## 6. Risks
| Risk | Mitigation |
|---|---|
| Jev access or latency | Smoke test at M1. 8 s timeout, cache in Postgres, precompute the demo, labeled rule fallback everywhere. |
| Jev returns odd fits | Rubrics name each typology's demands explicitly. Show the confidence. `failing_demands` is deterministic, so explanations never come from AI. Check the demo parcels by eye at M3. |
| Neon free-tier storage (0.5 GB) | City-only parcels, `ST_SimplifyPreserveTopology` (0.00001), drop unneeded properties. |
| Feature SQL is slow | GiST indexes. KNN `<->`. Run offline once. |
| WPRDC CRS/format differs | Check `crs`. `ST_Transform` from 2272 when needed. |
| Zoning rules wrong | "Verify with Zoning Administrator" note. Check 3 demo parcels by hand. |
| Pane layout eats time | Use the shadcn `resizable` defaults. Collapse = set the size to 0. No custom drag code. |
| Merge collisions | Lanes own folders (§1). Only B touches `routers/index.ts`, only D touches `__root.tsx`, and J adds its routers via B. |
