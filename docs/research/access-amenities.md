# Groundwork PGH: Access & amenities data (Track 3)

Every endpoint here was hit live on **2026-09-26** with curl or Python. Counts marked "in city" are point-in-polygon against the city `City_Boundary` layer, not just the bbox. This builds on `data-sources.md`: reuse its `fetchAllGeoJSON` (city ArcGIS pager) and `wprdcAll` (CKAN pager) helpers, `PGH` base URL, parcel centroids, `HighFrequencyTransit`, EPA walkability, and ACS income. None of those are repeated here.

**Short version:** the backbone is the **Allegheny County Assets** aggregator (32k POIs, 44 types, one CSV). Refresh the categories that go stale with fresher single-purpose feeds: ACHD food facilities (2025), PA DHS child care (updated daily), HRSA FQHC sites (updated daily), POGOH GBFS (live), and city ArcGIS layers. For jobs, use the **Access Across America 2024** block-group file (jobs within N minutes by transit, precomputed) plus **LODES 2023** WAC. For proximity, `kdbush` + `geokdbush` over 142k centroids takes about 3.4 s per run. Keep school "quality" **out of the score** and show it as context (see §3).

---

## 1. Health: hospitals, urgent care, FQHCs

| Source | URL | Count (in city) | Key fields | Date / license |
|---|---|---|---|---|
| **HRSA Health Center Service Delivery & Look-Alike Sites** | `https://data.hrsa.gov/DataDownload/DD_Files/Health_Center_Service_Delivery_and_LookAlike_Sites.csv` (14 MB, national) | 19,283 national; **22 in city**, all Active (Primary Care Health Services 13, East Liberty FHC 4, North Side Christian 2, Squirrel Hill HC 2, Cornerstone 1) | `Site Name`, `Site Address`, `Health Center Type Description`, `Operating Hours per Week`, `Site Status Description`, `Geocoding Artifact Address Primary X Coordinate` / `…Y Coordinate` | Last-Modified 2026-09-26. US Gov public domain |
| City `Pittsburgh_Hospitals` (layer **8**, not 0) | `${PGH}/Pittsburgh_Hospitals/FeatureServer/8` | 19 polygons (derived from OSM). **10 have `emergency='yes'`** | `name`, `emergency`, `beds`, `healthcare`, `operator` | Edited 2025-08-27. ODbL (OSM-derived) |
| Allegheny County Assets `doctors_offices`, `health_centers`, `achd_clinics` | see §5 | 198 / 36 / 8 | | Sourced from 2014 WPRDC primary-care data and an FQHC shapefile. Stale |
| OSM Overpass | see §5c | 14 `amenity=hospital`, 22 `amenity=clinic`, 10 `doctors`; urgent care only by name (`UPMC GoHealth Urgent Care`, …) | | ODbL, live |

- **HIFLD Open is gone.** `services1.arcgis.com/Hp6G80Pky0om7QvQ/.../Hospitals`, `Urgent_Care_Facilities`, `Fire_Stations`, `Pharmacies`, `Public_Schools` and `Child_Care_Centers` all return "Invalid URL" or "Item does not exist". Don't cite HIFLD.
- **Recommended:** use HRSA for FQHCs (the primary-care safety net, which is the equity-relevant one) plus the 10 city ED hospitals. There is no clean open urgent-care list. Use the OSM name match and label it "partial".
```ts
const csv = await (await fetch(HRSA_URL, { headers: { "User-Agent": "Mozilla/5.0" } })).text();
// parse with papaparse; filter row["Site State Abbreviation"]==="PA" && row["Site Status Description"]==="Active", then point-in-city
```
- Gotchas: the CSV has a BOM and a trailing empty column. Use `X`/`Y` coordinate columns, which are lon/lat. Some sites are administrative-only (`Health Center Type Description = "Administrative"`), so drop them.

## 2. Fire, EMS, police (city ArcGIS, no token)

