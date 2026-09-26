# Groundwork PGH — Data Sources (verified)

All endpoints below were hit live on **2026-09-26** (curl from macOS, no API keys). Row counts and field names are copied from live responses. Snippets target **bun + TypeScript** (`fetch` built in).

**Pin `geotiff@2.1.3`.** `geotiff@3.0.5` throws `RangeError: Offset is outside the bounds of the DataView` on MRLC GeoServer WCS output. 2.1.3 reads every raster source in this doc; this was tested end to end. Also `bun add proj4 @turf/turf`.

Pittsburgh bbox used throughout: `-80.10,40.35,-79.85,40.51` (lon/lat, EPSG:4326). The city zoning extent is `-80.0955,40.3616,-79.8657,40.5012`.

---

## 0. Shared helper: ArcGIS FeatureServer pager

Almost everything city-side is on `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services/<svc>/FeatureServer/0`. These are public, AGOL-hosted, and support `f=geojson`, `f=pbf`, pagination, and `outStatistics`. `maxRecordCount` is **1000** for the `PGHWeb*` layers and **2000** for `ParcelsPublic` and `Adopt_A_Lot_Parcels_view`. A response that hit the limit carries `"properties":{"exceededTransferLimit":true}`.

```ts
// scripts/lib/arcgis.ts
export const PGH = "https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services";
export async function fetchAllGeoJSON(layerUrl: string, opts: { where?: string; outFields?: string; pageSize?: number; precision?: number } = {}) {
  const { where = "1=1", outFields = "*", pageSize = 1000, precision = 6 } = opts;
  const features: any[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const q = new URLSearchParams({ where, outFields, outSR: "4326", f: "geojson", geometryPrecision: String(precision),
      resultOffset: String(offset), resultRecordCount: String(pageSize), orderByFields: "OBJECTID" });
    const res = await fetch(`${layerUrl}/query?${q}`);
    if (!res.ok) throw new Error(`${res.status} ${layerUrl}`);
    const fc = await res.json();
    if (fc.error) throw new Error(JSON.stringify(fc.error));
    features.push(...fc.features);
    if (!fc.properties?.exceededTransferLimit && fc.features.length < pageSize) break;
  }
  return { type: "FeatureCollection", features } as GeoJSON.FeatureCollection;
}
// count: `${layer}/query?where=1=1&returnCountOnly=true&f=json`
```
Gotcha: some layers use a lowercase `objectid` (Slope25, LandslideProne, Undermined, Sewersheds). Pass `orderByFields: "objectid"` for those, or drop `orderByFields`.

---

## 1. City of Pittsburgh ArcGIS layers (Ease / Climate constraints)

| svc | features | geometry | key fields |
|---|---|---|---|
| `PGHWebZoning` | **1069** | polygon | `zon_new` (e.g. `R1D-H`, `RM-M`, `UNC`, `R-MU`, `GT-A`, `SP-11`…), `full_zoning_type`, `legendtype` |
| `PGHWebNeighborhoods` | **90** | polygon | `hood`, `hood_no`, `acres`, `sqmiles`, `dpwdiv` |
| `PGHWebSlope25` | **1714** | polygon | `slope25` (areas ≥25% slope) |
| `PGHWebLandslideProne` | **37** | polygon | `landslideprone` |
| `PGHWebUndermined` | **47** | polygon | `undermined` |
| `PGHWebFEMA2014` | **160** | polygon | `fld_zone`, `floodway`, `sfha_tf`, `static_bfe` |
| `FEMA_2026` (newer, prefer) | **435** | polygon | `FLD_ZONE`, `ZONE_SUBTY`, `SFHA_TF`, `STATIC_BFE`, `DFIRM_ID` |
| `PGHWebZoningOverlays` | **139** | polygon | `overlay`, `criteria` |
| `Multi_Unit_Zoning_Districts` | **417** | polygon | same as zoning + `Asterisk`: districts that permit multi-unit |
| `InclusionaryHousingOverlayDistrict` | 1 | polygon | IZ overlay (Lawrenceville/Bloomfield/Polish Hill area) |
| `PGHWebMajorTransitBuffer` | 3 | polygon | `transit`: 1500 ft major-transit buffer (zoning parking reductions) |
| `PGHWebSewersheds` | **233** | polygon | `sewertype` (182 `Combined`, 51 `Separated`), `cso_shed`, `poc` |
| `City_Boundary` / `City_Limits` | — | polygon | city outline |

- Verified: 2026-09-26. All are public, with no token.
- Size: each is under 5 MB as GeoJSON, except Zoning (around 8 MB) and Slope25 (large). Simplify with `turf.simplify` for the client.
- License: City of Pittsburgh open data. The WPRDC mirrors are CC-BY or CC0 depending on dataset; attribute "City of Pittsburgh".
- Snippet: `await fetchAllGeoJSON(\`${PGH}/PGHWebZoning/FeatureServer/0\`, { outFields: "zon_new,full_zoning_type,legendtype" })`
- Gotchas: the zoning layer also includes Mount Oliver Borough as `MTOBOR`; exclude it. `FEMA_2026` has the current FIRM, while `PGHWebFEMA2014` is legacy. Slope25 is big, so use `geometryPrecision=5` and simplify.

### 1a. Parcels — citywide polygons with zoning, hood, and vacancy (best parcel base)
- **Name:** `ParcelsPublic`: `${PGH}/ParcelsPublic/FeatureServer/0`
- Verified 2026-09-26: **142,635** polygons, maxRecordCount 2000. Data last edited 2026-09 (`lastEditDate 1789964614984`).
- Fields: `pin`, `mapblocklo`, `calcacreag`, `propertyow` (owner name), `propertyho`, `propertyad`, `ownerdesc`, `classdesc`, `usedesc`, `localbuild` (assessed building $), `Vacant` (`Vacant`/`Not Vacant`), `OwnerCateg` (`City`/`URA`/`HACP`/`County`/`Private`/`Other`), `Address`, `DIST_NAME` (council district), `hood`, `zon_new` (zoning already joined), `Shape__Area` (sq ft).
- Size: about 0.8 MB per 2000-feature page with 8 fields at precision 6, so **around 60 MB total GeoJSON** over 72 pages (about 1 min).
- Snippet: `fetchAllGeoJSON(\`${PGH}/ParcelsPublic/FeatureServer/0\`, { outFields: "pin,Vacant,OwnerCateg,zon_new,hood,classdesc,usedesc,calcacreag,localbuild,Address", pageSize: 2000 })`
- Single parcel by PIN: `.../ParcelsPublic/FeatureServer/0/query?where=pin='0174K00052000000'&outFields=*&outSR=4326&f=geojson` (verified).
- Gotchas: `zon_new` is a spatial join, so split-zoned parcels get one value. Owner names are present (PII-ish), so don't ship them to the client unless needed.

### 1b. Parcel points with vacancy (lighter alternative)
- `Adopt_A_Lot_Parcels_view`: **142,774** points, maxRecordCount 2000.
- Fields: `pin, mapblocklo, calcacreag, propertyow, ownerdesc, classdesc, usedesc, localbuild, Vacant, OwnerCateg, Garden_Name, Address, AAL (yes=128 adopted lots), x, y`.
- Counts: `Vacant`: 31,898 Vacant vs 110,876 Not Vacant. `OwnerCateg`: Private 127,171, City 12,555, URA 1,572, County 647, HACP 522, Other 307.
- Use this if you only need points. It already has lat/lon in `x`,`y`.

