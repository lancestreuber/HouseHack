# Environmental and site constraints

**Type:** data
**One line:** Flood, landslide, steep-slope, undermining, contamination, wetland and soil layers that can be intersected with a parcel, with endpoints, counts and query gotchas.
**Why we care:** These layers drive the Ch. 906 overlay review steps (SS-O, LS-O, UM-O, FP-O) and the cost/time flags in a Development Ease Score. Several have traps (holes in polygons, geometry formats, coarse coverage) that silently return "no hit".
**Last checked:** 2026-09-26

City base `C = https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services`. City layers accept `geometry=lon,lat&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects` and polygon geometry.

## Summary table

| Constraint | Layer | Count | Test result | Gotcha | Tag |
|---|---|---|---|---|---|
| Flood (current) | FEMA NFHL `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` | | (-80.0120, 40.4420) → `FLD_ZONE AE, SFHA_TF T, DFIRM_ID 42003C`; downtown → `X / 0.2 PCT ANNUAL CHANCE`; POST with parcel polygon worked | Not a substitute for a flood determination (catalog) | `[read]` |
| Flood (city copy) | `C/PGHWebFEMA2014/FeatureServer/0` | | fields fld_zone, floodway, sfha_tf | **2014 data** | `[read]` |
| Flood (city, new) | `C/FEMA_2026` | | description says derived from PASDA 2026-08-31 | only the description was read | `[skimmed]` |
| Landslide-prone (city) | `C/PGHWebLandslideProne/FeatureServer/0` | 37 | (-80.030984, 40.435139) → `landslideprone: Yes` | | `[read]` |
| Landslide-prone (county) | `services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslide_Prone_Areas/FeatureServer/0` | 7,242 | flags REDBED, CREEP, MANFILL, ROCKFALL, DEBRIS, PREHIS | more detailed than city | `[read]` |
| Slope ≥25% | `C/PGHWebSlope25/FeatureServer/0` | 1,714 | envelope/polygon query → `slope25: Yes` | **Polygons have holes: a point inside one returned nothing. Intersect the parcel polygon, not the centroid.** | `[read]` |
| Slope ≥40% | none found | | | derive from DEM ([LiDAR slope](lidar-slope.md)) or soils | – |
| Undermined (city) | `C/PGHWebUndermined/FeatureServer/0` | 47 | Mt Washington (-80.0133, 40.4356) → `undermined: Yes` | | `[read]` |
| Parcels on mines (city) | `C/Parcels_On_Mines` | 25,821 | pre-joined city parcels | | `[read]` |
| Mined areas (PA DEP) | `https://gis.dep.pa.gov/depgisprd/rest/services/DigitizedMinedArea/MapServer/0` | 6,848 | same Mt Washington point → nothing | **DEP needs geometry as JSON with `spatialReference`; bare `lon,lat` + `inSR` → HTTP 400.** Coverage partial | `[read]` |
| Mine subsidence insurance (PA DEP) | `…/MineSubsidenceInsurance/MSI_SubsidenceRiskMiningConfirmed/FeatureServer/0` | | hit returned | one huge regional polygon; too coarse to score a parcel | `[read]` |
| Act 2 soil media | `https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External/MapServer/31` | 752 in county bbox | | | `[read]` |
| Act 2 groundwater | `…/emappa/eMapPA_External/MapServer/29` | 345 | | | `[read]` |
| AUL (activity and use limitation) | `…/AUL_NEW/AUL/MapServer/0` | 473 points | | deed restrictions | `[read]` |
| EPA facilities | `https://geopub.epa.gov/arcgis/rest/services/EMEF/efpoints/MapServer` (0 Superfund, 5 Brownfields/ACRES; also TRI, RCRA, air) | | 1.5 km downtown buffer → 4 brownfields, 0 Superfund | | `[read]` |
| Wetlands | `https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0` | | 500 m buffer → riverine R2UBH | | `[read]` |
| Soils | USDA SDA POST `https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest`, SQL with `SDA_Get_Mukey_from_intersection_with_WktWgs84('point(lon lat)')` | | → "Urban land-Culleoka complex, steep", slope_r 30/45, hydrologic group B | | `[read]` |
| Soils (county) | `vdNDkVykv9vEWFX4/…/Soils/FeatureServer/0` | | | name only | `[found]` |
| Tree canopy | `C/Tree_Coverage_Percent_by_Census_Block` | 7,453 blocks | `PercCover` | block level | `[read]` |

## PA DEP eMapPA extraction service `[read]`
`https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External_Extraction/MapServer/{id}`

| Layer ids | Content | Probe |
|---|---|---|
| 17–22 | Land Recycling (Act 2) media records; 20 = soil media | 500 m downtown buffer → 4 "LAND RECYCLING CLEANUP LOCATION" |
| 118 / 119 | Storage tanks active / inactive | 300 m buffer → 5 tanks |
| 47 | Digitized mined area | |
| 50 / 51 | Abandoned Mine Land sites | |
| 54 / 58 / 62 / 63 | Oil and gas wells incl. abandoned/orphaned, historical | |
| 91–94 | Floodplains | |
| 225 | Public water supply service areas | |
| 260 | Environmental justice tracts | |

Non-extraction `emappa/eMapPA_External` layer 26 "Land Recycling Cleanup Location" was not queried `[found]`. Organizer catalog caveat: eMapPA mixes programs and vintages; confirm authoritative program records.