| svc | n | fields | edited |
|---|---|---|---|
| `Fire_Station/FeatureServer/0` (WPRDC mirror `pgh-fire-stations`) | **32**: 16 Engine, 9 Engine+Truck, 3 Quint, 2 Truck, 1 Academy, 1 HQ | `station, address, nhood, type, district` | 2024-05-02 |
| `FireStations/FeatureServer/0` (alt) | 32 (`InCity` Yes 31) | adds `StationNum, InCity` | 2023-11 |
| `EMS_Station/FeatureServer/0` | **14** (Medic 1–14, Rescue, River Rescue, Training) | `name, address, nhood` | 2024-05-02 |
| `Police_Station/FeatureServer/0` | **10** (Zones 1–6, HQ, 2 substations, Investigations) | `name, address` | 2024-03-27 |
| `City_Facilities_view` | 211 polygons, `prime_usag` Firehouse 29, Police 21, Medic Station 11, Senior 17, Pool 24, Rec Center 6 | `name, prime_usag, address, HoursOfOperation` | 2026-01-14 |

- Recommendation: **show these, don't score them.** Every city parcel is within a few road miles of a firehouse, which is the ISO insurance-rating threshold, so fire proximity barely separates parcels. Response time follows zones, not straight-line distance. Proximity to a police station reads as a positive for some residents and a negative for others. Scoring it would inject a value judgment. Filter out the Academy, HQ, Training and Investigations rows before any "nearest station" display.

## 3. Schools: locations, quality proxies, boundaries

### 3a. Locations
| Source | URL | In city | Notes |
|---|---|---|---|
| **PDE Future Ready "School Fast Facts" 2024-25** | `https://futurereadypa.org/home/getdatafile?id=58` (xlsx, `Datafile` attachment) | **68** (53 regular, 12 charter, 3 special-ed) | Has `Latitude`, `Longitude`, `AUN`, `Schl`, `GradesOffered`, `Enrollment`, `EconomicallyDisadvantaged`, race %, `TitleISchool`, `ESSASchoolDesignation` (DFLT 43, ATSI 8, TSI 7, CSI 5, ACSI 5). **Best single file:** it has locations and demographics, and it joins to performance on `AUN`+`Schl` (PPS AUN = `102027451`). |
| NCES EDGE 2024-25 (admin data) | `https://nces.ed.gov/opengis/rest/services/K12_School_Locations/EDGE_ADMINDATA_PUBLICSCH_2425/MapServer/1` | **68** (PPS 56 + 12 charters) | `NCESSCH, LEA_NAME, SCH_NAME, CHARTER_TEXT, SCHOOL_LEVEL, TOTAL, LATCOD, LONCOD`. maxRecordCount 2000. `TOTFRL` is −1 (suppressed) for PA. Public domain |
| NCES private 2023-24 | `.../EDGE_GEOCODE_PRIVATESCH_2324/MapServer/0` | 63 in bbox | `PPIN, NAME, LAT, LON` |
| Allegheny County Schools | `https://services1.arcgis.com/vdNDkVykv9vEWFX4/arcgis/rest/services/Allegheny_County_Schools/FeatureServer/0` (WPRDC `allegheny-county-schools`) | **107** (53 public, 42 private, 12 charter) | `School_Name, School_Category_Description, Grade_List, Elementary, Secondary, Grade_K…Grade_12`. Edited 2026-03-27. **Easiest layer that includes private schools.** |

### 3b. Quality proxies (verified)
- **Future Ready PA Index performance 2024-25:** `https://futurereadypa.org/home/getdatafile?id=60` (`Datafile_20242025.xlsx`, 5.1 MB). Sheets: `State Assessment Measures` (228 cols), `School On Track Measures` (93), and `College Career Measures` (193). There are 56 PPS rows, and prior years go back to 2017-18 (ids 49, 44, 39, …).
  - Proficiency: `PercentProficientorAdvancedonELALiterature_AllStudent`, `…MathematicsAlgebra1_AllStudent`
  - **Growth (PVAAS):** `MeetingAnnualAcademicGrowthExpectations_PVAASELALiterature_AllStudent`, `…PVAASMathematicsAlgebra1_AllStudent`
  - On track: `PercentChronicAbsenteeism_AllStudent`, `PercentGrade3Reading_AllStudent`. Also `PercentGraduation4YearCohort_AllStudent`.
  - Gotchas: values are **strings** (`"46.2"`), with suppressed cells blank or text. Parse with SheetJS (`bun add xlsx`), because the server sends the file as `application/octet-stream`.