### 1c. City-owned vacant inventory (Ease: acquirability)
- `ParcelsPublicCityVacant`: **5,786** polygons, all `OwnerCateg=City`.
- Fields: `pin, Address, current_status, inventory_type, acquisition_method, hood, zon_new, prior_years, PGH_FEM, calcacreag`.
- `current_status`: Available for Sale 3,260 · Hold for Study 1,836 · Sale Pending 489 · Unknown 82 · Litigation Pending 24 · Acquisition Pending 20.
- `inventory_type`: Public Sale 2,480 · Hold For Study 1,538 · URA Transfer 1,419 · **PLB Transfer 117** (these are Land Bank-bound) · CDC Property Reserve 79.
- Other vacant/public layers seen: `Vacant_Parcels_Feb23_Owner` (31,954 vacant polygons with `OwnerCateg`), `Publicly_Owned_Parcels` (12,694), `City_and_URA_Owned_Parcels`, `Tax_Delinquent` (13,796 polygons with full assessment fields), `Surface_Parking_Lots` (332).

### 1d. Other useful city layers (verified)
| svc | n | what |
|---|---|---|
| `Housing_Burden_v2` | 90 hoods | `Percentage_of_renter_househol_1` = % renters >30% burdened, `_2` = >50%, `Percentage_of_owner_households_` (>30%), `Renter_housing_burden_level_num` 1–3, `Households`. Strong Equity/Demand input. |
| `Median_HH_Income_ACS_2020_2024_City` | 128 tracts | `GEOID`, `B19049_001E` (median HH income), `B19053_001E` (households), **`Pct_AMI`**, `Status` (AMI band label). |
| `Tracts2020_Pgh_CommunityNeed` | 128 | poverty, joblessness, `NoVehicleRate_2022_ACS_5YE`, `PercentwoInternet…`, homicide/overdose rates |
| `QCT_2025` / `HUD_Qualified_Census_Tract_Estimates_2026` | 128 | `QCT` flag (LIHTC basis boost) |
| `Census_Tract_2020` | 128 | tract polygons, `geoid` |
| `PGHZipCodes` | 40 polys (multipart split; 29 unique ZIP5) | `ZIP5`, city-clipped ZIPs |
| `Tree_Coverage_Percent_by_Neighborhood` | 90 | `Perc_Cover` (2020 canopy %) |
| `Tree_Coverage_Percent_by_Census_Block` | 7,453 | `GEOID`, `PercCover` |
| `EnvironmentalJusticeAreas` | 218 BGs | `NON_WHITE_`, `POVERTY_PC` |
| `HighFrequencyTransit` | 742 stops | `stop_id, stop_name, route_code, mode, trips_wd, trips_sa, trips_su, trips_7d`, feed `2602`. **This is the frequent network with stop-level trip counts.** |
| `PRT_Stops_Detailed` | 2,866 | `StopID, Routes_ser, NumberofRo, Ons_AvgWkd, Offs_AvgWk, Shelter, Mode` (ridership) |
| `PRT_Routes` | 243 | `Route_Name, Mode, AvgDaily_R` |
| `PGHWebAddresses` | 126,872 pts | address points with `full_addre`, `zip_code` (for local geocoding/autocomplete) |
| `TreasurySales_view` / `Treasury_Sales_2026_New` | 62 / 41 | upcoming treasurer-sale parcels with `Upset_Price` |
| `LandcareProgram` | layers 0–5 | Illegal dump sites (852 pts), Parks, Greenway, Cemetery, Woodland, Steep Slope |

Display-only tile caches (no values, but good map overlays): `https://tiles.arcgis.com/tiles/YZCmUqbcsUpOKfj7/arcgis/rest/services/TreeCanopy_2023/MapServer/tile/{z}/{y}/{x}` and `.../UHI_CU_PIT_2020_MEANLST_Clip1/MapServer/tile/{z}/{y}/{x}` (2020 NOAA/CAPA-style mean LST). Both are `TilesOnly`.

---

## 2. WPRDC (CKAN) sources

CKAN API base: `https://data.wprdc.org/api/3/action/`. `datastore_search` works and **caps at 32,000 rows per call** even if you ask for more. Follow `result._links.next`. `datastore_search_sql` returns **403** (confirmed). `filters` (JSON) and `fields` params work.

```ts
export async function wprdcAll(resource_id: string, filters?: object, fields?: string[]) {
  const out: any[] = []; let offset = 0;
  for (;;) {
    const q = new URLSearchParams({ resource_id, limit: "32000", offset: String(offset) });
    if (filters) q.set("filters", JSON.stringify(filters));
    if (fields) q.set("fields", fields.join(","));
    const r = await (await fetch(`https://data.wprdc.org/api/3/action/datastore_search?${q}`)).json();
    if (!r.success) throw new Error(JSON.stringify(r.error));
    out.push(...r.result.records); offset += r.result.records.length;
    if (offset >= r.result.total || r.result.records.length === 0) return out;
  }
}
```

### 2a. Parcel centroids (Allegheny County) — resource `3fab7152-3f11-4788-8372-4c33f86ea813`
- URL (CSV, 111.8 MB, whole county): `https://data.wprdc.org/dataset/2536e5e2-253b-4c58-969d-687828bb94c6/resource/3fab7152-3f11-4788-8372-4c33f86ea813/download/parcel_centroids_2025_march.csv`
- Verified 2026-09-26. Total **585,387** rows (March 2025 vintage). **City rows: `MUNI_NAME = "PITTSBURGH"` → 142,812.**
- Fields: `LAT, LONG, PIN, COUNTY, GEOID (tract, int), FIPS_STATE, FIPS_COUNTY, FIPS_TRACT, FIPS_BLOCKGROUP, FIPS_BLOCK, TRACT_NAME, BLOCKGROUP_NAME, BLOCK_NAME, MUNI_NAME, MUNI_TYPE, MUNI_LABEL ("Pittsburgh"), MUNI_FIPS ("61000"), CITY_NEIGHBORHOOD, NEIGHBORHOOD_NUMBER, US_CONGR_DIST, PA_HOUSE_DIST, PA_SEN_DIST`
- License: CC0.
- Snippet (5 calls of about 4 MB each): `await wprdcAll("3fab7152-3f11-4788-8372-4c33f86ea813", { MUNI_NAME: "PITTSBURGH" }, ["PIN","LAT","LONG","GEOID","FIPS_BLOCKGROUP","CITY_NEIGHBORHOOD"])` (tested at 0.7 s per 32k page).
- Gotchas: block-group GEOID must be built as `"42003"+FIPS_TRACT+FIPS_BLOCKGROUP`. Condo units share a centroid (PIN suffixes like `…000A00`), so dedupe on the first 12 chars if needed. The filter value `MUNI_LABEL: "Pittsburgh City"` returns 0 rows; use `MUNI_NAME`.

