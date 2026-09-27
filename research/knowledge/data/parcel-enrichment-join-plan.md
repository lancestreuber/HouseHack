# Parcel GeoJSON enrichment: join plan for parcel size, zoning, air quality and weather

**Type:** data
**One line:** How to attach parcel size, zoning, air-quality and weather-hazard data to the parcel GeoJSON (City `ParcelsPublic`, keyed by `pin`). Covers each dataset's join method, key, fields to add, vintage and access, all probed live on 2026-09-26.
**Why we care:** The map already draws parcels and zones. This node is the recipe for matching the other datasets onto those features.
**Last checked:** 2026-09-26

## The base layer we are joining onto

City of Pittsburgh ArcGIS: `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/ParcelsPublic/FeatureServer/0` `[read]`

| Property | Value |
|---|---|
| Parcel count | 142,635 (per the team spec) |
| Last edit | Sep 2026 |
| Spatial reference | **EPSG:2272** (PA South, US feet), so `Shape__Area` is in **square feet** |
| Max records per request | 2,000 |

| Field | Meaning |
|---|---|
| `pin` | **Join key.** 16 chars, e.g. `0124F00169000000`. Same as WPRDC `PARID` and County `PIN`. |
| `calcacreag` | Acres, rounded to 0.01, which is too coarse for small lots |
| `Shape__Area` / `Shape__Length` | Polygon area in sq ft / perimeter in ft |
| `zon_new` | Base zoning district, e.g. `R1D-H` |
| `hood` / `DIST_NAME` | Neighborhood / council district |
| `classdesc` / `usedesc` / `Vacant` / `OwnerCateg` | Land use, vacancy, owner category |
| `propertyow` | ⚠ Owner name, but **private owners already show as "Private"**. Public owners are named. Don't add named owners from other sources. |

**Two ways to join onto it:**
- **Attribute join on `pin`:** for other parcel-keyed tables.
- **Spatial join:** for area layers. Test the parcel centroid (or a point on the surface) against the polygons, or compute area overlap for hazard layers where partial coverage matters.

---

## 1. Parcel size

| Source | Join | Fields to add (suggested property names) | Notes | Status |
|---|---|---|---|---|
| `ParcelsPublic` itself | Already on the feature | `lot_sf = Shape__Area` | GIS polygon area, in sq ft | `[read]` |
| WPRDC Property Assessments, resource `65855e14-549e-4992-b5be-d629afc676fa` | `pin` = `PARID` | `lot_sf_assessor = LOTAREA` | Assessor lot area in sq ft. Sample: 906 vs GIS 852; 2,000 vs GIS ~1,791. **They differ by roughly 5–10%.** Also available: `YEARBLT`, `FINISHEDLIVINGAREA`. Bulk CSV is 435 MB, so filter to the city or use `datastore_search` with `filters`. The SQL endpoint with WHERE returns 403. | `[read]` |
| City `Parcels_Exp_02052025_Residential_Lot_Dimensions` | `pin` | `lot_width_ft = Parcel_Width`, `lot_depth_ft = Parcel_Len`, `bldg_width_ft`, `bldg_len_ft`, `zone_long` | Residential parcels only, ~105k (Feb 2025). Width is what decides whether a rowhouse, duplex or cottage fits. | `[read]` |
| Derived | Computed | `lot_vs_min = lot_sf / district_min_sf` | District minimums (§903.03): VL 6,000 / L 3,000 / M 2,400 / H 1,200 / VH none. Below 1.0 → §921.04 undersized-lot rules apply. → [dimensional standards](../policy/dimensional-standards-and-use-table.md) | derived |

💡 **Recommendation:** show `lot_sf` (GIS) as the primary value and keep `lot_sf_assessor` for comparison. Label both as observed, with their source.

## 2. Zoning