- **Measured bias, city schools (n=64):** correlation of % economically disadvantaged with ELA proficiency is **r = −0.60**, and with PVAAS ELA growth only **r = −0.19** (n=59). Proficiency largely tracks family income. Growth reflects much more of what the school itself adds.
- **Child Opportunity Index 3.0.** The official downloads (diversitydatakids.org, COI 3.0-2024 recommended) sit behind a **Cloudflare bot wall** that returns 403 to curl and WebFetch. They are free and need attribution; download manually in a browser if you want the 2024 release. **A working scripted mirror (third-party, CCAoA account, 2021 data year, 2020 tracts)**: `https://services7.arcgis.com/s3vGpGobX9nzlLH3/arcgis/rest/services/coi3_20_2021_shp3/FeatureServer/0`, where `geoid20 LIKE '42003%'` returns **392 tracts**. Fields: `c5_COI_met` (Very Low…Very High), `r_COI_met` (1–100 metro rank, **string**), `z_COI_*`, and the education domain `c5_ED_met`, `r_ED_met`, `r_ED_nat` (number). Other domains are `_HE_` (health/environment) and `_SE_` (social/economic).

### 3c. Boundaries
- PPS attendance and feeder zones: only the **NCES SABS 2015-16** copies hosted by WESA are machine-readable. Elementary is `https://services1.arcgis.com/HmwnYiJTBZ4UkySc/arcgis/rest/services/All%20Elem%20Zones%20with%20Data%202/FeatureServer/0` (28), middle is `.../All%20PGH%20Middle%20School%20Zones/FeatureServer/0` (17), and high is `.../All%20PGH%20High%20School%20Zones/FeatureServer/0` (6). Fields: `ncessch, schnam, gslo, gshi, openEnroll`. **They are 10 years old, and PPS has changed feeders since.** Label them "historical, 2015-16", or skip them. The city layer `SchoolDistricts2022` (9 polygons) holds **school board districts**, not attendance zones.

### 3d. Presenting school data responsibly (recommendation)
1. **Keep school quality out of the Access & Opportunity score and out of housing-type matching.** The score counts only *distance to any public K-8 school and to child care*. If we rank locations by test scores, the tool steers housing toward whiter, higher-income areas, and that repeats the historical steering pattern the Equity track is trying to measure.
2. On a school card, lead with **growth** (PVAAS), then chronic absenteeism, and show proficiency **next to** % economically disadvantaged with a one-line caveat: "Proficiency strongly reflects family income (r = −0.60 across city schools); growth reflects the school's contribution."
3. Use COI's education domain only at the **tract/neighborhood level**, labeled "neighborhood educational opportunity (COI 3.0)", as an **equity gap indicator**: low COI plus high child population means a place to invest. Never frame it as "a good place to live".
4. Don't show school letter grades or color-rank schools red to green. Use neutral sequential colors and link to futurereadypa.org.
5. Attendance zones don't guarantee enrollment: PPS has magnets, and 12 charters sit in the city. Say this in the UI.

## 4. Parks, greenways, trails, playgrounds, rec

| svc / resource | n | fields | edited |
|---|---|---|---|
| `${PGH}/PGHWebParks/FeatureServer/0` (WPRDC `parks1`) | **215** polygons | `updatepknm, final_cat, type_, acreage, divname` | 2025-05-06 |
| `${PGH}/PGHWebGreenways/FeatureServer/0` (WPRDC `greenways`) | 10 polygons | `name, acres, nhood` | 2024-04-10 |
| `${PGH}/Trails_PGH/FeatureServer/0` (WPRDC `pittsburgh-trails`, CSV `836b1c5d…`) | 1,278 segments | `trail_name, park, use_type, material, trail_rati, condition` | 2026-03-11 |
| WPRDC Playgrounds `47350364-44a8-4d15-b6e0-5f79ddff9367` | **125** points | `name, park, neighborhood, latitude, longitude` | 2022-12, CC-BY |
| WPRDC Playground equipment `e39ef76e-0a11-47c8-a86f-a37f55db7a2b` | 445 | `equipment_type, ada_accessible, safety_surface_type, lat/lon` | 2026-05-17 |
| `${PGH}/Citipark_Facilities/FeatureServer/{0,1,2}` | HAL (senior) centers **12**, Rec centers **11**, Pools **18** | `name, address, hours, days, program` | 2025-07 / 2022-06 / 2026-06 |
| WPRDC City Facilities `fbb50b02-2879-47cd-abea-ae697ec05170` | 412 rows (Pool 26, Senior 16, Rec Center 6, Activity 18, Shelter 62) | `type, inactive, latitude, longitude` | 2026-05-17, CC-BY |
| `${PGH}/TPL_ParkServe_ParkPriorityAreas/FeatureServer/0` | 188 | `Outside10M`, `ParkNeed`, `ParkPriori`, `LowIncPerc`, `POCPerc`, `HeatRank` | 2024-08-27 |
| County `Allegheny_County_Municipal_Parks_New/FeatureServer/0` (vdNDkVykv9vEWFX4) | 752 (399 in bbox) | `MUNICIPALITY, NAME, TYPE` | Covers suburban parks across the city line |