### 2b. Property assessments — API resource `65855e14-549e-4992-b5be-d629afc676fa`
- CSV (435 MB, county): `https://data.wprdc.org/dataset/2b3df818-601e-4f06-b150-643557229491/resource/9a1c60bd-f9f7-4aba-aeb7-af8c3aaa44e5/download/assessments.csv`
- Datastore total **584,999**. City filter `SCHOOLDESC: "Pittsburgh"` → **143,806**. (Wards are `MUNICODE` 101–132 as strings. Filters take arrays, e.g. `{"MUNICODE":["101",…,"132"]}`, but SCHOOLDESC is simpler.)
- Key fields: `PARID, PROPERTYHOUSENUM, PROPERTYADDRESS, PROPERTYZIP, MUNICODE, NEIGHDESC, OWNERDESC, CLASS, CLASSDESC, USECODE, USEDESC, LOTAREA, HOMESTEADFLAG, SALEDATE, SALEPRICE, FAIRMARKETLAND, FAIRMARKETBUILDING, FAIRMARKETTOTAL, STYLEDESC, STORIES, YEARBLT, CONDITIONDESC, CDUDESC, TOTALROOMS, BEDROOMS, FINISHEDLIVINGAREA, ASOFDATE`. **No owner name.** Data dictionary: resource `c665470c-ee72-4f0d-b772-4f09c2145f2a`.
- License: CC0. Snippet: `wprdcAll("65855e14-549e-4992-b5be-d629afc676fa", { SCHOOLDESC: "Pittsburgh" }, ["PARID","USEDESC","LOTAREA","FAIRMARKETLAND","FAIRMARKETTOTAL","YEARBLT","CONDITIONDESC","SALEPRICE","SALEDATE"])` (5 pages).

### 2c. City-owned properties — `e1dcee82-9179-4306-8167-5891915b62a7`
- Dump: `https://data.wprdc.org/datastore/dump/e1dcee82-9179-4306-8167-5891915b62a7`. **12,477** rows, updated daily (modified 2026-09-26). CC-BY.
- Fields: `pin, address, owner, parc_sq_ft, class, zoned_as, inventory_type, current_status, acquisition_method, acquisition_date, latitude, longitude, census_tract, neighborhood_name, council_district, ward`.
- This is tabular. It overlaps `ParcelsPublicCityVacant` (5,786 vacant subset with polygons).

### 2d. PLI permits — `f4d1177a-f597-4c32-8cbf-7885f56253f6`
- Dump: `https://data.wprdc.org/datastore/dump/f4d1177a-f597-4c32-8cbf-7885f56253f6`. **65,378** rows, updated daily. CC-BY.
- Fields: `permit_id, permit_type, work_description, work_type, commercial_or_residential, total_project_value, issue_date, parcel_num, address, latitude, longitude, neighborhood, ward, zip_code, status`.
- Use: Demand signal = permits per hood per year and new-construction value. Filter `work_type` for "New".

### 2e. **Housing Market Value Analysis (MVA) 2021** (the "demand" source)
- Package `market-value-analysis-2021` (Reinvestment Fund for URA/Allegheny County). CC0.
- GeoJSON (10.3 MB, CRS84): `https://data.wprdc.org/dataset/f669d677-c9e2-4d2f-b16f-c9ab5a4f3d10/resource/ec09f5ad-f43e-4f06-af3a-65641c2818dc/download/mva.geojson`
- **1,114 block groups** (county). Fields: `geoid` (12-digit BG), **`MVA21`** market type A–J plus `NC` (not classified), `MSP1719` (median sale price 2017–19), `VSP1719` (price variance), `PHHOO` (% owner-occupied), `PROSubHH` (% subsidized rentals), `PNRofRCnt` (% new construction since 2016), `PViolAddre` (% with violations), `pforc1719` (foreclosure rate), `pcond_flag` (% poor condition), `PVacLot` (% vacant lot area).
- Distribution: A 76, B 113, C 185, D 100, E 196, F 24, G 190, H 122, I 30, J 42, NC 36. **A is the strongest market and J the most distressed.**
- Dictionary XLSX: `.../resource/45fe19b5-26bd-455e-aae7-c4b99f30946d/download/allegheny_pitts_mva2021_metadata.xlsx`
- Snippet: `const mva = await (await fetch(MVA_URL)).json();`, then build a `Map(geoid → MVA21)` and join on parcel-centroid BG GEOID.
- Gotcha: numeric fields come as numbers in the GeoJSON download but as strings in the datastore version. Uses 2010 BG geography, so match 2020 BG GEOIDs by spatial join (point-in-polygon), not by ID.

### 2f. **Displacement Risk Ratio (DRR) 2021** (Equity / displacement)
- Same package. Zipped shapefile (2.0 MB, WGS84): `https://data.wprdc.org/dataset/f669d677-c9e2-4d2f-b16f-c9ab5a4f3d10/resource/3a648531-15d7-4fc0-aba0-611968b92435/download/pitts_allegheny_drr2021.zip`
- **1,100 block groups.** Fields: `geoid`, `CRS1415…CRS1920` (count of residential sales), `MSP1415…MSP1920` (median sale price), **`DRR1415…DRR1920`** (displacement risk ratio by year) with `…C` text class columns (`"3.0 or Above"`, `"2.0 - 2.5"`, `"Insufficient Data"`), `dDRR1419` (change 2014→2019), `PdMSP1419` (% change in price), `PdMSP1419C` (`Declined`/…).
- Convert: `bun add shapefile` → `import * as shp from "shapefile"; const fc = await shp.read("x.shp","x.dbf")`. Or run `ogr2ogr` once.
- Gotcha: `DRR=0` with `…C="Insufficient Data"` means null, not zero risk.

### 2g. Housing Indicators (tract CSVs; package `housing-indicators`, CC-BY)
Each is a small CSV (7–32 KB) with datastore enabled. Selected resources:
- `48a84ba8-194c-47f9-a5c0-d4098a43151d`: median 1–2 unit sale price (2021 $) by tract
- `1cf7c782-b8ce-4fb6-a812-a8839c5494c4`: ownership change 2011–2020
- `4fbe5110-94b5-4aa4-91b7-78a2ece3579e`: foreclosures 2009–21 by tract
- `705bfbfe-2c8b-4fe0-8842-d5708d82291e`: tax liens by tract (Feb 2022)
- `9eb9ea09-0be0-4659-b7c3-3d37776107d9`: Housing Choice Vouchers by tract 2012–21
- `4ff93079-c4a1-4c5c-957c-1a74dd7329fe`: vacant USPS addresses by tract (Mar 2021)
- `786058f7-c8f5-443e-829e-6439e32396d6`: unimproved parcels by tract (Oct 2021)

URL pattern: `https://data.wprdc.org/dataset/3dc68ef8-02e6-43ca-8ec3-adf99b940ef6/resource/<id>/download/<file>.csv`. Or use `datastore_search?resource_id=<id>`.