| Source | Join | Fields to add | Notes | Status |
|---|---|---|---|---|
| `ParcelsPublic.zon_new` | Already on the feature | `zoning = zon_new` | Base district | `[read]` |
| Derived from `zon_new` | Parse the string | `use_subdistrict` (R1D/R1A/R2/R3/RM/…), `density` (VL/L/M/H/VH) | e.g. `R1D-H` → R1D + H | derived |
| Use table §911.02 (hand-encoded) | Lookup on the district | `allows_2unit`, `allows_3unit`, `allows_multi` (P/A/S/C/blank) | 2-unit needs R2+; 3-unit needs R3+; multi-unit is by right only in RM. Column order verified on eCode360. → [use table source](../../sources/ecode360-2026-09-26-pittsburgh-911-02-use-table-residential.md) | `[read]` |
| `PGHWebZoningOverlays/0` and the single-purpose overlay layers | Spatial (centroid) | `overlays[]`: inclusionary (IZ-O), riverfront, parking reduction, height reduction, historic district | The combined layer's `overlay` field is free text and needs a regex. The single-purpose layers are cleaner. → [zoning GIS](zoning-gis.md) | `[read]` |
| Environmental overlays (Ch. 906) | Spatial (**area overlap**) | `steep_slope_25`, `landslide_prone`, `undermined`, `flood_zone` | Layers: `PGHWebSlope25` (polygons have holes, **use parcel polygons, not centroids**), `PGHWebLandslideProne`, `PGHWebUndermined`, FEMA NFHL. → [environmental constraints](environmental-constraints.md) | `[read]` |

## 3. Air quality

| Source | Geography | Join | Fields to add | Vintage | Access | Status |
|---|---|---|---|---|---|---|
| **EPA EJScreen v2.32, via the PEDP mirror** — `https://services2.arcgis.com/w4yiQqB14ZaAGzJq/arcgis/rest/services/EJScreenStatePercentilesBlockGroup/FeatureServer/0` | **Block group** (`ID` = 12-digit GEOID) | Spatial (centroid), or via a parcel→block group GEOID crosswalk (WPRDC parcel centroids resource `3fab7152-3f11-4788-8372-4c33f86ea813` has GEOIDs) | `pm25` (µg/m³), `ozone` (ppb), `diesel_pm` (`DSLPM`), `no2`, `traffic_prox` (`PTRAF`), `toxics_rsei` (`RSEI_AIR`), plus **PA state percentiles** `P_PM25`, `P_OZONE`, `P_DSLPM`, `P_NO2`, `P_PTRAF`, `P_RSEI_AIR` | EJScreen v2.32. Underlying data years vary by indicator; confirm in the EJScreen technical docs. | Keyless ArcGIS REST. ⚠ EPA took the official EJScreen offline; this is a public mirror (PEDP), so cite it as such. | `[read]`: queried a Lawrenceville point → BG 420030603002, PM2.5 9.0 (90th pct PA), NO2 98th pct |
| **ACHD emissions inventory** (WPRDC `emissions-inventory`, resource `1ab77bb5-5684-430e-bdda-fb401167fb6a`) | **Facility points** (`lat`, `lon`) | Nearest / within-radius from the parcel centroid | `nearest_emitter_ft`, `emitters_within_1mi`, `tons_within_1mi` (filter `current=1`; split `criteria` / `hap` / `ghg`) | Multi-year, 16,768 rows (facility × pollutant × year); data modified 2024 | Keyless CKAN | `[read]` |
| **ACHD monitor readings** (WPRDC `allegheny-county-air-quality`: hourly and daily AQI; sensor locations resource `b646336a-…`) | ~20 **monitor points**, several inactive (`enabled=f`) | Nearest active monitor | `nearest_monitor`, `monitor_dist_mi`; optionally annual mean PM2.5 at that monitor | Current (updated daily); **unverified** data per ACHD | Keyless | `[read]`. ⚠ Too sparse to vary across parcels meaningfully. Good for a "nearest monitor" note and trend chart, not a parcel score. |
| WPRDC `particulate-matter-2-5` | Tract (2010 IDs, `CensusTract`) | Tract crosswalk | `pm25_2011` | **2011 model data**, stale | Keyless | `[read]`. Superseded by EJScreen. |
| WPRDC `air-quality-forecast` (NASA GEOS-CF) and `temperature-inversions` | Grid / points | — | Forecasts | Daily | Keyless | `[read]`. Live forecasts, not site characteristics. Skip for scoring; maybe a "today" widget. |