- **TPL ParkServe (live):** `https://server7.tplgis.org/arcgis7/rest/services/ParkServe/ParkServe_ProdNew/MapServer`. Layer 1 (`name='Pittsburgh city'`) gives `total_pop` 308,545, `sum_totpopsvca` 288,263, which is **93.4% of residents within a 10-minute walk of a park**, plus 243 parks, 4,800 acres and 13.6% parkland. Layer 3 holds the 10-minute-walk service-area polygons (498 in bbox). Use it for a headline stat. The city's `ParkPriorityAreas` (`Outside10M=1`) is a ready-made "park gap" equity layer. License: TPL terms (attribution, non-commercial display).
- Allegheny County Park Features: 628 points, **0 inside the city bbox**, so skip it.
- Gotcha: parks are polygons. For distance, use the **distance to the boundary**: densify each park ring to a vertex every 50 m, index the vertices, and take the nearest. Using the centroid overstates the distance to big parks like Frick or Schenley.

## 5. Local economy: food, retail, jobs

### 5a. Allegheny County Assets (the aggregator)
- WPRDC `allegheny-county-assets`, resource `5c7825d2-6814-40c7-aefe-3d0f3d6f22e7`. Dump: `https://data.wprdc.org/datastore/dump/5c7825d2-6814-40c7-aefe-3d0f3d6f22e7` (12.4 MB CSV, **32,001 rows**, one call). CC0, modified 2026-09-21. The underlying sources are mostly **2017–2020**; see resource `279da54f…` for the provenance of each type.
- Fields: `name, asset_type, street_address, zip_code, latitude, longitude, parcel_id, hours_of_operation, child_friendly, data_source_names, …`
- **In city (by polygon):** community_nonprofit_orgs 4,167 · bus_stops 2,883 · restaurants 1,534 · parks_and_facilities 575 · schools 349 · child_care_centers 198 · doctors_offices 198 · banks 125 · bike_share_stations 112 (**Healthy Ride-era, stale**) · pharmacies 96 · coffee_shops 94 · libraries 40 · health_centers 36 · food_banks 36 · supermarkets 33 · farmers_markets 25 · senior_centers 24 · rec_centers 21 · laundromats 17 · post_offices 6.
- Gotcha: `city` is the mailing city, which counts suburbs as "Pittsburgh" (e.g. 72 supermarkets by `city` vs 33 by polygon). **Always filter with point-in-polygon.**

### 5b. Food: ACHD geocoded food facilities (fresher)
- Resource `112a3821-334d-4f3f-ab40-4de1220b1a0a` ("Geocoded Food Facilities (as of 2025)"), dump `https://data.wprdc.org/datastore/dump/112a3821-334d-4f3f-ab40-4de1220b1a0a`: **32,245 rows** (6.6 MB), CC0. Latest `bus_st_date` is 2025-08-11.
- Fields: `facility_name, description, category_cd, bus_st_date, bus_cl_date, x (lon), y (lat), address`.
- Open (`bus_cl_date` empty) and in city: **7,444**. That includes Restaurant w/o Liquor 1,445, w/ Liquor 1,227, Chain Restaurant 937, Retail/Convenience 610, **Supermarket 32 + Chain Supermarket 36 = 68**, Seasonal/Farmers Market 143, and Bakery 82.
- **Gotcha: the closed dates are unreliable.** 21 "open" Rite Aid rows remain even though the chain shut its stores in 2025. Drop `/rite ?aid/i`, and treat the file as "licensed as of 2025".
- Farmers markets (current): `0d99978a-ccf6-4315-af5a-a95acec87a9f`, 69 county rows with `latitude, longitude, market_type`. CC0, 2026-08-01.

