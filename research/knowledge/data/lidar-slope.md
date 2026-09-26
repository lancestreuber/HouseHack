# LiDAR slope (USGS 3DEP)

**Type:** data
**One line:** Per-parcel slope-class areas computed on the fly from the USGS 3DEP 1 m elevation ImageServer, with the City's precomputed ETHOS `SteepSlope` fraction as a fallback.
**Why we care:** The city's ≥25% slope polygons are binary and have holes. A slope histogram gives the share of a parcel over 25% and over 40% and a buildable-area estimate, which maps directly onto SS-O review and grading cost.
**Last checked:** 2026-09-26

## Service `[read]`
- `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer`
- Pixel size 1.0 m; data current to 2026-08-24.
- `getSamples` at resolution 1 returned ~223 m elevation on the test parcel.

## Recipe: slope classes per parcel `[read]`
POST to `/computeStatisticsHistograms` with:
- the parcel polygon fetched with `outSR=26917` (UTM 17N) from county `OPENDATA/Parcels` ([parcels](parcels-and-assessments.md));
- `pixelSize={"x":1,"y":1,"spatialReference":{"wkid":26917}}`;
- `renderingRule={"rasterFunction":"Remap","rasterFunctionArguments":{"InputRanges":[0,15,15,25,25,40,40,10000],"OutputValues":[1,2,3,4],"Raster":{"rasterFunction":"Slope","rasterFunctionArguments":{"ZFactor":1,"SlopeType":2}}}}`.

Read counts from the first bin and the bins at the 1/3, 2/3 and last positions; each pixel is 1 m².

**Worked result, parcel `0006S00252000000`:**

| Class | m² | Share |
|---|---|---|
| <15% | 94 | 18% |
| 15–25% | 116 | 22% |
| 25–40% | 198 | 38% |
| >40% | 114 | 22% |
| Total | 522 | 60% over 25% |

Buildable area ≈ pixels under 25% (an inference from the sweep, not a code rule).

## Gotchas
- **Use UTM (26917), not Web Mercator (3857).** Mercator stretches distances ~1.31× at this latitude, so slope comes out too low.
- The preset "Slope Degrees" raster function returns **classified integers 1–10**, not degrees.
- About **1 in 4 calls failed** once in testing; add retries.
- A citywide run (~140k parcels) is **untested** and probably too slow; precompute for a subset or fall back to ETHOS.
- Python urllib hit SSL certificate errors on one dev Mac (local cert store problem); curl or an unverified SSL context worked.
- Organizer catalog caveat: 3DEP resolution and acquisition year vary by location.

## Fallbacks
| Source | What | Tag |
|---|---|---|
| `C/ETHOS_Lot_Suitability/FeatureServer/0` | 142,806 city parcels ("Dec 2024" ⚠ ETHOS date unverified; per the corrections log it is a stormwater/green-infrastructure suitability analysis *(corrected 2026-09-26 per docs/04-critique.md row 31)*) with `SteepSlope` fraction 0–1 | `[read]`; **threshold unverified**, probably share over 25% |
| `C/PGHWebSlope25/FeatureServer/0` | 1,714 polygons, ≥25% | `[read]`; intersect polygon, not centroid |
| USDA SDA soils | map-unit slope_r (e.g. 30/45) | `[read]`; map-unit scale, not parcel scale |
| PASDA | LiDAR listed in organizer catalog | `[found]` |

No public ≥40% slope layer was found.

## Precedent
The r3 reality-check sweep found no housing feasibility tool using LiDAR-derived slope in a score; it exists in survey and solar practice (search-snippet level). Absence of evidence is not proof ([r3 sweep](../../sweeps/r3-reality-check-existing-tools.md)). The organizer catalog does list USGS 3DEP as a Core source for Feasibility and Typology & Climate ([organizer catalog](organizer-data-catalog.md)).

## Open questions
- What threshold does ETHOS `SteepSlope` use?
- 3DEP acquisition year over Allegheny County (the service date is the service's, not the flight's).
- Throughput and failure rate at batch scale.
- How 3DEP slope compares to `PGHWebSlope25` on the same parcels (calibration not done).

## Connects to
- [Environmental constraints](environmental-constraints.md)
- [Environmental overlays Ch. 906](../policy/environmental-overlays-ch906.md): SS-O ≥25% trigger
- [Score design options](../methods/score-design-options.md)
- [Data pipeline](../build-plan/data-pipeline.md): precompute vs on-demand
- [Parcels and assessments](parcels-and-assessments.md)

## Sources
- [USGS 3DEP ImageServer](https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer) `[read]` *(accessed 2026-09-26)*: getSamples and computeStatisticsHistograms tested
- [ETHOS lot suitability](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/ETHOS_Lot_Suitability/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [City PGHWebSlope25](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebSlope25/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [USGS 3DEP program page (organizer catalog URL)](https://www.usgs.gov/3d-elevation-program) `[found]` *(accessed 2026-09-26)*
- [PASDA (organizer catalog URL)](https://www.pasda.psu.edu/) `[found]` *(accessed 2026-09-26)*
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- Notes: [../../archive/working-notes-2026-09-26/01-data-sources.md](../../archive/working-notes-2026-09-26/01-data-sources.md)
- [Adversarial critique](../../docs/04-critique.md) — row 31