💡 **Recommendation:** EJScreen block-group fields are the parcel-varying air-quality layer. Add the emissions-inventory distance as a parcel-precise complement. Show state percentiles, which are easier to read than raw µg/m³. All of this is **observed evidence**. Choosing which pollutant matters most is a **value judgment**.

## 4. Weather concerns (climate hazards)

| Source | Geography | Join | Fields to add | Vintage | Status |
|---|---|---|---|---|---|
| **FEMA National Risk Index**: `https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0` | **Census tract** (`TRACTFIPS`, 2020) | Spatial (centroid), or the crosswalk GEOID | Risk ratings (`*_RISKR`) and scores (`*_RISKS`): `heat_wave` (HWAV), `cold_wave` (CWAV), `winter_weather` (WNTW), `inland_flood` (IFLD), `strong_wind` (SWND), `tornado` (TRND), `hail` (HAIL), `lightning` (LTNG), `ice_storm` (ISTM), `drought` (DRGT), `landslide` (LNDS) | **December 2025** (`NRI_VER`) | `[read]`: Lawrenceville tract 42003060300 → inland flood "Relatively High", cold wave "Relatively Moderate", heat wave "Very Low". ⚠ NRI risk includes the dollar value of exposed buildings, so dense or valuable tracts score higher. ⚠ The community-resilience field looks county-level. |
| **FEMA NFHL flood zones**: `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` | Polygons | Spatial (**area overlap**) | `flood_zone` (`FLD_ZONE`), `in_sfha` (`SFHA_TF`), `pct_in_sfha` | Current effective | `[read]` |
| **City tree canopy by census block**: `…/Tree_Coverage_Percent_by_Census_Block/FeatureServer/0` | 7,453 blocks | Spatial (centroid) | `canopy_pct = PercCover` (heat and stormwater proxy) | Last edited Aug 2023 | `[read]` |
| City landslide / slope / undermined layers | Polygons | Spatial (overlap) | See §2 | Various | `[read]` |
| NLCD 2021 impervious surface and tree canopy (MRLC, 30 m) | Raster | Sample at the centroid, offline | `impervious_pct`, `nlcd_canopy_pct` | 2021 | `[found]`: listed in the organizer catalog and the team spec; not probed here |
| Landsat summer land-surface temperature (USGS / Planetary Computer) | Raster | Sample at the centroid, offline | `lst_summer_c` (urban heat) | Varies | `[found]`: named in the team spec; not probed here |
| NOAA Climate Data Online / normals | Station | — | City-wide context only | — | `[found]`. Not parcel-varying; use for narrative, not scoring. |

💡 **Recommendation:** use NRI tract ratings as the "weather concerns" panel. Use NFHL and the City hazard overlays as parcel-precise flags. Use canopy percentage (and optionally LST) as the heat proxy. Always label NRI as **tract-level**.

---

## Suggested enriched GeoJSON `properties` (one parcel)

```json
{
  "pin": "0124F00169000000",
  "hood": "Larimer",
  "zoning": "R1D-H", "use_subdistrict": "R1D", "density": "H",
  "allows_2unit": null, "allows_3unit": null, "allows_multi": null,
  "overlays": [],
  "lot_sf": 852, "lot_sf_assessor": 906, "lot_width_ft": 14.0, "lot_depth_ft": 61.0, "lot_vs_min": 0.71,
  "steep_slope_25": false, "landslide_prone": false, "undermined": false, "flood_zone": "X",
  "bg_geoid": "42003…", "tract_geoid": "42003…",
  "air": { "pm25": 9.0, "pm25_pctile_pa": 90, "no2_pctile_pa": 98, "diesel_pm_pctile_pa": 80, "traffic_pctile_pa": 83, "nearest_emitter_ft": 1800, "source": "EJScreen v2.32 (PEDP mirror); ACHD emissions inventory" },
  "weather": { "heat_wave": "Very Low", "cold_wave": "Relatively Moderate", "winter_weather": "Relatively Low", "inland_flood": "Relatively High", "strong_wind": "Relatively Low", "canopy_pct": 23.4, "source": "FEMA NRI Dec 2025 (tract); City canopy by block (2023)" },
  "as_of": "2026-09-26"
}
```