### 5c. OSM Overpass (shops, amenities)
```ts
const q = `[out:json][timeout:120];area["wikidata"="Q1342"]["boundary"="administrative"]->.a;
(nwr["shop"](area.a);nwr["amenity"~"^(pharmacy|clinic|doctors|hospital|library|school|childcare|community_centre|restaurant|cafe|fast_food|bar|bank|post_office)$"](area.a);
 nwr["leisure"~"^(park|playground)$"](area.a););out center tags;`;
const osm = await (await fetch("https://overpass-api.de/api/interpreter", { method: "POST",
  headers: { "User-Agent": "GroundworkPGH/0.1 (hackathon)" }, body: new URLSearchParams({ data: q }) })).json();
```
- Verified: 3,372 elements (1.2 MB, 17 s). **`shop=*` 983** (convenience 69, clothes 68, hairdresser 62, car_repair 60, supermarket 50), restaurant 524, fast_food 172, cafe 149, playground 174, school 174, library 77, pharmacy 25, fire_station 27. ODbL, so attribute "© OpenStreetMap contributors".
- **Gotcha:** without a `User-Agent` header, Overpass returns **406**. Pharmacy and clinic coverage is thin (25 pharmacies vs 96 in PALS), so use OSM for general retail density, not for health.

### 5d. USDA Food Access Research Atlas (2025 edition, live)
- `https://gisportal.ers.usda.gov/server/rest/services/FARA/FARA_2025_StraightLine/MapServer/5` ("LI and LA at 1/2 and 10 miles"). The `FARA_2025_DrivingDistance` layers are 12–19. Query `where=CensusTract20 LIKE '42003%'` returns **394 tracts**.
- Fields: `CensusTract20, SD_SRAM_LILATracts_halfAnd10` (**32 flagged** in Allegheny), `SD_SRAM_LATracts_half` (179), `SD_SRAM_LATracts1` (52), `LowIncomeTracts` (132), `PovertyRate, MedianFamilyIncome, TractHUNV` (households with no vehicle), `TractSNAP`. Public domain.
- Use it as an **equity flag** ("USDA low-income, low-access tract") and as a sanity check on our computed grocery distance.

### 5e. Jobs
- **LEHD LODES8 WAC 2023** (newest): `https://lehd.ces.census.gov/data/lodes/LODES8/pa/wac/pa_wac_S000_JT00_2023.csv.gz` (2.4 MB). Allegheny has 8,780 blocks with jobs and 728,045 jobs. **City: 2,543 blocks, 301,954 jobs** (low-wage `CE01` 35,740). RAC and OD files for 2023 exist too. Fields: `w_geocode` (15-digit block), `C000` (total), `CE01–03` (earnings bands), `CNS01–20` (NAICS sectors). `createdate` 20251202. Public domain.
- Crosswalk with block coordinates: `https://lehd.ces.census.gov/data/lodes/LODES8/pa/pa_xwalk.csv.gz` (5.8 MB). Columns `tabblk2020, trct, bgrp, stplc` (city = `4261000`), `blklatdd, blklondd`. **Use the lat/lon here to turn blocks into points**, with no need for a block shapefile.
```ts
const gz = new Uint8Array(await (await fetch(WAC_URL)).arrayBuffer());
const rows = new TextDecoder().decode(Bun.gunzipSync(gz)).split("\n").slice(1)
  .filter(l => l.startsWith("42003")).map(l => l.split(",")).map(c => ({ block: c[0], jobs: +c[1], lowWage: +c[5] }));
```
- **Access Across America: Transit 2024** (UMN Accessibility Observatory, precomputed): item `https://conservancy.umn.edu/items/cce7c4c8-8183-4990-b484-1f8199f0f9a6` (issued 2026-01-07). **License CC BY-NC 4.0**, which is fine for a non-commercial hackathon. PA zip: `https://conservancy.umn.edu/server/api/core/bitstreams/82f5db0b-5e6b-495b-9685-374219785c17/content` (23.8 MB). It holds `Pennsylvania_42_transit_block_group_2024.csv` (10.7 MB), `…_census_tract_…`, and `…_block_…` (287 MB, skip).
  - Columns: `Mode, Year, State FIPS, State, Summary Level, Census ID, Departure, LTS, Threshold, Weighted_average_total_jobs`. Departure is 7:00–8:59 AM and thresholds run 5–60 min in steps of 5.
  - Allegheny: **1,061 BGs**. The median BG reaches **4,902 jobs in 30 min** and the max reaches 252,446. BG `420031405001` (7501 Penn Ave) reaches 92,067 in 30 min and 252,277 in 45 min.
  - **This is the jobs-by-transit metric. Don't compute our own.** Parcel → BG via `"42003"+FIPS_TRACT+FIPS_BLOCKGROUP` from the parcel centroids. BGs missing from the file are null.
  - Gotchas: the item page 403s for WebFetch. Use the DSpace API (`/server/api/core/items/<id>/bundles` → `/bundles/<id>/bitstreams`) with a browser UA. Extract with `unzip -p` or `fflate`.
  - The EPA SLD `D5BR` (§7b in data-sources.md) is an older fallback. It measures jobs within 45 minutes by transit.