## How these map to review steps
Steep slope ≥25% → SS-O Planning Commission review; landslide-prone → LS-O geotech; undermined → UM-O site investigation (single-unit allowed with >100 ft overburden and no subsidence history); FEMA A/AE → FP-O floodplain permit; floodway is effectively no-build. Details and citations: [environmental overlays Ch. 906](../policy/environmental-overlays-ch906.md) and [approval pathway](../policy/approval-pathway.md). ⚠ These are Ch. 906 overlays, not Ch. 915 (corrections log).

Contamination layers (Act 2, AUL, brownfields) add cost and time but brownfield status can also unlock grants ([r2 deeper sweep](../../sweeps/r2-deeper-data-sources.md)).

## Coverage outside the city
County landslide, FEMA NFHL, DEP and EPA layers are county- or state-wide, so environmental flags can be computed for suburban parcels even where zoning is unavailable ([municipal zoning](municipal-zoning-outside-city.md)).

## Open questions
- Is SS-O mapped as its own layer, or is `PGHWebSlope25` the operative map? (unverified)
- `FEMA_2026` fields and whether it matches live NFHL.
- Relationship between city `PGHWebUndermined` (47 polygons), `Parcels_On_Mines` (25,821 parcels) and DEP mined areas; DEP missed a point the city flagged.
- The "40% no-disturbance / 30% max disturbance of 25–40%" rule came from a search snippet and was not found in the §915.02 text read (unverified).
- ACHD air quality: not verified.

## Connects to
- [LiDAR slope](lidar-slope.md): continuous slope instead of the 25% polygon
- [Environmental overlays Ch. 906](../policy/environmental-overlays-ch906.md)
- [Approval pathway](../policy/approval-pathway.md)
- [Infrastructure](infrastructure.md): sewersheds and stormwater
- [Track 3 indicators and data](../track3/indicators-and-data.md): EJ tracts, tree canopy, flood
- [Parcels and assessments](parcels-and-assessments.md): the polygon to intersect

## Sources
- [FEMA NFHL MapServer/28](https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28) `[read]` *(accessed 2026-09-26)*
- [City PGHWebFEMA2014](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebFEMA2014/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- City `FEMA_2026` service description `[skimmed]` *(accessed 2026-09-26)*
- [City PGHWebLandslideProne](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebLandslideProne/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [County Landslide_Prone_Areas](https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Landslide_Prone_Areas/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [City PGHWebSlope25](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebSlope25/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: holes gotcha
- [City PGHWebUndermined](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/PGHWebUndermined/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- City `Parcels_On_Mines` `[read]` *(accessed 2026-09-26)*: count only
- [PA DEP DigitizedMinedArea](https://gis.dep.pa.gov/depgisprd/rest/services/DigitizedMinedArea/MapServer/0) `[read]` *(accessed 2026-09-26)*: JSON geometry required
- PA DEP `MineSubsidenceInsurance/MSI_SubsidenceRiskMiningConfirmed/FeatureServer/0` `[read]` *(accessed 2026-09-26)*: full host path not recorded
- [PA DEP eMapPA_External_Extraction](https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External_Extraction/MapServer) `[read]` *(accessed 2026-09-26)*: layer ids above
- [PA DEP eMapPA_External/31 and /29](https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External/MapServer) `[read]` *(accessed 2026-09-26)*: Act 2 soil/groundwater; layer 26 `[found]`
- PA DEP `AUL_NEW/AUL/MapServer/0` `[read]` *(accessed 2026-09-26)*
- [EPA EMEF efpoints](https://geopub.epa.gov/arcgis/rest/services/EMEF/efpoints/MapServer) `[read]` *(accessed 2026-09-26)*
- [USFWS wetlands](https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0) `[read]` *(accessed 2026-09-26)*
- [USDA Soil Data Access](https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest) `[read]` *(accessed 2026-09-26)*
- County `Soils/FeatureServer/0` `[found]` *(accessed 2026-09-26)*
- City `Tree_Coverage_Percent_by_Census_Block` `[read]` *(accessed 2026-09-26)*
- [PA DEP eMapPA page (organizer catalog URL)](https://www.dep.pa.gov/DataandTools/Pages/eMapPA.aspx) `[found]` *(accessed 2026-09-26)*
- [WPRDC 25-or-greater-slope](https://data.wprdc.org/dataset/25-or-greater-slope), [WPRDC undermined-areas](https://data.wprdc.org/dataset/undermined-areas) `[found]` *(accessed 2026-09-26)*: organizer catalog entries
- [Organizer Public Data Catalog (Google Sheet)](https://docs.google.com/spreadsheets/d/19CKyt1kansUZ3VGOAOBihYYxNFuitx5VTkzOiEy4iXA) `[read]` *(accessed 2026-09-26)*; saved copy [../../sources/organizers-2026-09-26-public-data-catalog.csv](../../sources/organizers-2026-09-26-public-data-catalog.csv): caveats
- Sweep: [../../sweeps/r1-parcel-environmental-infrastructure-data.md](../../sweeps/r1-parcel-environmental-infrastructure-data.md)
- Sweep: [../../sweeps/r1-zoning-data-code-and-reforms.md](../../sweeps/r1-zoning-data-code-and-reforms.md)
- Sweep: [../../sweeps/r2-deeper-data-sources.md](../../sweeps/r2-deeper-data-sources.md)
- Sweep: [../../sweeps/r2-approval-pathway-and-timelines.md](../../sweeps/r2-approval-pathway-and-timelines.md)
