# Sweep: Build options on the scaffolded stack, pipeline, timeline, workstreams

**Round 4** · 2026-09-26 · single research subagent, web search and fetch plus live endpoint probes

> Archived at full fidelity, exactly as the agent reported it. Its tags are its own: some sweeps use [V]/[S]/[U] and some use [F]/[S]. The paper maps these onto `[read]` / `[skimmed]` / `[found]` / `[inaccessible]`. Local scratch paths have been replaced with `<scratch>`. Treat claims here as leads, and check the paper and the corrections log before citing.

---

Research is done. I changed nothing in the repo. Throwaway checks ran only in a scratchpad venv.

**Bottom line:** do the geo work offline in Python and DuckDB. Serve parcel shapes as PMTiles static files and per-parcel facts as JSON. Use Neon only for overrides, the audit trail and an LLM cache. Remove the login wall. Get the map plus one parcel working end to end by hour 4.

## What's in the scaffold (verified)
- TanStack Start and Router, oRPC (`publicProcedure` / `protectedProcedure` in `packages/api/src/index.ts`), Drizzle `1.0.0-rc.4` on `drizzle-orm/neon-http`, Better-Auth 1.7.5, nitro, Vite 8, bun. There is a Vercel `services` config (`vercel.json`).
- `apps/web/.env.schema` makes `DATABASE_URL` and `BETTER_AUTH_SECRET` required. The app won't boot without a Neon database, even if auth is unused.
- `/_auth/*` routes redirect to `/login`. `routes/todos.tsx` is demo cruft.
- No `node_modules` in the worktree, so I did not verify that `bun install` or a build passes.
- `.mcp.json` already includes the Neon, context7 and shadcn MCP servers.

## 1. Map stack fit

**Rendering**
- Use `react-map-gl/maplibre` (v8.1.3) with `maplibre-gl` (v6.11.2) and `pmtiles` (4.5.0).
- The react-map-gl docs warn that MapLibre v6 needs its worker configured under a bundler. Spike this first. Falling back to `maplibre-gl@5` is a safe escape hatch.
- Put the map in a route with `ssr: 'data-only'` or `ssr: false`. That is TanStack Start's per-route SSR switch (verified): https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr
- Skip deck.gl (9.4.0). MapLibre fill and line layers with data-driven color handle about 140k parcels as vector tiles. deck.gl adds weight for no demo gain.
- MapLibre is roughly 800KB–1MB minified (my estimate, not measured). It's fine if it only loads on the map route.

**PMTiles hosting**
- Protocol setup: `maplibregl.addProtocol("pmtiles", new Protocol().tile)`, called once: https://docs.protomaps.com/pmtiles/maplibre
- The Vercel CDN returned `206 Partial Content` to Range requests on two Vercel-hosted sites (verified by curl). That is what PMTiles needs.
- Unverified: how big a single file in `public/` can be on a Vercel deploy. Test by deploying a real `.pmtiles` by hour 2. Fallbacks are Vercel Blob or GitHub Pages.