- **Fallback formula (if AAA fails):** a gravity sum over LODES block points, `J_p = Σ_b jobs_b · exp(−d_pb / 3 km)`, capped at 15 km. This measures "jobs nearby", **not** transit. Label it that way.

### 5f. Business districts
- `${PGH}/Business_District_Streets/FeatureServer/0`: **659** street segments (edited 2026-04-13) with `streetname, hood_left, hood_right`. Use it to show "on or near a neighborhood business district" (within 400 m of a segment). Combine with the commercial zoning codes already in the zoning layer (LNC, NDO, UNC, HC, GT-*). No machine-readable "Main Streets program" list was found, so don't claim one.
- Income: already covered (`Median_HH_Income_ACS_2020_2024_City`, Census Reporter B19013). See data-sources.md §1d and §4.

## 6. Libraries, child care, senior centers, pharmacies

| Category | Best source | In city | Notes |
|---|---|---|---|
| Libraries | WPRDC `14babf3f-4932-4828-8b49-3c9a03bae6d0` (CLP locations) | 19 | `Name, Address, SqFt, MoOpen…SuClose, Lat, Lon`. 2018 vintage, PDDL. The city's `PittsburghLibraryPoints` (16, OSM-derived, 2026-07-09) is the current check |
| **Child care** | PA DHS (data.pa.gov Socrata) `https://data.pa.gov/resource/ajn5-kaxt.json?facility_county=Allegheny&$limit=5000` | **216** (Center 122, Group home 24, Family home 24, Other 46) of 718 county | `provider_type, facility_name, capacity` ("N/A" strings), `star_level` (Keystone STARS: STAR 4 53, STAR 1 84, None 56), `pa_pre_k_counts, federal_head_start, subsidy_*`, `geocoded_column` (GeoJSON Point). **Rows updated 2026-09-25.** Public domain. The filter column is `facility_county`, not `county` |
| Senior centers | `${PGH}/Citipark_Facilities/FeatureServer/0` (HAL Centers) | 12 | `program, hours, days`. Add the Assets `senior_centers` (24, 2020) for non-city-run centers |
| Pharmacies | Assets `pharmacies` (PA PALS licensing) | 96 | Drop Rite Aid (26 rows, all closed). Cross-check with OSM `amenity=pharmacy` and ACHD chain CVS 13 / Walgreens 2 |

## 7. Walk and bike

| svc | n | fields | edited |
|---|---|---|---|
| `${PGH}/Pittsburgh_Bicycle_Facilities_WFL1/FeatureServer/9` (Existing) | **235** lines: Sharrow 57, Bike Lane 48, Shared Use Path 39, **Protected 32**, Neighborway 23, Buffered 21 | `street, fac_type, yearbuilt, Miles` | **2026-09-25** (current; prefer this) |
| same service, layer 10 (Proposed) | 191 | `type` | 2026-01 |
| `PGHBikeLanes` / WPRDC BikePGH shapefiles | 802 / 2019 | | **Stale**, skip |
| **POGOH GBFS** (live) | `https://pittsburgh.publicbikesystem.net/customer/gbfs/v2/en/station_information` | **60 stations** | `station_id, name, lat, lon, capacity, is_charging_station` |
| WPRDC POGOH station xlsx (May 2026) | `e90f2fca-dd24-47bc-b2ce-307a3579dab9` | | Backup for GBFS. Healthy Ride station CSVs stop at 2021 Q4 |
| `${PGH}/Sidewalks_2022_view/FeatureServer/6` | **121,428** segments | `ParcelID, RoadName, Length_ft` | 2025-01-10 |
| `${PGH}/Sidewalks_Public/FeatureServer/0` | 183,846 | `PIN, RoadName` | 2022-07 |
| `${PGH}/PittsburghSteps/FeatureServer/0` | 739 city steps | `steps, length, hood, street_nam` | 2021 |

