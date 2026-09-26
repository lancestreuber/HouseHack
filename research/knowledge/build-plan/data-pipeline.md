# Data pipeline

**Type:** build
**One line:** The offline steps that turn public parcel, zoning, overlay and elevation data into map tiles and per-parcel JSON, with the tools that were install-tested and the runtime estimates.
**Why we care:** The pipeline is on the critical path: nothing appears on the map until parcels are joined to zoning and tiled. The slow parts are network paging and elevation, not the joins.
**Last checked:** 2026-09-26

## Tooling (install-tested)

From the [build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md), which ran these in a throwaway venv:

- **Python 3.13** venv: `python3 -m venv .venv`, then `pip install duckdb geopandas pyogrio rasterio rasterstats`. All installed from wheels and ran: duckdb 1.5.5 with `INSTALL spatial; LOAD spatial;`, geopandas 1.1.4, rasterio 1.5.1. `uv` is not needed.
- **Homebrew:** `brew install tippecanoe duckdb gdal`. tippecanoe 2.79.0, duckdb 1.5.5 and gdal 3.13.3 have bottles, so no compile (checked with `brew info`).
- **Not recommended:** Node/turf for the joins; the sweep estimates it 5–20× slower (estimate).
- **Local SSL note:** Python `urllib` hit certificate errors on one Mac; that is a local certificate-store issue. Use curl or a configured SSL context ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).

## Stages