### 2h. USPS vacant addresses (newer) — `70dd02d2-137d-43c9-b158-f7b1ec6c6d42`
- "Pennsylvania Vacant Addresses (2023)": **13,780** rows (tract × quarter). Fields: `geoid` (tract), `quarter_sortable` (`2023-Q1`…), `total_address_count`, `total_vac_count`, `res_vac`, `nostat_res`, `ams_res`, … CC0.
- Filter to Allegheny: `geoid` starts with `42003` (use `q` or pull all 13,780 rows, since it's small).

### 2i. UCSUR neighborhood profiles
- **2019–23 vs 2009–13** (newest): resource `e68fe400-38a6-4d7a-864c-f84be9e58c6c`, CSV `https://data.wprdc.org/dataset/007c3ea8-3f76-4b26-8a09-a14811abf12e/resource/e68fe400-38a6-4d7a-864c-f84be9e58c6c/download/profiles_data_20132023.csv` (233 KB). 72 rows: **66 neighborhood groups** plus 6 regions (US, MSA, County, City…). The license is not specified on the package. The 2024 version (2018–22 vs 2008–12, `a2d6468e-…`) is "Public Domain".
- Variables (each `Var_2013_*`, `Var_2023_*`, `Var_Change_*`): TotalPopulation, Race_1-5, Hispanic, Age_1-5, School, educ, LF (labor force), commuting_1-7, **income_1-7** (bins), **poverty_1-3**, **tenure_1-3**, **vacancy_1-3**, hhtype, mobility, vet. Dictionary XLSX: resource `300132af-1be5-4f44-975c-10cb0024f8d3`. Tract→neighborhood index XLSX: `a322f97c-8b82-4c2b-9f6d-4fa6fe02abeb`.
- Gotchas: **no median rent or cost-burden fields.** Use Census Reporter (§4) or the city `Housing_Burden_v2` layer for those. The 66 groups combine some of the 90 hoods (e.g. "Arlington - Arlington Heights - Mount Oliver(City Neighborhood) - St. Clair"), so map them via the tract index.

### 2j. Other WPRDC packages (verified exist)
- `city-treasury-sales`: resource `6b2aa631-26e0-4d02-abe0-7fb87707210c`, 96 rows. Fields: `pin, address, treasury_sale_date (e.g. 2026-10-02), total_tax_due, …, latitude, longitude, neighborhood_name`. License not specified.
- `real-estate-sales`: resource `5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1`, **503,747** rows, daily. Fields: `PARID, FULL_ADDRESS, MUNICODE, SALEDATE, PRICE, SALECODE, SALEDESC, INSTRTYP`. CC0. For Demand, use valid sales only (`SALEDESC='VALID SALE'`).
- `lots-to-love` (Grounded): `027d0b43-dc1b-4bba-9b07-63587a8c2b42`, 292 community lot projects. CC-BY.
- `pittsburgh-street-centerlines`: GeoJSON 50.9 MB `https://data.wprdc.org/dataset/9ebd073b-f637-4f33-a7c2-619d23dd085a/resource/8a38a51d-5000-4600-8114-3f9e92202a64/download/pgh_centerlines.geojson`, shapefile zip 6.2 MB (`308f075c-…/pgh_centerlines.zip`). CC0. Live ArcGIS: `${PGH}/PavementPublic/FeatureServer/0`.
- `combined-sewershed` (PWSA): GeoJSON resource `138d6b65-1630-4905-9421-de90cd9d59e5`. CC-BY.
- `sidewalk-to-street-walkability-ratio`: BG CSV `b90ccee1-c0aa-43b9-93e2-8a25e690c393` (100 KB). CC-BY. A local walkability proxy.
- `allegheny-county-mortgage-foreclosure-records`: `859bccfd-0e12-4161-a348-313d734f25fd`.
- **WPRDC property-api (`tools.wprdc.org/property-api/v0|v1/parcels/<PIN>`) returns HTTP 502 (DOWN).** Use `ParcelsPublic` by PIN (§1a) or the County parcels MapServer: `https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0/query?where=PIN='0174K00052000000'&outFields=*&outSR=4326&f=geojson` (verified, maxRecordCount 1000, fields `PIN, MAPBLOCKLOT, MUNICODE, CALCACREAGE, SHAPE_Area`).

---

## 3. Geocoding and ZIP search

### 3a. Census Geocoder
- URL: `https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?address=7501+Penn+Ave+Pittsburgh+PA&benchmark=Public_AR_Current&vintage=Current_Current&layers=10,8&format=json`
- Verified: returns `7501 PENN AVE, PITTSBURGH, PA, 15208`, x `-79.896520567`, y `40.447646001`, tract `42003140500`, BG `420031405001`. `layers=10` gives block groups and `8` gives tracts. Public domain, no key.
- **A bare ZIP ("15206") returns `addressMatches: []`.** Handle ZIPs yourself with the ZCTA polygons below.
- Batch: `POST https://geocoding.geo.census.gov/geocoder/locations/addressbatch` (multipart `addressFile`, up to 10k rows). Not needed if you use the 126,872 city address points (`PGHWebAddresses`) for autocomplete.
- Snippet:
```ts
const g = await (await fetch(`https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress?${new URLSearchParams({address:q,benchmark:"Public_AR_Current",vintage:"Current_Current",layers:"10,8",format:"json"})}`)).json();
const m = g.result.addressMatches[0]; // m.coordinates.{x,y}, m.geographies["Census Tracts"][0].GEOID
```
- Gotcha: the Census geocoder sends no CORS headers for browser use in some setups. Call it from the build script or a server route, or do client-side matching against the static address list.

### 3b. ZCTA 2020 (TIGERweb)
- Layer: `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1` ("2020 Census ZIP Code Tabulation Areas").
- Verified: `where=ZCTA5 LIKE '152%'` returns **43** features, 635 KB GeoJSON at precision 5. The bbox intersect lists 51 ZCTAs (15017…15290). Public domain.
- Snippet: `fetch("https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/PUMA_TAD_TAZ_UGA_ZCTA/MapServer/1/query?where=ZCTA5+LIKE+'152%25'&outFields=ZCTA5&outSR=4326&geometryPrecision=5&f=geojson")`
- Alternative: city `PGHZipCodes` (29 unique ZIP5, clipped to city). Both are fine. Use ZCTA for the full ZIP shape and PGHZipCodes for the city portion.

### 3c. Census tracts / BGs (TIGERweb)
- `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/0` (Census Tracts, current). `where=STATE='42' AND COUNTY='003'` gives **394** tracts. Layer 1 is block groups. The city layer `Census_Tract_2020` (128 city tracts) is easier.

---

## 4. ACS without a key

- **Census API (`api.census.gov`) without a key now returns HTTP 302** (redirect, no data). Treat it as key-required.
- **Census Reporter API: works, no key, ACS 2024 5-year (2020–2024).** Public domain data.
  - All Allegheny tracts in one call (75 KB): `https://api.censusreporter.org/1.0/data/show/latest?table_ids=B25064,B19013,B25070,B25003&geo_ids=140|05000US42003` returns **394 tracts**.
  - City of Pittsburgh: `geo_ids=16000US4261000`. ZCTA: `86000US15206`. Block groups: `150|05000US42003`.
  - Verified values: tract 1405 median gross rent `B25064001`=**$1,392**, median HH income `B19013001`=**$95,523**. City: rent **$1,261**, income **$65,742**.
  - Cost burden: `B25070` (gross rent as % of income). Burdened = (`B25070007`+`008`+`009`+`010`) / (`B25070001` − `B25070011`). Severe = `B25070010`/(001−011).
```ts
const cr = await (await fetch("https://api.censusreporter.org/1.0/data/show/latest?table_ids=B25064,B19013,B25070,B25003&geo_ids=140|05000US42003")).json();
for (const [geo, t] of Object.entries<any>(cr.data)) {
  const geoid = geo.replace("14000US", ""); const e = t.B25070.estimate;
  const burden = (e.B25070007 + e.B25070008 + e.B25070009 + e.B25070010) / Math.max(1, e.B25070001 - e.B25070011);
  rows.push({ geoid, rent: t.B25064.estimate.B25064001, income: t.B19013.estimate.B19013001, burden });
}
```
  - Gotcha: suppressed estimates come back as `null`. Keep requests to 10 or fewer tables per call.
- City layers already built from ACS 2020–24: `Median_HH_Income_ACS_2020_2024_City` (with `Pct_AMI`) and `Housing_Burden_v2` (by hood). See §1d.

---

## 5. HUD

All HUD USER downloads **require a browser-like User-Agent**. The default curl UA gets HTTP 202 (bot wall). Use `headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36" }`.

### 5a. FY2026 Income Limits: verified numbers (Pittsburgh, PA HUD Metro FMR Area, `METRO38300M38300`, Allegheny County)
- Source: `https://www.huduser.gov/portal/datasets/il/il26/Section8-FY26.xlsx` (771 KB), row `fips=4200399999`.
- **Median family income FY2026: $110,400**

| persons | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| ELI (30%) | 23,200 | 26,500 | 29,800 | 33,100 | 38,680 | 44,360 | 50,040 | 55,720 |
| VLI (50%) | 38,650 | 44,200 | 49,700 | 55,200 | 59,650 | 64,050 | 68,450 | 72,900 |
| LI (80%) | 61,850 | 70,650 | 79,500 | 88,300 | 95,400 | 102,450 | 109,500 | 116,600 |

Hardcode these into `data/hud_il_fy2026.json`. For 60%/120% AMI (LIHTC/workforce), derive from the 50% limit × 1.2 / × 2.4 (HUD convention).

### 5b. FY2026 Fair Market Rents (metro): verified
- `https://www.huduser.gov/portal/datasets/fmr/fmr2026/FY26_FMRs_revised.xlsx`: Pittsburgh HMFA **0BR $1,001 · 1BR $1,077 · 2BR $1,299 · 3BR $1,661 · 4BR $1,789**.
- Gotcha: this xlsx has a malformed `docProps/core.xml` that breaks openpyxl. SheetJS (`bun add xlsx`) should be fine. In Python, drop that zip member first.

### 5c. FY2026 Small Area FMRs (by ZIP)
- `https://www.huduser.gov/portal/datasets/fmr/fmr2026/fy2026_safmrs.xlsx` (4.4 MB). Columns: `ZIP\nCode`, `HUD Area Code`, `SAFMR\n0BR`…`SAFMR\n4BR`, plus 90%/110% payment standards (headers contain newlines).
- Verified samples (0/1/2/3/4BR): **15201** 1360/1470/1770/2260/2440 · **15202** 1060/1140/1380/1760/1900 · **15203** 1430/1530/1850/2370/2550 · **15204** 1070/1150/1390/1780/1910.
- Use: Demand (rent level by ZIP). Filter `ZIP` starting with `152`.
```ts
import * as XLSX from "xlsx";
const buf = await (await fetch(SAFMR_URL, { headers: { "User-Agent": UA } })).arrayBuffer();
const rows = XLSX.utils.sheet_to_json<any>(XLSX.read(buf).Sheets[XLSX.read(buf).SheetNames[0]]);
const pgh = rows.filter(r => String(r["ZIP\nCode"]).startsWith("152"));
```

### 5d. CHAS: newest is **2018–2022** (the 2017–2021 vintage also exists)
- Tract: `https://www.huduser.gov/portal/datasets/cp/2018thru2022-140-csv.zip` (**226 MB**, national)
- County: `https://www.huduser.gov/portal/datasets/cp/2018thru2022-050-csv.zip` (17.6 MB)
- Place: `https://www.huduser.gov/portal/datasets/cp/2018thru2022-160-csv.zip` (84 MB). Includes Pittsburgh city (`geoid` 1600000US4261000).
- Older: `.../cp/2017thru2021-140-csv.zip` (234 MB, verified 200).
- Tables of interest: **Table 8** (tenure × HAMFI income bin × cost burden) and **Table 1**. Filter tract rows by `geoid` containing `14000US42003`.
- Gotcha: 226 MB is large. Download once in the pipeline (`unzip -p file.zip Table8.csv | grep 14000US42003`) and commit only the filtered JSON. CHAS is **optional**, since Census Reporter plus the city `Housing_Burden_v2` layer cover cost burden.

---

## 6. Satellite / remote sensing (Climate score)

**Verified recipe:** rasters sampled at 32,000 real parcel centroids in **83–112 ms** after about 3.5 s of loading (node, geotiff@2.1.3). Scales linearly to 142k points in under 1 s. Spot check with the `abs(res)` sampler below: Downtown (-80.0, 40.441) is impervious 100% and canopy 0%; Frick Park (-79.905, 40.432) is impervious 0% and canopy 85% (2024); 7501 Penn Ave is impervious 77% and LST 38.1 °C.

### 6a. Tree canopy cover: USFS NLCD TCC v2025.6, **2024** (also has 2025), 30 m (primary)
- ArcGIS ImageServer (IIPP, USFS): `https://imagery.geoplatform.gov/iipp/rest/services/Vegetation/USFS_EDW_NLCD_TCC_CONUS/ImageServer`
- Available rasters (`query?where=beginyear>=2021`): `nlcd_tcc_conus_wgs84_v2025_6_2021…`, `…2022…`, `…2023…`, **`…20240101_20241231`**, `…20250101_20251231`. The time extent runs to 2025.
- **exportImage** for the Pittsburgh bbox returns an EPSG:4326 GeoTIFF, **900×576, 656 KB, U8**. Values 0–100 (% canopy). The mean over the bbox is 31.1%. Pixel ≈ 0.000278° ≈ 24–30 m.
- URL (verified):
```
https://imagery.geoplatform.gov/iipp/rest/services/Vegetation/USFS_EDW_NLCD_TCC_CONUS/ImageServer/exportImage?bbox=-80.10,40.35,-79.85,40.51&bboxSR=4326&imageSR=4326&size=900,576&format=tiff&pixelType=U8&noData=255&interpolation=RSP_NearestNeighbor&mosaicRule={"mosaicMethod":"esriMosaicAttribute","where":"name='nlcd_tcc_conus_wgs84_v2025_6_20240101_20241231'"}&f=image
```
  (URL-encode `mosaicRule`.) `maxImageWidth/Height` is 100000, so you could request more pixels.
- License: USFS / public domain.
- The old host `apps.fs.usda.gov/fsgisx01/...` now returns "migrated to IIPP" (403). Use `imagery.geoplatform.gov`.
- Fallback: MRLC WCS `mrlc_download:nlcd_tcc_conus_2021_v2021-4` (2021 only, EPSG:5070; see 6b pattern). Verified 850×767 over the bbox, mean 33.9%.

### 6b. Impervious surface: NLCD 2021, 30 m (MRLC GeoServer WCS)
- `https://www.mrlc.gov/geoserver/mrlc_download/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageid=NLCD_2021_Impervious_L48&subset=X(1329000,1354500)&subset=Y(2037000,2060000)&format=image/geotiff`
- Verified: 1.05 MB, 850×767, **native EPSG:5070 (Albers), uint8 0–100 %**. Histogram looks right (0% 150k px, 100% 8.4k px). The same pattern works for `NLCD_2021_Land_Cover_L48` (classes 21–24 developed, 41/43 forest, 11 water).
- **Gotchas:**
  1. Subsetting in 4326 (`subsettingCrs` 4326, `outputCrs`) returned all-zero or 404. **Subset in EPSG:5070 metres.** The bbox above equals −80.10..−79.85 / 40.35..40.51 projected. Sample by projecting lon/lat → 5070 with proj4: `proj4.defs("EPSG:5070","+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs")`.
  2. GeoServer emits big-endian tiled TIFFs with partial edge tiles. **geotiff@3.0.5 fails on these, geotiff@2.1.3 works.** Adding `geotiff:compression=DEFLATE` breaks both versions, so leave it uncompressed.
- Annual NLCD (2024) fractional impervious is **not** on WCS (only the change-count summary). The IIPP `Vegetation/USFS_EDW_NLCD_Landcover_CONUS` ImageServer has Annual NLCD **land cover** 2013–2024 (`Annual_NLCD_LndCov_2024_CU_C1V1`) via the same exportImage pattern, if you want 2024 developed classes.
- Alternative (no raster): UVM/Tree Pittsburgh neighborhood summary `https://services1.arcgis.com/YiULsZbgRKmBtdZN/arcgis/rest/services/Pittsburgh_Neighborhood_Tree_Temp_WFL1/FeatureServer/0` with fields `HOOD, Can_P` (canopy %), `Imperv_P` (impervious %), `Temp_Mean`. Verified.

### 6c. Land surface temperature: Landsat C2 L2 `ST_B10` via Microsoft Planetary Computer
- STAC search (no key):
```
POST https://planetarycomputer.microsoft.com/api/stac/v1/search
{"collections":["landsat-c2-l2"],"intersects":{"type":"Point","coordinates":[-79.99,40.44]},
 "datetime":"2024-06-01T00:00:00Z/2024-08-31T23:59:59Z","query":{"eo:cloud_cover":{"lt":15},"platform":{"in":["landsat-8","landsat-9"]}},
 "sortby":[{"field":"eo:cloud_cover","direction":"asc"}],"limit":5}
```
- **Clear summer scenes (verified, all have `lwir11`):** `LC08_L2SP_017032_20240823_02_T1` (0.12% cloud, **recommended**), `LC09_L2SP_018032_20230601_02_T1` (0.01%), `LC08_L2SP_017032_20230618_02_T1` (0.63%), `LC09_L2SP_018032_20250809_02_T1` (1.91%), `LC08_L2SP_017032_20250810_02_T1` (4.17%). Path 17 and path 18 (row 32) both cover the city.
- Asset: `item.assets.lwir11.href`, e.g. `https://landsateuwest.blob.core.windows.net/landsat-c2/level-2/standard/oli-tirs/2024/017/032/LC08_L2SP_017032_20240823_20240830_02_T1/LC08_L2SP_017032_20240823_20240830_02_T1_ST_B10.TIF`. COG, **EPSG:32617 (UTM 17N)**, uint16, nodata 0.
- **Signing:** `GET https://planetarycomputer.microsoft.com/api/sas/v1/token/landsat-c2-l2` returns `{ token, "msft:expiry" }`. The token is valid about 45 min. Append `?${token}` to the href. No key needed; unauthenticated calls are rate-limited.
- **Scale:** `K = DN * 0.00341802 + 149.0`, `°C = K − 273.15` (from `raster:bands` in the item, verified).
- Verified: window read of the city bbox is 701×601 px in **2.8 s** over HTTP range requests. Sample °C values on 2024-08-23: Downtown 37.2, Schenley Park 32.6, 7501 Penn Ave 38.1, bbox mean 33.8.
- Optional: mask clouds with `qa_pixel` (bits 1 dilated cloud, 3 cloud, 4 shadow). Average 2–3 scenes for robustness.
- Also available on PC: `modis-11A2-061` (1 km, too coarse), `hls2-l30`, `esa-worldcover`, `io-lulc-annual-v02`, `usgs-lcmap-conus-v13`, `naip`, `3dep-seamless`. **NLCD itself is not on Planetary Computer.**

### 6d. High-res canopy (Allegheny County / Tree Pittsburgh)
- PASDA: "Allegheny County Tree Canopy Change 2015–2020" (`https://www.pasda.psu.edu/uci/DataSummary.aspx?dataset=1235`) and a "Tree Canopy Change 2020–2024" MapServer layer (`services.pasda.psu.edu/server/rest/services/pasda/AlleghenyCounty/MapServer/35`). **PASDA ArcGIS server returned "Application Error / could not access any server machines" on 2026-09-26: UNVERIFIED / DOWN.** Don't depend on it.
- Use the city summaries instead (verified): `Tree_Coverage_Percent_by_Neighborhood` (`Perc_Cover`, 2020 canopy, 90 hoods), `Tree_Coverage_Percent_by_Census_Block` (`PercCover`, 7,453 blocks), and the `TreeCanopy_2023` tile cache (visual only).

### 6e. Urban heat island layers
- City tile caches from the NOAA/CAPA heat campaign (2020): `UHI_CU_PIT_2020_MEANLST_Clip1` and `UHI_CU_PIT_2020_MAXLST_Clip1` on `tiles.arcgis.com/tiles/YZCmUqbcsUpOKfj7/...`, used in webmap `7981505c44e0479fa8836f5cbd5f17f6`. These are **TilesOnly** (PNG/mixed): usable as a map overlay, but they don't give values.
- UVM neighborhood layer (see 6b) has `Temp_Mean` per hood (surface temp from a 2020-09-30 scene).
- **Recommendation:** compute your own LST per parcel from 6c. It is quantitative and current, and the recipe is proven.

### 6f. TypeScript recipe: sample rasters at ~142k lat/lon points (tested)
```ts
// scripts/sample-rasters.ts   bun add geotiff@2.1.3 proj4
import { fromUrl, fromArrayBuffer, type GeoTIFFImage } from "geotiff";
import proj4 from "proj4";
proj4.defs("EPSG:32617", "+proj=utm +zone=17 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:5070", "+proj=aea +lat_0=23 +lon_0=-96 +lat_1=29.5 +lat_2=45.5 +x_0=0 +y_0=0 +datum=NAD83 +units=m +no_defs");
const BBOX = [-80.10, 40.35, -79.85, 40.51] as const;
type Pt = { pin: string; lon: number; lat: number };

type Sampler = (lon: number, lat: number) => number | null;
// NOTE: use abs(resolution). GeoServer (MRLC WCS) TIFFs report +30 for Y res; ArcGIS/COGs report negative.
// Origin is always the top-left corner, so row = (oy - y) / |ry|. Verified on all three sources.
function sampler(img: GeoTIFFImage, ras: any, win: number[] = [0, 0], toXY = (lon: number, lat: number) => [lon, lat]): Sampler {
  const [ox, oy] = img.getOrigin(); const [rx, ry] = img.getResolution().map(Math.abs);
  return (lon, lat) => {
    const [x, y] = toXY(lon, lat);
    const c = Math.floor((x - ox) / rx) - win[0], r = Math.floor((oy - y) / ry) - win[1];
    if (c < 0 || r < 0 || c >= ras.width || r >= ras.height) return null;
    return ras[0][r * ras.width + c];
  };
}
async function tiffFromUrlBuffer(url: string) {
  return (await fromArrayBuffer(await (await fetch(url)).arrayBuffer())).getImage();
}

// 1) Tree canopy 2024 (EPSG:4326, small, fetch whole)
const mr = encodeURIComponent(JSON.stringify({ mosaicMethod: "esriMosaicAttribute", where: "name='nlcd_tcc_conus_wgs84_v2025_6_20240101_20241231'" }));
const tccImg = await tiffFromUrlBuffer(`https://imagery.geoplatform.gov/iipp/rest/services/Vegetation/USFS_EDW_NLCD_TCC_CONUS/ImageServer/exportImage?bbox=${BBOX}&bboxSR=4326&imageSR=4326&size=900,576&format=tiff&pixelType=U8&noData=255&interpolation=RSP_NearestNeighbor&mosaicRule=${mr}&f=image`);
const tcc = sampler(tccImg, await tccImg.readRasters());

// 2) Impervious 2021 (EPSG:5070 WCS; needs geotiff@2.1.3)
const impImg = await tiffFromUrlBuffer("https://www.mrlc.gov/geoserver/mrlc_download/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageid=NLCD_2021_Impervious_L48&subset=X(1329000,1354500)&subset=Y(2037000,2060000)&format=image/geotiff");
const imp = sampler(impImg, await impImg.readRasters(), [0, 0], (lon, lat) => proj4("EPSG:4326", "EPSG:5070", [lon, lat]));

// 3) LST from Landsat COG (range requests, window only)
const item = await (await fetch("https://planetarycomputer.microsoft.com/api/stac/v1/collections/landsat-c2-l2/items/LC08_L2SP_017032_20240823_02_T1")).json();
const { token } = await (await fetch("https://planetarycomputer.microsoft.com/api/sas/v1/token/landsat-c2-l2")).json();
const lstImg = await (await fromUrl(`${item.assets.lwir11.href}?${token}`)).getImage();
const utm = (lon: number, lat: number) => proj4("EPSG:4326", "EPSG:32617", [lon, lat]);
const [ox, oy] = lstImg.getOrigin(); const [rx, ry] = lstImg.getResolution().map(Math.abs);
const [x0, y0] = utm(BBOX[0], BBOX[1]); const [x1, y1] = utm(BBOX[2], BBOX[3]);
const win = [Math.floor((x0 - ox) / rx), Math.floor((oy - y1) / ry), Math.ceil((x1 - ox) / rx), Math.ceil((oy - y0) / ry)]; // [left, top, right, bottom] px
const lstDN = sampler(lstImg, await lstImg.readRasters({ window: win }), win, utm);

export function sampleAll(pts: Pt[]) {
  return pts.map(p => {
    const c = tcc(p.lon, p.lat), i = imp(p.lon, p.lat), dn = lstDN(p.lon, p.lat);
    return { pin: p.pin, canopyPct: c == null || c > 100 ? null : c, impervPct: i == null || i > 100 ? null : i,
             lstC: dn ? +(dn * 0.00341802 + 149 - 273.15).toFixed(1) : null };
  });
}
```
Tip: for a parcel-level value that is less noisy than a single 30 m pixel, average a 3×3 neighbourhood, or use polygon zonal stats (turf `bbox` → pixel loop → `booleanPointInPolygon` on pixel centers) for large lots.

---

## 7. Transit

### 7a. PRT GTFS
- `https://www.rideprt.org/developerresources/GTFS.zip`: **22.5 MB** zip (104 MB unzipped). `last-modified: Sat, 26 Sep 2026 04:00:53 GMT`. Verified 2026-09-26.
- `feed_info`: `feed_version=Merged_Clever_2606_2`, valid **20260628–20261014**. Files: `stops.txt` (6,388 stops), `routes.txt` (102 routes), `trips.txt`, `stop_times.txt` (80 MB), `shapes.txt` (22 MB), `calendar.txt` (service_id 2 = weekdays), `calendar_dates.txt`, `frequencies.txt` (empty).
- Stop-level frequency: count weekday `stop_times` per `stop_id` for trips whose `service_id` is active Mon–Fri. Stream `stop_times.txt` line by line (80 MB) rather than loading it whole.
- License: PRT developer terms (free, attribution).
- **Shortcut (verified):** city layer `HighFrequencyTransit` (742 stops with `trips_wd`, `trips_7d`, `route_code`, `mode`), already computed from GTFS feed 2602. Also `PRT_Stops_Detailed` for ridership (`Ons_AvgWkd`).

### 7b. EPA Smart Location Database / National Walkability Index (block group)
- ArcGIS MapServer (queryable, no download): `https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0`. `where=STATEFP='42' AND COUNTYFP='003'` returns **1,100 BGs**. maxRecordCount 1000, so page twice. Supports geoJSON.
- Key fields: `GEOID20` (actually 2010-vintage BG; the alias says 2018), **`NatWalkInd`** (1–20), `D4A` (m to nearest transit stop), `D3B` (intersection density), `D2B_E8MIXA` (employment mix), `D4C` (transit frequency), `D5AR`/`D5BR` (jobs within 45-min drive/transit), `Pct_AO0` (zero-car HH %), `TotPop`, `CountHU`.
- Full SLD downloads: `https://edg.epa.gov/EPADataCommons/public/OA/WalkabilityIndex.zip` (425 MB), `https://edg.epa.gov/EPADataCommons/public/OA/SLD/SmartLocationDatabaseV3.zip` (553 MB). Both 200; not needed given the REST endpoint. Public domain.
- Snippet: `fetchAllGeoJSON("https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0", { where: "STATEFP='42' AND COUNTYFP='003'", outFields: "GEOID20,NatWalkInd,D4A,D3B,D4C,Pct_AO0", pageSize: 1000 })`. **Drop `orderByFields` or use `OBJECTID`** (it exists).

---

## 8. Environment / hazards / infrastructure

- **FEMA NFHL** (national, live): `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` (Flood Hazard Zones). The city bbox intersect returns **1,190** features. Prefer the city's `FEMA_2026` layer (435, pre-clipped). Public domain.
- **EPA EJScreen:** `ejscreen.epa.gov` is **dead** (connection fails) and `gaftp.epa.gov/EJScreen/` returns 404. Mirrors:
  - PEDP interactive: `https://pedp-ejscreen.azurewebsites.net/` (200). Info page `https://screening-tools.com/epa-ejscreen`.
  - **Harvard Dataverse (CC0), direct CSV:** tract with state percentiles `https://dataverse.harvard.edu/api/access/datafile/10775973` (**153 MB**, `EJScreen_2024_Tract_StatePct_with_AS_CNMI_GU_VI.csv`; the 303 redirect to S3 works with GET but HEAD gives 403). BG versions: `10775971` (428 MB, StatePct), `10775972` (437 MB). Columns include `ID, PM25, OZONE, DSLPM, PTRAF, PRE1960PCT, PNPL, PRMP, PTSDF, UST, PWDIS, NO2, P_*` percentiles, `D2_*`/`D5_*` indexes.
  - Zenodo (CC-BY): `https://zenodo.org/records/14767363`. It's per-year zips of 5.2 GB for 2024, so avoid.
  - Recommendation: stream the 153 MB tract CSV once, keep rows with `ID` starting `42003`, and write about 400 rows to JSON. Optional, since city `EnvironmentalJusticeAreas` exists.
- **CDC PLACES** (tract, Socrata, no key): use the **2024 release `k9zj-b28y`** (32 measures). `https://data.cdc.gov/resource/k9zj-b28y.json?countyfips=42003&$limit=5000`. Fields: `tractfips`, `casthma_crudeprev`, `copd_crudeprev`, `chd_crudeprev`, `mhlth_crudeprev`, `disability_crudeprev`, `obesity_crudeprev`, … The newer "2025 release" `yjkw-uj5s` exposes only 5 measures in GIS format (382 Allegheny tracts), so don't use it. Public domain.
- **PWSA water/sewer pipes: not public as open data** (no WPRDC or city layer; city `PWSA_2026` layers are paving-conflict project lines). Proxies:
  - `PGHWebSewersheds` (combined vs separated, 233 polys, city)
  - WPRDC `combined-sewershed` (PWSA), `pwsa-inlets`, `green-infrastructure-projects`
  - Street centerlines (§2j) as the "serviceable frontage" proxy (a parcel touching a public street is assumed to have utility access)
- ALCOSAN: no open parcel-level layer found. WPRDC search "alcosan" returned only GI concept packages.

---

## 9. Land Bank, Adopt-a-Lot, LandCare, Treasurer sales

- **Pittsburgh Land Bank:** no machine-readable inventory on `pghlandbank.org` (site only links to a how-to page). Third-party sites report about 2,876 PLB properties (unverified). **Proxy:** `ParcelsPublicCityVacant.inventory_type = 'PLB Transfer'` (117) and city-owned `current_status='Available for Sale'` (3,260). No `propertyow LIKE '%LAND BANK%'` matches in ParcelsPublic.
- **Adopt-a-Lot:** `Adopt_A_Lot_Parcels_view` with `AAL='yes'` gives 128 lots and a `Garden_Name`. Also `AdoptALot`, `Gardenparcels`, `GrowPGHGardens` services exist. Plus WPRDC `lots-to-love`.
- **LandCare:** `LandcareProgram` (illegal dump sites 852 pts, parks, greenway, cemetery, woodland, steep slope layers 0–5), `Landcare_Program_WFL1` (adds `City_Owned_Vacant_Groups`), `Landcare_Proposed_Bundles`.
- **Treasurer sales:** WPRDC `6b2aa631-…` (96 rows, next sale 2026-10-02) plus city `Treasury_Sales_2026_New` (41, `Upset_Price`).

---

## 10. Displacement / gentrification indexes

- **Reinvestment Fund DRR 2021 (§2f):** the best Pittsburgh-specific displacement layer (BG level, CC0).
- **MVA 2021 (§2e):** market strength A–J.
- City `Housing_Burden_v2` has `Percentage_of_young_in_migrants` and `Renter_households_aged_15_34_sp`, which are gentrification-pressure signals.
- UCSUR profiles (§2i): 2013→2023 change in income bins, tenure, and race by neighborhood group. Enough to build a "change" index.
- Urban Displacement Project: **no Pittsburgh typology found**. Don't cite UDP.
- Also on the city server: `ARPA_DispAffected`, `Justice40_Neighborhoods`, `Social_Vulnerability_Index` (layer id 9, not 0), `Pittsburgh_Need_Map` (tract `Grade`), `Evictions_2020_to_2023_by_Zip_Code` (layer id 89). The last two were not field-checked.

---

## Fetch order for the data engineer (prioritized)

1. **Parcel base:** `ParcelsPublic` (142,635 polygons with `zon_new`, `hood`, `Vacant`, `OwnerCateg`), about 72 pages and 1 min. Derive centroids with `turf.centroid`, or pull WPRDC centroids filtered `MUNI_NAME=PITTSBURGH` (142,812, 5 calls) for the BG GEOID.
2. **Constraint polygons** (city ArcGIS, under 1 min total): Zoning, Slope25, LandslideProne, Undermined, FEMA_2026, ZoningOverlays, Multi_Unit_Zoning_Districts, MajorTransitBuffer, Neighborhoods, Census_Tract_2020, PGHZipCodes. Precompute parcel flags with turf `booleanIntersects`, using an rbush/flatbush index.
3. **MVA 2021 GeoJSON plus DRR 2021 shapefile** (12 MB total). Point-in-polygon join on centroids.
4. **Census Reporter** (1 call: B25064, B19013, B25070, B25003 for 394 tracts) plus city `Housing_Burden_v2` and `Median_HH_Income_ACS_2020_2024_City`.
5. **HUD constants:** FY26 IL table (hardcode from §5a), FY26 SAFMR for 152xx ZIPs, FY26 FMR.
6. **Rasters:** TCC 2024 exportImage, NLCD 2021 impervious WCS, Landsat LST 2024-08-23. Sample at parcel centroids with §6f (seconds).
7. **Transit:** `HighFrequencyTransit` (742 stops with trips_wd) plus `PRT_Stops_Detailed`. Distance from each parcel to the nearest frequent stop via a kd-tree (`kdbush` + `geokdbush`). GTFS zip only if you want your own frequency calc. EPA Walkability BGs (2 pages).
8. **Opportunity layers:** `ParcelsPublicCityVacant` (5,786 with status), treasury sales, Adopt-a-Lot, Landcare.
9. **Demand extras:** PLI permits (65k), real-estate sales (valid, last 3 yrs), USPS vacancy 2023, housing-indicators CSVs.
10. **Optional / heavy:** CHAS 2018–22 tract (226 MB), EJScreen tract CSV (153 MB), CDC PLACES `k9zj-b28y`, street centerlines (51 MB), ZCTA polygons (635 KB), SLD full zip. Skip unless time allows.

## What feeds which score

| Source | Ease | Demand | Transit | Equity | Climate |
|---|:-:|:-:|:-:|:-:|:-:|
| ParcelsPublic (zoning, vacant, owner, lot size) | ●● | | | | |
| Zoning / Multi-Unit districts / overlays / IZ | ●● | | | ● | |
| Slope25, LandslideProne, Undermined | ●● | | | | ● |
| FEMA_2026 / NFHL | ● | | | | ●● |
| City-owned vacant inventory / Treasury sales / PLB transfers | ●● | | | ● | |
| Sewersheds (combined vs separated), street centerlines | ● | | | | ● |
| Assessments (land value, condition, year built) | ● | ● | | | |
| **MVA 2021** (market type, median sale price) | | ●● | | ● | |
| Real-estate sales, PLI permits, SAFMR by ZIP, Census Reporter rent | | ●● | | ● | |
| USPS vacancy, foreclosures, tax liens (housing indicators) | ● | ● | | ● | |
| HighFrequencyTransit (trips_wd), PRT_Stops_Detailed ridership, GTFS | | ● | ●● | | |
| MajorTransitBuffer (1500 ft) | ● | | ●● | | |
| EPA Walkability (NatWalkInd, D4A, Pct_AO0) | | ● | ●● | ● | |
| **DRR 2021** (displacement risk ratio) | | ● | | ●● | |
| Housing_Burden_v2, Census Reporter B25070, CHAS | | ● | | ●● | |
| Median_HH_Income (Pct_AMI), QCT_2025, CommunityNeed, UCSUR profiles | | ● | | ●● | |
| HUD FY26 income limits / FMR (affordability thresholds) | | ● | | ●● | |
| EJScreen, CDC PLACES, EnvironmentalJusticeAreas | | | | ●● | ● |
| **TCC 2024** canopy % (raster) | | | | ● | ●● |
| **NLCD 2021 impervious** % (raster) | ● | | | | ●● |
| **Landsat LST** (°C, 2024-08-23) | | | | ● | ●● |
| City tree-canopy by hood/block, UVM Temp_Mean, UHI tile overlays | | | | ● | ● |

● = supporting input, ●● = primary input.

## Down / unverified (don't build on these)
- WPRDC property-api (`tools.wprdc.org/property-api/*`): **502**.
- `datastore_search_sql` on WPRDC: **403**.
- `api.census.gov` without key: **302** (key required).
- `ejscreen.epa.gov`: down. `gaftp.epa.gov/EJScreen/`: 404.
- PASDA ArcGIS server (Allegheny canopy change 2020–2024): "Application Error".
- `apps.fs.usda.gov/fsgisx01` USFS services: migrated to `imagery.geoplatform.gov/iipp` (403 on old host).
- Census geocoder: bare ZIP input returns no match (by design).
- bun itself was not installed on this machine. Snippets were verified under Node 25 with the same ESM `fetch` APIs.