- **Sidewalk trick:** `Sidewalks_2022_view.ParcelID` tags each sidewalk segment with its abutting parcel. That gives a per-parcel boolean `hasSidewalk` with no geometry work. Use a `returnGeometry=false` query, 121k rows, about 61 pages at 2,000 per page.
- POGOH snippet: `const { data } = await (await fetch(POGOH_GBFS)).json(); data.stations.map(s => [s.lon, s.lat, s.capacity])`.

---

## 8. Proximity computation in bun

**Index:** `bun add kdbush@4.1.0 geokdbush@2.1.0` (both ISC and ESM). Build one index per category.
```ts
import KDBush from "kdbush"; import { around, distance } from "geokdbush";
const idx = (pts: [number, number][]) => { const ix = new KDBush(pts.length); for (const [x, y] of pts) ix.add(x, y); ix.finish(); return ix; };
// nearest: around(ix, lon, lat, 1)[0] → index; distance(lon,lat,x,y) is great-circle **km**
// within r km: around(ix, lon, lat, Infinity, r)   (signature: ix, lng, lat, maxResults, maxDistanceKm, filter?)
```
**Benchmarked (Node 25, M-series):** 142,000 points × (nearest of 68 supermarkets + all 9,118 restaurants within 1.2 km + an exp-decay sum) took **3.4 s total**. The whole category set runs in under 30 s, so there is no need for workers.

**Straight-line vs network.** Pittsburgh's rivers, bridges, ravines and dead-end hillside streets make crow-fly distance flattering: a lot across a ravine can be 200 m away straight-line and 1.5 km on foot.
- Default (hackathon): straight-line distance divided by a **circuity factor of 1.3** (the literature range is 1.2–1.4, and Pittsburgh is likely at the high end). Walk speed is 80 m/min, so 15 min ≈ 1.2 km network ≈ **0.9 km straight-line**. State this assumption in the UI.
- Upgrade (about 2 h, all in bun, no server): pull the OSM walk network via Overpass (verified: **50,454 walkable ways** in the city, including 1,347 `highway=steps` ways). Build a graph, then run **one multi-source Dijkstra per category** with all POIs of that category as sources at distance 0. That gives every node its network distance to the nearest POI in a single pass. Snap parcels to their nearest node with kdbush. The cost is about 10 categories × one Dijkstra over ~250k nodes, which takes seconds. Use it to calibrate or replace the 1.3 factor.
- **Skip OSRM, Valhalla and r5 isochrones.** They need Docker and a PBF extract, and 142k origins is a batch job. Transit-to-jobs is already solved by AAA.

**Decay functions (per category c, d = straight-line km × 1.3):**
- *Need one* (grocery, pharmacy, clinic, school, child care, park, library/civic): `s = exp(−ln2 · d / h_c)`, where `h_c` is the half-credit distance. This scores 1 at the door, 0.5 at `h_c`, and about 0.1 at 3.3·h_c.
- *More is better* (retail/food services): `G = Σ_j exp(−d_j / 0.5)` over POIs within 1.5 km, then `s = 1 − exp(−G / G_ref)`, where `G_ref` is the citywide median G. The median parcel scores about 0.63, and the curve saturates in business districts.
- *Jobs*: `s = percentileRank(AAA jobs_30min of parcel's BG)` among city BGs.

## 9. Factor → metric → source → score