### 1. Pull raw layers, cache them once
- **FeatureServer paging** is the real time sink. At about 2,000 records per page, 140k features is about 70 requests, around **5–15 minutes per layer (estimate)**. The county buildings MapServer returns 1,000 per request ([deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).
- Cache raw pulls to disk once and share them as parquet, so an outage doesn't stop the team.
- Filter the 115MB county parcel zip to city municipality codes first.
- WPRDC: the `datastore_search_sql` endpoint returns **403**; use `datastore_search` with filters or the bulk `/datastore/dump/<id>` CSV.
- Check each city layer's `editingInfo`: many were last edited in 2023.

### 2. Spatial joins
- Parcel → zoning district, overlays, floodway, FEMA zones.
- Options: DuckDB spatial, or geopandas `sjoin` on representative points, plus area-weighted overlay for flood layers (so a sliver of floodplain doesn't flag the whole lot).
- **Estimate:** 1–5 minutes each for ~140k parcels against a few thousand zoning polygons (the sweep's estimate, not run).

### 3. Slope from USGS 3DEP

The 3DEP ImageServer supports `exportImage`, `getSamples` and `computeStatisticsHistograms`, with a max image of 8000×8000. Its "Slope Degrees" function is a classified color rendering (integers 1–10), not numeric slope, so compute slope yourself ([build sweep](../../sweeps/r4-build-feasibility-on-team-stack.md); [deeper data sweep](../../sweeps/r2-deeper-data-sources.md)).

**Timing tests (measured by the build sweep):**

| Request | Result |
|---|---|
| `exportImage` 1500×1500 px, 3 m, downtown | Returned in **2.5 s**; GeoTIFF read correctly (elevation 216–383 m) |
| `exportImage` 4000×4000 px | **HTTP 500 after 54 s** |

**Approach options:**

| Option | How | Runtime |
|---|---|---|
| **Tile then compute locally** (build sweep's plan) | Tile the city at ~1500² px, 3 m (roughly 20–40 tiles); `gdalbuildvrt`; `gdaldem slope`; `rasterstats.zonal_stats(parcels, slope.tif, stats=['mean','max','percentile_90'])` | Estimate: tiles ~2–5 min; zonal stats 10–30 min for 140k parcels |
| **Server-side histogram per parcel** (deeper data sweep, verified on one parcel) | POST `computeStatisticsHistograms` with the parcel polygon in UTM 17N (`outSR=26917`), 1 m pixel size, and a `Remap` over a `Slope` raster function into bins 0–15 / 15–25 / 25–40 / 40+ % | Exact per parcel, but ~140k × 1–2 s ≈ 40–80 h serial, or 5–10 h with 8 workers, with throttling risk (estimate). Good for spot checks, not the whole city |
| **Precomputed fallback** | ETHOS Lot Suitability layer: 142,806 city parcels ("2024" ⚠ ETHOS date unverified; per the corrections log it is a stormwater/green-infrastructure suitability analysis *(corrected 2026-09-26 per docs/04-critique.md row 31)*) with a `SteepSlope` fraction | Fast; the threshold behind `SteepSlope` is unverified (probably share over 25%) |

**Gotchas:**
- Use UTM (EPSG 26917), not Web Mercator: 3857 stretches distances by about 1.31× at this latitude, so slope comes out too low.
- About 1 in 4 histogram calls failed once; add retries.
- The one verified parcel (0006S00252000000): of 522 m², 94 under 15%, 116 at 15–25%, 198 at 25–40%, 114 over 40%.
- Note: the build sweep's tiling plan uses 3 m pixels; the service reports 1 m pixels. Whether 3 m is fine enough for small lots is untested.

More on slope as data: [LiDAR slope](../data/lidar-slope.md).

### 4. Score and tile
- `tippecanoe` writes `.pmtiles` directly. Two command variants from the sweeps:
  - Build sweep: `tippecanoe -o parcels.pmtiles -zg --drop-densest-as-needed -l parcels parcels.geojson`
  - UX sweep: `tippecanoe -o parcels.pmtiles -zg --extend-zooms-if-still-dropping --coalesce-densest-as-needed --no-tile-size-limit -l parcels -y parcel_id -y score -y conf …`
  - Tradeoff: dropping features keeps tiles small but can hide parcels at mid zoom; coalescing with no size limit keeps them but grows tiles. Test on the real file.
- Keep tile attributes minimal (ID, score, confidence, integer subscores, gate flags). At z<13, show neighborhood or hex aggregates rather than 140k polygons ([UX sweep](../../sweeps/r2-ux-and-map-stack.md)).

### 5. Outputs
- `parcels.pmtiles`: geometry plus a few style properties.
- Per-parcel detail as JSON sharded by the first digits of the parcel ID, or loaded into a Neon attribute table with `COPY`.
- Per-block-group Track 3 metrics as one JSON file, about 1–2MB (estimate).

## Open questions
- Real end-to-end runtime; every figure above except the two `exportImage` tests and the one-parcel histogram is an estimate.
- Whether 3 m slope tiles are accurate enough compared with the 1 m native resolution.
- The `SteepSlope` threshold in the ETHOS layer.
- Final `.pmtiles` size for ~140k parcels, and whether it fits a static Vercel deploy.
- Which tippecanoe flag set gives acceptable mid-zoom coverage.

## Connects to
- [Architecture options](architecture-options.md): where the outputs are served
- [Timeline and workstreams](timeline-and-workstreams.md): Data A and Data B workstreams, H8 and H12 cut lines
- [LiDAR slope](../data/lidar-slope.md): the 3DEP source in detail
- [Parcels and assessments](../data/parcels-and-assessments.md), [zoning GIS](../data/zoning-gis.md), [environmental constraints](../data/environmental-constraints.md): the inputs
- [Score design options](../methods/score-design-options.md): what is computed from the joined data

## Sources
- [USGS 3DEP Elevation ImageServer](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer) `[read]` *(accessed 2026-09-26)*: queried by two sweeps; timing tests and per-parcel histogram
- [City AGOL ETHOS_Lot_Suitability FeatureServer](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/ETHOS_Lot_Suitability/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: 142,806 parcels with `SteepSlope`; queried by the deeper data sweep
- [felt/tippecanoe](https://github.com/felt/tippecanoe) `[skimmed]` *(accessed 2026-09-26)*: listed as a source by the UX sweep; brew version checked by the build sweep
- [Protomaps PMTiles with MapLibre](https://docs.protomaps.com/pmtiles/maplibre) `[skimmed]` *(accessed 2026-09-26)*: protocol registration
- Sweep: [../../sweeps/r4-build-feasibility-on-team-stack.md](../../sweeps/r4-build-feasibility-on-team-stack.md) `[read]` *(accessed 2026-09-26)*: tooling install tests, timing tests, estimates
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md) `[read]` *(accessed 2026-09-26)*: per-parcel histogram method, UTM gotcha, paging limits, WPRDC 403
- Sweep: [../../sweeps/r2-ux-and-map-stack.md](../../sweeps/r2-ux-and-map-stack.md) `[read]` *(accessed 2026-09-26)*: tippecanoe flags, minimal attributes, low-zoom aggregates