**PostGIS on Neon: yes.** `CREATE EXTENSION IF NOT EXISTS postgis;` (https://neon.com/docs/extensions/postgis).

**Drizzle geometry: partial.** Built-in `geometry('geo', {type:'point', mode:'xy', srid})` and `index().using('gist', …)` exist, but only Point is predefined (https://orm.drizzle.team/docs/extensions/pg). Polygons would need a custom type plus raw `sql` with `ST_AsGeoJSON` and `ST_Intersects`. Doable, but it costs about 2–4 hours of integration, and drizzle-kit is still a release candidate.

**Comparison**

| Option | Time to working demo | Risk |
|---|---|---|
| Static-first (DuckDB/Python → PMTiles + JSON) | Low. Map shows real parcels once the pipeline runs (about 3–6h). | Low. No database on the hot path; judges' traffic hits the CDN. |
| PostGIS on Neon with live spatial queries | Medium (6–10h). Loading 140k polygons plus Drizzle custom types. | Medium. Cold starts, query tuning, Neon free-tier storage (unverified). |
| Hybrid: static geometry plus Neon attribute/override tables | Low to medium | Low. **Recommended.** |

## 2. Data pipeline

**Tools**
- Python 3.13 works. In a venv, `pip install duckdb geopandas pyogrio rasterio rasterstats` installed from wheels and ran fine: duckdb 1.5.5 with `INSTALL spatial; LOAD spatial;`, geopandas 1.1.4, rasterio 1.5.1 (verified). Use `python3 -m venv .venv`; `uv` isn't needed.
- `brew install tippecanoe duckdb gdal`: tippecanoe 2.79.0, duckdb 1.5.5 and gdal 3.13.3 have bottles, so no compile (verified via `brew info`). tippecanoe writes `.pmtiles` directly: `tippecanoe -o parcels.pmtiles -zg --drop-densest-as-needed -l parcels parcels.geojson`.

**Spatial joins** (parcel to zoning, overlays, floodway, FEMA zones)
- DuckDB spatial, or geopandas `sjoin` on representative points plus area-weighted overlay for the flood layers.
- Estimate: 1–5 minutes each for about 140k parcels against a few thousand zoning polygons (estimate, not run).
- The real time sink is paging ArcGIS FeatureServers. With about 2,000 records per page, 140k features is about 70 requests, around 5–15 minutes per layer.
- Filter the 115MB county parcel zip to city municipality codes first.
- Node/turf would be 5–20× slower. Don't use it for this.

**Slope from 3DEP**
- The ImageServer supports exportImage, getSamples and computeStatisticsHistograms, with max image 8000×8000. Its "Slope Degrees" function is a color rendering, not numeric, so compute slope yourself.
- I timed exportImage:
  - A 1500×1500, 3m GeoTIFF of downtown returned in 2.5s and read correctly (elevation 216–383m).
  - A 4000×4000 request failed with HTTP 500 after 54s.
- Plan: tile the city at about 1500² px, 3m. That's roughly 20–40 tiles, about 2–5 minutes total. Then `gdalbuildvrt`, `gdaldem slope`, and `rasterstats.zonal_stats(parcels, slope.tif, stats=['mean','max','percentile_90'])`. Estimate 10–30 minutes for 140k parcels.
- Calling the server once per parcel would take about 140k × 1–2s ≈ 40–80 hours serial, or 5–10 hours with 8 parallel workers, with throttling risk. Don't.
- Fallback if the DEM step slips: use the city steep-slope overlay or ETHOS SteepSlope field. I did not verify that field.

**Output**
- `parcels.pmtiles`: geometry plus a few style properties (score, gate flags).
- Per-parcel detail as JSON sharded by the first digits of the parcel ID, or loaded into a Neon attributes table (no geometry) with `COPY`.
- Precomputed per-block-group Track 3 metrics as one JSON file (about 1–2MB).

## 3. LLM integration
- Use `@anthropic-ai/sdk` (0.128.0) in an oRPC `publicProcedure` on the server only. Stream the response.
- The LLM only explains. All scores, gates and weights are deterministic TypeScript from the precomputed data. The LLM receives the numbers and must not change them.
- Grounding: chunk the Pittsburgh zoning code into JSON sections `{id, title, url, text}`. Pick 3–8 relevant sections deterministically from the parcel's district and triggered gates, not by embeddings. Pass them as `document` blocks with `citations: {enabled: true}` (skill reference, not tested). Responses then carry `cited_text` and a document index you can map to section URLs. Note that citations can't be combined with structured-output `output_config.format`.
- Cost (list prices, estimated at about 8k input and 800 output tokens per call):
  - `claude-opus-5` ($5/$25 per million tokens): about $0.06/call
  - `claude-sonnet-5` ($2/$10): about $0.024/call
  - `claude-haiku-4-5` ($1/$5): about $0.012/call
  - 500 demo calls cost about $6–30. Cache by (parcel, typology) in Neon or KV so the judge demo replays instantly.
  - Model choice is the team's call.
- Guardrail: if the API key or network fails, show the deterministic "reasons" list without prose.

## 4. Auth
- Not needed for the demo. A login wall is a real risk: judges bounce, and a mis-set `BETTER_AUTH_URL` breaks the preview URL.
- Keep Better-Auth installed but put nothing behind `/_auth`. Make all procedures `publicProcedure`.
- Human-in-the-loop overrides: an append-only Neon table `override_events(id, parcel_id, field, old, new, reason, author_name text, created_at)` with `db:push`. That gives a shared, visible audit trail, which is demo-worthy.
- localStorage is per-browser, so judges wouldn't see the team's edits. Use it only as an offline fallback.
- Rate-limit or cap the LLM endpoint instead of authenticating it.

## 5. Architecture options
- **A (recommended), static-first hybrid:** Python/DuckDB pipeline → PMTiles plus JSON in `public/`. The TS scoring engine runs client-side so weight sliders update instantly. oRPC handles only `explain` (LLM) and `overrides`. Neon holds overrides and the LLM cache.
- **B, PostGIS-backed:** same UI, but parcels live in Neon PostGIS and oRPC does live spatial lookups. More "real", but 6–10 hours of extra risk. Only worth it if someone is already fluent in PostGIS.
- **C, fully static:** no Neon, overrides in localStorage, LLM through one server function. Fastest, weakest audit story. This is the fallback if Neon or env setup eats time.

**Workstreams for 5 people, starting Saturday about 10am as hour 0:**
1. **Data A:** parcels, zoning, overlays, floodway/FEMA joins, then PMTiles.
2. **Data B:** 3DEP slope, ACS/HUD, transit, displacement per tract, then the Track 3 metrics JSON.
3. **Scoring and rules:** zoning dimensional tables (lot size, setbacks, height by district), approval pathway, typology fit, weight model. Pure TypeScript with unit tests on 5 hand-checked parcels.
4. **Frontend:** map, parcel panel, typology cards, weight sliders, override UI.
5. **LLM/integration/DevOps:** zoning-code corpus, `explain` procedure, Neon plus the overrides table, Vercel deploy, README, video.

**Timeline**
- **H0–4, spike:**
  - Deploy the scaffold to Vercel with the auth wall removed.
  - Map renders a hand-made 50-parcel PMTiles from `public/` on the deployed URL (proves range requests and file size).
  - One parcel end to end: click → JSON → score → LLM explanation with one citation.
- **Checkpoint H4:** stop and fix anything red.
- **H4–12:** full city pipeline, rules engine v1, UI v1.
- **Checkpoint H12 (Saturday about 10pm):** all 140k parcels on the map with Track 1 scores.
- **Overnight:** Data B and the Track 3 layers.
- **H12–20:** Track 3 matchmaker, sliders, overrides, citations polish.
- **Checkpoint H20 (Sunday about 6am):** feature freeze on scope.
- **H20–24:** bug fixes, README (data sources, AI disclosure, limitations), scripted demo parcels.
- **H24–26:** record the video (reserve 2 hours plus retakes).
- **H26–28:** buffer, final deploy, repo made public. Submit by about 9–10pm Sunday, not 11:59pm.

**Critical path:** parcels plus zoning join → PMTiles → map → rules engine → demo. The LLM and Track 3 are off it.

**Cut lines**
- H8: if 3DEP slope isn't in, use the steep-slope overlay or flag it as a limitation.
- H12: if full-city PMTiles aren't done, restrict to 2–3 neighborhoods.
- H16: if Track 3 is behind, ship 3 typologies (ADU, duplex, small apartment) and 3 weights (feasibility, transit, displacement). Drop carbon, or make it a static per-typology factor stated in limitations.
- H18: if Neon is flaky, move overrides to localStorage (Option C).
- H20: if LLM citations are shaky, show deterministic cited code sections without prose.

**Riskiest pieces and how to de-risk them**
1. MapLibre v6 worker under Vite/SSR → spike by H2, with v5 as fallback.
2. PMTiles file size on Vercel → deploy a real file by H2.
3. Zoning dimensional rules: this is manual transcription and the biggest accuracy risk. Limit to the top 6–8 residential districts. Mark unmodeled cases "needs review" rather than guessing.
4. FeatureServer paging and outages → cache raw pulls to disk once and commit or share the parquet files.
5. Env/Varlock/Vercel sync (`bun run env:preview`) → do it in the first hour.

Scratch files (venv, test DEM) are in `<scratch>`.