The values above are illustrative except those marked as queried. Keep area-level values **nested and labeled with their geography**, so the UI never implies they were measured at the parcel.

## Pipeline notes
- **Area-level values are few; parcels are many.** Pull each area layer once (block groups ≈ 1–2k, tracts ≈ 400, blocks 7.5k), join in DuckDB or geopandas offline, then write per-neighborhood shards or PMTiles attributes. → [data pipeline](../build-plan/data-pipeline.md)
- **Crosswalks:** WPRDC parcel centroids (`3fab7152-…`) already carry tract and block-group GEOIDs. That avoids a spatial join for EJScreen and NRI.
- **Geography vintages:** EJScreen v2.32 uses 2020 block groups, and NRI uses 2020 tracts. The old WPRDC PM2.5 file uses 2010 tract IDs, so skip it.
- **Paging:** ArcGIS returns at most 2,000 records per request. Page with `resultOffset`, or pull a GeoJSON download where one exists.
- **Privacy:** don't join owner names from the assessments or the County portal. `ParcelsPublic` already anonymizes private owners.

## Open questions
- Is the team's map built on `ParcelsPublic` or on another parcel file? Confirm the property names so these fields merge cleanly.
- EJScreen indicator data years (v2.32 technical documentation) and the mirror's durability.
- Whether to pull NLCD and Landsat heat for this build, or use City canopy only.
- Whether NRI's building-value weighting makes its ratings misleading for comparing Pittsburgh tracts. It may be better to show hazard-specific *frequency or exposure* fields than composite risk.

## Connects to
- [Zoning GIS](zoning-gis.md) · [Environmental constraints](environmental-constraints.md) · [Parcels and assessments](parcels-and-assessments.md)
- [Track 3 indicators](../track3/indicators-and-data.md) · [Track 3 ideas](../track3/ideas-and-considerations.md)
- [Dimensional standards and use table](../policy/dimensional-standards-and-use-table.md) · [Data pipeline](../build-plan/data-pipeline.md)

## Sources
- [City ParcelsPublic FeatureServer](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/ParcelsPublic/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: schema, sample rows, spatial reference
- [WPRDC Property Assessments](https://data.wprdc.org/dataset/property-assessments) `[read]` *(accessed 2026-09-26)*: LOTAREA by PARID
- [City Residential Lot Dimensions layer](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/Parcels_Exp_02052025_Residential_Lot_Dimensions/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [EJScreen v2.32 State Percentiles Block Groups (PEDP mirror)](https://services2.arcgis.com/w4yiQqB14ZaAGzJq/arcgis/rest/services/EJScreenStatePercentilesBlockGroup/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: official EPA EJScreen endpoints returned 404 / no response
- [WPRDC Allegheny County Air Quality](https://data.wprdc.org/dataset/allegheny-county-air-quality) `[read]` *(accessed 2026-09-26)*: monitors, hourly and daily AQI
- [WPRDC ACHD Emissions Inventory](https://data.wprdc.org/dataset/emissions-inventory) `[read]` *(accessed 2026-09-26)*: facility lat/lon, pollutant, tons per year
- [WPRDC Particulate Matter 2.5 (2011)](https://data.wprdc.org/dataset/particulate-matter-2-5) `[read]` *(accessed 2026-09-26)*
- [WPRDC GEOS-CF air quality forecast](https://data.wprdc.org/dataset/air-quality-forecast) and [temperature inversions](https://data.wprdc.org/dataset/temperature-inversions) `[read]` *(accessed 2026-09-26)*
- [FEMA National Risk Index, census tracts](https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0) `[read]` *(accessed 2026-09-26)*: field list and a point query
- [FEMA NFHL flood hazard zones](https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28) `[read]` *(accessed 2026-09-26, earlier sweep)*
- [City Tree Coverage Percent by Census Block](https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/Tree_Coverage_Percent_by_Census_Block/FeatureServer/0) `[read]` *(accessed 2026-09-26)*
- [Organizer data catalog](../../sources/organizers-2026-09-26-public-data-catalog.csv) `[read]`: lists EJScreen, NLCD, NOAA and FEMA as Track 3 sources