| Factor | Metric (per parcel, rolled up to hood by residential-parcel mean) | Source | Feeds |
|---|---|---|---|
| Grocery | network-adj. km to nearest supermarket; decay h=0.8 | ACHD food facilities (Supermarket + Chain Supermarket, 68) | **Access**, Equity |
| Food desert flag | tract LILA ½ & 10 mi | USDA FARA 2025 | **Equity**, Demand |
| Primary care | km to nearest FQHC/clinic; h=1.2 | HRSA sites (22) + Assets doctors | **Access**, Equity |
| Emergency care | km to nearest ED hospital; h=3 | City hospitals `emergency='yes'` (10) | Access (low wt) |
| Pharmacy | km to nearest; h=0.8 | Assets PALS minus Rite Aid, plus OSM | **Access** |
| School (any public K-8) | km to nearest; h=0.8 | Future Ready Fast Facts / NCES | **Access** (distance only) |
| School context | PVAAS growth, absenteeism, % econ-dis (card only) | Future Ready 2024-25 | display only |
| Neighborhood ed. opportunity | COI 3.0 `r_ED_met` by tract | COI mirror (2021) | **Equity** (gap indicator) |
| Child care | km to nearest licensed center/home; h=0.8; STAR 3–4 count within 1.5 km | PA DHS `ajn5-kaxt` | **Access**, Equity |
| Parks | km to nearest park boundary or playground; h=0.4 | PGHWebParks + playgrounds + county municipal parks | **Access**, Climate |
| Park gap | `Outside10M`, `ParkNeed` | TPL ParkServe priority areas | **Equity**, Climate |
| Civic | km to nearest library / rec / HAL center; h=1.0 | CLP, Citiparks | **Access** |
| Retail & services | decay-sum G of shops + restaurants | OSM shop=* + ACHD restaurants | **Access**, Demand |
| Business district | within 400 m of `Business_District_Streets` | City ArcGIS | Access, **Demand** |
| Jobs by transit | jobs reachable in 30 min, AM peak | Access Across America 2024 (BG) | **Access**, Equity, Demand |
| Local jobs | LODES 2023 C000 within 1.5 km | LODES WAC + xwalk | Demand |
| Bike | protected/buffered lane or trail within 400 m; POGOH within 500 m | Bike facilities layer 9, POGOH GBFS | **Access**, Climate |
| Sidewalk | parcel has abutting sidewalk | `Sidewalks_2022_view.ParcelID` | **Access**, Equity |
| Fire/EMS/police | distance (display only) | City ArcGIS | none (info) |

## 10. Proposed "Access & Opportunity" sub-score (0–100)

```
A(p) = 100 · Σ_c w_c · s_c(p) / Σ_c w_c
```
| c | w | s_c |
|---|---|---|
| Jobs by transit (AAA 30 min) | 20 | percentile among city BGs |
| Grocery | 15 | need-one, h = 0.8 km |
| Parks / playgrounds | 10 | need-one, h = 0.4 km |
| Primary care (FQHC/clinic) | 8 | need-one, h = 1.2 km |
| Public school (K-8) | 8 | need-one, h = 0.8 km |
| Retail & food services | 8 | more-is-better, G_ref = city median |
| Child care | 6 | need-one, h = 0.8 km |
| Pharmacy | 6 | need-one, h = 0.8 km |
| Civic (library / rec / senior) | 6 | need-one, h = 1.0 km |
| Sidewalk frontage | 5 | 1 / 0 |
| Bike (lane/trail or POGOH) | 5 | max of the two need-one scores, h = 0.4 km |
| Hospital ED | 3 | need-one, h = 3 km |

- **Don't double count** frequent transit. It already lives in the Transit score (`HighFrequencyTransit`). AAA jobs-by-transit measures opportunity, not stop proximity, so keep it here.
- **Neighborhood rollup:** average over residential parcels (`classdesc` RESIDENTIAL), not all parcels, so parks and industrial land don't inflate or deflate a hood.
- **Equity "access gap" (dashboard):** `gap = need × (1 − A/100)`, where `need` is a 0–1 rank of the hood's share of zero-car households (`NoVehicleRate`), children, and renters below 50% AMI. Show the top-gap hoods, alongside the USDA LILA flag and the TPL park-gap flag, as corroborating official designations.
- **Housing-type matching hook:** high A with a low MVA market type (C–F) suggests places for family-sized or affordable units that keep access without the displacement pressure of A/B markets. Cross-check DRR before recommending.
- Expose the weights in a JSON config (`data/access_weights.json`) and let the UI's "what matters to me" sliders re-weight client-side. Store per-category `s_c`, not just `A`.

## Down / blocked (don't build on these)
- HIFLD Open (all layers): removed.
- diversitydatakids.org (COI downloads and CKAN): Cloudflare 403 for scripts. Use the ArcGIS mirror, or a manual browser download.
- conservancy.umn.edu item HTML: 403 to WebFetch. The DSpace REST API works with a browser UA.
- Overpass without a User-Agent: 406.
- WPRDC Healthy Ride stations (stop 2021), BikePGH shapefiles (2019), `PGHBikeLanes` (2017), PPS locations CSV (2019): stale.
- NCES `TOTFRL`/`FRELCH` for PA: −1 (suppressed). Use Future Ready `EconomicallyDisadvantaged`.
