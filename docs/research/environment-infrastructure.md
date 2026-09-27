# Groundwork PGH: Environment, Infrastructure, Climate Risk and Safety Data (verified)

All endpoints were hit live on **2026-09-26** with curl (no keys unless noted). Counts, field names and sample values come from live responses. This doc **adds to** `data-sources.md` and doesn't repeat it: zoning, slope, landslide, undermined, FEMA flood, canopy, impervious, LST, MVA, DRR, ACS, transit, EJScreen and CDC PLACES are covered there. Snippets reuse `fetchAllGeoJSON()` (ArcGIS pager, §0) and `wprdcAll()` (CKAN pager, §2) from that doc.

Short names used below: `PGH` = `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services` (City of Pittsburgh). `PWSA` = `https://services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services` (Pittsburgh Water, public AGOL org).

**Main findings**
1. **Lead service line material is public at address level.** It is on PWSA's ArcGIS server (80,876 points) and also on WPRDC by parcel (582k rows).
2. **Water mains (pipe age and diameter) are *not* public.** Use fire hydrants as the proxy (9,771 city points; every hydrant sits on a main).
3. **Paper streets are not in the city centerline file.** It has only one `class='PAPER'` segment. Detect "infrastructure extension needed" geometrically, from how far a parcel is from an improved street.
4. **Tract-level PM2.5 exists:** EPA FAQSD 2022, 394 Allegheny tracts, annual means 8.40–9.48 µg/m³.
5. **The FEMA NRI website now redirects (403), but its ArcGIS tract service works** (Dec 2025 version).
6. **CNT H+T's license bars redistribution.** Use BTS LATCH (public domain) for household VMT instead.

---

## 1. Water, sewer and stormwater infrastructure

### 1a. PWSA water service line material (lead): address points ★
- `${PWSA}/PGH2O_Water_Service_Line_Material/FeatureServer/0`. Points, **80,876**, last edited 2026-09 (`lastEditDate 1788190234138`). This is the layer behind the public "PGH2O Lead Service Line Map" (webmap `1aae14d661b94ba0906aaba0d0f9108f`).
- Fields: `LocationID, Address, HouseNumber, Street, FinalReportedMaterialPublic, FinalReportedMaterialPrivate, FinalDescriptionPublic/Private, PublicSide_PrivateSide`.
- Public side: NonLead 66,954 · Unknown 8,414 · **Lead 5,469** · Abandoned_* 37 · Galvanized 2.
- Private side: NonLead 64,047 · **Lead 9,632** · Unknown 3,838 · **Galvanized 3,048**.
- Joint combinations: `Lead | Lead` 3,147; `NonLead | Lead` 3,009; `Unknown | Lead` 3,475.
- License: no license string. The item carries a PWSA accuracy disclaimer. Attribute "Pittsburgh Water".
- Snippet: `fetchAllGeoJSON(\`${PWSA}/PGH2O_Water_Service_Line_Material/FeatureServer/0\`, { outFields: "LocationID,Address,FinalReportedMaterialPublic,FinalReportedMaterialPrivate" })`. That is 81 pages at 1000 each (`maxRecordCount` is 1000, verified).
- Related: `LSLR_WO_Boundaries_Public_View` (327 replacement work-order polygons with `ConstructionStatus`, `LSLRStatus`, `Neighborhood`), `Lead_Service_Line_Replacement_Areas` (234), and `PWSA_Water_Service_Area` (1 polygon).

### 1b. WPRDC parcel-level lead line status (easier join)
- Package `lead-risk`, "Parcel-level Lead Hazard Data" (built for Parcels N'at). Resource `2ddfd798-b71a-4f78-bc17-8c54c6a30511`. CSV is 20 MB: `https://data.wprdc.org/dataset/445f20bf-f543-4575-bf78-004fba351d9c/resource/2ddfd798-b71a-4f78-bc17-8c54c6a30511/download/parcel_level_lead_info.csv`
- **582,184 rows** (county PINs). Modified 2025-09-23. **License: not specified.**
- Fields: `parcel_id, more_than_one_point, all_points_match_address, all_points_match_private, all_points_match_public, public_status, private_status`.
- Status counts. `public_status`: blank 380,959 · NOT LEAD 160,469 · UNKNOWN 31,479 · **LEAD 9,277**. `private_status`: NOT LEAD 114,340 · UNKNOWN 70,611 · **LEAD 16,243** · NO LINE 31.
- Second resource `39e8ae7e-5dca-421e-b87d-8cec34c91950`: tract elevated-blood-lead rate joined to each parcel, 2015–2020. The newer tract/neighborhood EBLL tables (2021–24) are in package `allegheny-county-elevated-blood-lead-level-rates` (CC0; neighborhood table `4e215bd5-…`, 89 rows).
- Gotcha: blank means the parcel is outside PWSA or unmatched. It does **not** mean "no lead".
- Use it as an **Equity/Infrastructure** flag ("lead line on this lot; replacement needed on redevelopment"). It is not a penalty.

### 1c. PWSA parcels with billed impervious area (stormwater fee)
- `${PWSA}/Parcels_view/FeatureServer/0`: **142,715** polygons, maxRecordCount 2000, edited 2026-09.
- Fields: `PIN, Impervious` (billed impervious sq ft), `ERUs` (equivalent residential units), `Tier` (1–3 for SFR), `BillClass` (`SFR`/`NSFR`), `UseDesc, Neighborho`.
- Sample: `0115S00088000000` has Impervious 3855, ERUs 2, Tier 3.
- This is the **actual stormwater-fee basis** per parcel. It is better than NLCD for "current runoff load". Pull it with `returnGeometry=false` and join on PIN.
- Also `Impervious_view` (431,597 digitized impervious polygons with `Year`, `Razed`). Very large, so skip it.

### 1d. Sewersheds and CSO performance (PWSA)
- `${PWSA}/Sewersheds/FeatureServer/0`: **485** polygons. `TYPE` is `C` (combined) or `S` (separate). Key fields: `CSO_SHED`, `Downstream` outfall, `MOD_BASIN`, **`TY_VOL`** (typical-year overflow volume, MG), **`TY_EVENTS`** (typical-year overflow events), `TY_DURATIO` (hours), `RANK`, `GITARGETSH`.
  - Sample: `O-25` has TY_VOL 12.4 MG, 22 events, 40 h.
  - This is richer than the city's `PGHWebSewersheds` (233, which only has type).
- `${PWSA}/Priority_Sewersheds/FeatureServer/0`: 45 GI-priority sheds.
- **Metric:** a parcel in a combined shed with high `TY_EVENTS` means new impervious area adds to overflows. Such parcels favor typologies with less footprint and require on-site detention.
- License: public AGOL, none stated. The WPRDC `combined-sewershed` mirror (182) is CC-BY but 2018.

### 1e. ALCOSAN outfalls and interceptors
- `https://services8.arcgis.com/vXrmg6iOl1pzNz4z/arcgis/rest/services/ALCOSAN_Outfalls_LOCKED/FeatureServer/2`: **336** outfall points, **290 within the city bbox**. `system_type`: **CB (combined) 274**, SS 59, SW 2, TS 1.
  - Fields: `asset_id` (e.g. `OF0250E11`), `user_text_11/12/13` (location text, municipality, street), `x,y` in PA South state plane ft.
  - Use `outSR=4326`; don't use `x,y` directly.
- `ALCOSAN_Collection_Network_Assets_LOCKED_Public`: layer 4 is **Pipes (8,889 interceptor lines)** with `pipe_type`, layer 2 is Outlets (384). Owner is ALCOSAN (`ACSA`). A public disclaimer is attached and there is no license.
- 3RWW municipal boundaries: `https://services6.arcgis.com/dMKWX9NPCcfmaZl3/arcgis/rest/services/alcosan_munis/FeatureServer/0` (84).

### 1f. Capital projects, repairs and green infrastructure
| Layer | n | notes |
|---|---|---|
| `${PWSA}/PWSA_Project_Locations/FeatureServer/0` Waterline installation | 434 lines | `PROJ_NAME, STATUS, START_DATE, END_DATE, WEBPAGE` |
| same `/1` Sewer rehabilitation | 1,424 | |
| same `/2` Green infrastructure | 80 | |
| `${PGH}/PWSA_2026_v5/FeatureServer/78` (paving-conflict list) | 1,625 | `UTILITY`: Water 1,386 · Sewer 229 · GI 10. `STATUS`: Planned 1,089 · In Progress 495 |
| `${PWSA}/Urgent_Water_Repair_Contract_Sites_2025_Public_View` (also `_2024`, `_2023`) | 74 / 66 / 42 pts | emergency water repairs, the **closest public "main break" points** |
| `${PWSA}/Water_Reliability_Plan_Projects_Public_View` | 11 | |
| `${PWSA}/Pgh2o_Pressure_Districts` | 17 | hilltop pressure zones |
| 3RWW GI inventory `https://services6.arcgis.com/dMKWX9NPCcfmaZl3/arcgis/rest/services/3RWW_Green_Infrastructure_Inventory_(Public)/FeatureServer/0` | 340 pts | `ImperviousAcresManaged, ReductionVolume, cost_total`. WPRDC mirror `3rww-green-infrastructure-inventory` (339, CC-BY, "archived") |
| WPRDC `implemented-stormwater-control-measures-accd-points` | 90 pts + 47 lines + 659 polys | ACCD, **CC-BY-SA**, 2020–2025 |
| WPRDC `pwsa-inlets` `1d88be51-…` | 29,477 | inlets (CC-BY, daily) |

### 1g. Water mains are not public, so use proxies
Confirmed: no main or pipe layer exists in the PWSA AGOL org (93 services checked), on WPRDC, or on the city server. The only pipe network layers found are ALCOSAN interceptors and borough sewers (Baldwin). Proxies:
- **Fire hydrants** `${PGH}/Fire_Hydrants_PGH/FeatureServer/0`: **9,771 points**, edited 2023-11. Fields: `HYDRANT_ID, StaticPressure, ResidualPressure, PitotPressure, hood, Lat, Long`. `distToNearestHydrant` ≈ distance to a water main. The PGH fire code wants hydrants within about 500 ft of structures. **> 150 m means likely main extension.** Pressure fields are sparse, so treat them as a bonus.
- **311 "Water Main Break"** (see §4d): 7,586 requests since 2015, but `geo_accuracy=APPROXIMATE` (lat/lon rounded to about 1 km). Use neighborhood counts only.

### 1h. Paper streets, unimproved streets and steps (the "extension needed" signal)
- `${PGH}/PavementPublic/FeatureServer/0` (the city centerline, 19,683 segments; WPRDC mirror in data-sources §2j). `class`: PAPER **1**, VACATED 3, INACTIVE 24, BARRICADED 29, PRIVATE 6, PARK ROAD 9. `paveclass`: Unsurfaced 6, Brick 615, Blockstone 294, Unknown 1,527. `owner` includes PRIVATE 470. Also has `paser_score` / `estimatedoci` (pavement condition) and `roadwidth`.
- **Paper streets are simply absent** from the centerline, since they exist only as right-of-way on plats. So compute: **distance from the parcel polygon to the nearest improved centerline**, excluding `class IN (PAPER, VACATED, INACTIVE, BARRICADED)` and `owner='PRIVATE'`. More than about 20 m (no frontage), combined with >150 m to a hydrant, flags "needs street and utility extension".
- `${PGH}/Noncompliant_IFC_Roads/FeatureServer/26`: **4,817 segments narrower than the International Fire Code minimum** (Alley 2,783 · Local 1,928). Fields `roadwidth, domi_class`. Fronting only such a road constrains multifamily (fire apparatus access).
- City steps: WPRDC `city-steps` `43f40ca4-…` (1,134 steps with lat/lon, `number_of_steps`, `overall_score`; CC-BY; 2022) and `${PGH}/PittsburghSteps` (739 lines). A parcel whose nearest public access is steps is walk-in only, so no vehicle or utility-truck access.

```ts
// Infrastructure access per parcel (bun add kdbush geokdbush @turf/turf)
import KDBush from "kdbush"; import * as geokdbush from "geokdbush";
const hyd = (await fetchAllGeoJSON(`${PGH}/Fire_Hydrants_PGH/FeatureServer/0`, { outFields: "HYDRANT_ID" })).features;
const idx = new KDBush(hyd.length); hyd.forEach(f => idx.add(...(f.geometry as any).coordinates)); idx.finish();
const nearestHydrantM = (lon: number, lat: number) => {
  const [i] = geokdbush.around(idx, lon, lat, 1);
  return geokdbush.distance(lon, lat, ...(hyd[i].geometry as any).coordinates) * 1000; // km → m
};
```

---

## 2. Air quality

| Source | Coverage | Verified facts | Verdict |
|---|---|---|---|
| **EPA FAQSD (CMAQ downscaler) daily PM2.5 by tract** `https://ofmpub.epa.gov/rsig/rsigserver?data/FAQSD/outputs/2022_pm25_daily_average.txt.gz` | every 2020 tract, 2022 (also 2019–2021; `_2010_census` variants) | **530 MB gz, took 8.5 min.** Columns `Date,FIPS,Longitude,Latitude,pm25_daily_average(ug/m3),…stderr`. 143,810 Allegheny rows = 394 tracts × 365. **Annual mean range 8.40–9.48 µg/m³ (median 9.10).** Public domain. | ★ **Ship.** Stream once and commit about 400 rows |
| EJScreen 2024 tract CSV (data-sources §8) | tract | Header verified: `PM25, DSLPM, RSEI_AIR, PTRAF, NO2` plus `P_*` percentiles. **No `CANCER`/`RESP` columns** (removed in v2.3) | use for traffic proximity (`PTRAF`), diesel PM and NO2 |
| ACHD monitors, WPRDC `allegheny-county-air-quality` | 28 site records, about 4 in the city | Hourly `36fb4629-…` has **12.66 M rows** (live to 2026-09-26). Daily AQI `4ab1e23f-…` has 87,488. CC0 | context and "today's AQI" only |
| EPA AirData annual bulk `https://aqs.epa.gov/aqsweb/airdata/annual_conc_by_monitor_2024.zip` (4 MB, no key) | monitors | 2024 PM2.5 (88101) annual means: **Liberty 8.4–9.0**, North Braddock 8.1–8.5, Lawrenceville 6.7–7.5, Parkway East near-road 6.9–7.3, Avalon 7.0, Clairton 7.0 | cite in the UI; there are too few points to interpolate |
| EPA AQS API / AirNow API / PurpleAir | — | AQS returned **401** without email+key. PurpleAir returned **403 `ApiKeyMissingError`**. AirNow needs a key | skip |
| AirToxScreen 2020 | block | only per-region block xlsx (Region 3 is **156 MB**) at `gaftp.epa.gov/rtrmodeling_public/AirToxScreen/2020/Cancer/BySource/`. The 2019 AGOL service returns no fields | skip for 36 h |
| WashU ACAG V5.NA.05.02 | 0.01° grid, 2000–2023 | Box share links only (`wustl.box.com/v/…`), manual download. V6.GL is on AWS Open Data | fallback if FAQSD fails |
| **WPRDC `toxic-release-inventory`** Facilities `d41759fa-…` | points | 223 facilities, 117 open with coordinates, **52 in the city bbox**. CC0. **Gotcha: `PREF_LONGITUDE` is stored positive (e.g. `79.965556`), so negate it.** `FAC_LONGITUDE` is DDMMSS | distance to nearest open TRI facility |
| WPRDC `emissions-inventory` `1ab77bb5-…` | points | ACHD permitted-source inventory: 16,768 rows with `facility, pollutant, tons_per_yr, hap, ghg, lat, lon`. 991 rows are `year=2021, current=1`. CC0 | tons of HAP within 1 km (better than TRI for tonnage) |
| Roads: `PavementPublic` `domi_class` (Principal Arterial 456, Minor Arterial 1,136), `${PGH}/Annual_Average_Daily_Truck_Traffic/FeatureServer/46` (545, `ADTT_CUR, TRK_PCT`), `${PGH}/State_Roads` (319) | lines | verified counts | distance to arterial or truck route |
| CDC PLACES asthma (`casthma_crudeprev`) | tract | data-sources §8 | Equity context |

```ts
// FAQSD annual PM2.5 by tract (stream a 530 MB gzip once)
import { createGunzip } from "zlib"; import { Readable } from "stream"; import readline from "readline";
const res = await fetch("https://ofmpub.epa.gov/rsig/rsigserver?data/FAQSD/outputs/2022_pm25_daily_average.txt.gz", { headers: { "User-Agent": "Mozilla/5.0" } });
const rl = readline.createInterface({ input: Readable.fromWeb(res.body as any).pipe(createGunzip()) });
const acc = new Map<string, [number, number]>();
for await (const line of rl) { const c = line.split(","); if (!c[1]?.startsWith("42003")) continue;
  const a = acc.get(c[1]) ?? [0, 0]; a[0] += +c[4]; a[1]++; acc.set(c[1], a); }
const pm25 = Object.fromEntries([...acc].map(([k, [s, n]]) => [k, +(s / n).toFixed(2)]));
```

---

## 3. CO₂: household transport, operational energy and embodied carbon

### 3a. Household VMT: BTS LATCH 2017 ★ (instead of CNT H+T)
- Socrata `https://data.bts.gov/resource/va72-z8hz.json?$where=starts_with(geocode,'42003')&$limit=500` returns **402 tracts** (2010 geography). **Public Domain.**
- Fields: `est_vmiles` (weekday household vehicle-miles per household), `est_vtrp`, `est_pmiles`, and `vmiles_{n}mem_{k}veh` by household size and vehicles. Allegheny range **5.32–64.57** VMT/HH/day.
- Transport CO₂ ≈ `est_vmiles × 365 × EPA kg CO₂/mile`. Cite the EPA GHG equivalencies factor in the UI.
- **CNT H+T Index:** the download needs registration plus reCAPTCHA (`htaindex.cnt.org/download/`), and there is no API. **Its license says users "may not reproduce… distribute… any Data".** Don't ship it in a public static app. At most, link to it.
- EPA SLD (data-sources §7b) has no VMT field. Use its D-variables only.

### 3b. Energy cost by building type: DOE LEAD 2022 ★ (sources the typology operating factor locally)
- `https://data.openei.org/files/6219/PA-2022-LEAD-data.zip`: **393 MB zip** holding tract and county CSVs for AMI, FPL, SMI and LLSI. **CC BY 4.0** (DOI 10.25984/2504170). ACS 2022 basis.
- `PA AMI Census Tracts 2022.csv` has **115,948 Allegheny rows across 383 tracts**. Columns: `FIP, AMI150, TEN-YBL6, TEN-BLD, TEN-HFL, UNITS, HINCP*UNITS, ELEP*UNITS, GASP*UNITS, FULP*UNITS`. Energy $ = Σ(ELEP+GASP+FULP)·UNITS. Burden = energy $ / Σ HINCP·UNITS.
- **Computed Allegheny average annual energy spend per unit, by building type** (owner / renter):

| TEN-BLD | owner $/yr | renter $/yr |
|---|---|---|
| 1 detached | **3,112** | 2,661 |
| 1 attached (rowhouse) | **2,420** | 2,055 |
| 2 unit | 2,372 | 1,763 |
| 3–4 unit | 2,077 | 1,431 |
| 5–9 unit | 1,085 | 1,089 |
| 20–49 unit | 903 | 729 |
| 50+ unit | 766 | 746 |

  Use this for the typology operational factor: per unit, multifamily uses about **¼ of detached**. Tract-level burden is also available for the Equity score.
- Gotcha: the file is at household-cohort grain, so aggregate before shipping. Unzip with `unzip -p … | awk -F, '$2 ~ /^42003/'` (about 11 s).

### 3c. Embodied carbon per typology (kgCO₂e/m² GFA)
| Typology | Value | Source | Confidence |
|---|---|---|---|
| Single-family (wood frame) | **39–121** (varies with foundation type, climate zone and tool) | Jungclaus, Grant, Torres, Arehart, Srubar, "Embodied carbon benchmarks of single-family residential buildings in the United States", *Sustainable Cities and Society* 2024, doi:10.1016/j.scs.2024.105975 (DOI verified via Crossref; range from the abstract) | medium |
| Multifamily | **~390** typical (50th percentile), structure + enclosure (+interiors), stages A–C | CLF *Embodied Carbon Benchmark Report* (Apr 2025, 292 buildings, **CC BY-SA 4.0**), https://carbonleadershipforum.org/the-embodied-carbon-benchmark-report/ | **number from secondary summaries; confirm in the PDF or the Benchmark Explorer before demo** |

- Scopes differ, so don't compare the raw numbers. Show **per-unit** values instead: ECI × typical GFA per unit (e.g. 150 m² detached vs 75 m² apartment). Say plainly that it is an order-of-magnitude estimate.
- The Pittsburgh building benchmarking ordinance data is **not on WPRDC** (search returned 0). The only energy datasets there are municipal buildings (`allegheny-county-energy-and-water-use`, 12,454 rows, CC0), which don't help here.

---

## 4. Weather and climate risk

### 4a. FEMA National Risk Index, tracts ★
- `https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0`. `where=STCOFIPS='42003'` returns **394** tracts. **`NRI_VER = "December 2025"`**. 469 fields, maxRecordCount 2000. The attribute-only pull is 93 KB. Public domain.
- **`hazards.fema.gov/nri/*` now 403-redirects to FEMA RAPT.** The CSV download pages are gone, but the ArcGIS service is live.
- Fields: `RISK_SCORE/RATNG`, `EAL_VALT` ($ expected annual loss), `SOVI_SCORE`, `RESL_SCORE`, plus per-hazard `{HAZ}_RISKS` (score), `_RISKR` (rating) and `_EALT`, where HAZ ∈ `HWAV` heat wave, `LNDS` landslide, **`IFLD` inland flooding (replaces the old `RFLD`; requesting `RFLD_*` errors with "outFields invalid")**, `WNTW` winter weather, `CWAV` cold wave, `STRM`, `TRND`.
- Samples: tract 562700 (riverfront) has IFLD_RISKS **93.5 "Relatively High"** and EAL $1.63 M. Tract 140500 has IFLD 11.7 "Very Low".
- **Gotchas:** `RESL_SCORE` is county-level (identical for all tracts). `LNDS_EALT` is about $0.04–0.09, so NRI badly understates Pittsburgh landslides; keep the city `LandslideProne` and Slope25 layers. HWAV varies little.

```ts
const nri = await fetchAllGeoJSON("https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0",
  { where: "STCOFIPS='42003'", outFields: "TRACTFIPS,RISK_SCORE,EAL_VALT,IFLD_RISKS,IFLD_EALT,HWAV_RISKS,LNDS_RISKS,WNTW_RISKS,SOVI_SCORE", pageSize: 2000, precision: 5 });
```

### 4b. Heat and precipitation projections: CMRA (LOCA2)
- `https://services3.arcgis.com/0Fs3HcaFfvzXvm7w/arcgis/rest/services/Climate_Mapping_Resilience_and_Adaptation_(CMRA)_Climate_and_Coastal_Inundation_Projections/FeatureServer/1` (Tracts, 402 in Allegheny). **CC BY 4.0.**
- Fields follow `{HISTORIC|RCP45|RCP85}{EARLY|MID|LATE}_{MIN|MEAN|MAX}_{TMAX90F|TMAX95F|TMAX100F|PR2IN|PRMAX1DAY|CDD|HDD|CONSECDD…}`.
- Pittsburgh days above 90 °F: **historic 9.3 → RCP4.5 mid-century 34.8 → RCP8.5 mid 44.1 → RCP8.5 late 79.4**.
- **Gotcha:** `TMAX90F` is identical across city tracts (coarse grid). Use it as a **city-wide headline**, not as a differentiator. Differentiate heat by Landsat LST instead (data-sources §6c).
- First Street / ClimateCheck: paid, not used.

### 4c. NOAA 1991–2020 normals (Pittsburgh Intl, USW00094823), no key
`https://www.ncei.noaa.gov/access/services/data/v1?dataset=normals-annualseasonal-1991-2020&stations=USW00094823&format=json&dataTypes=ANN-TMAX-NORMAL,ANN-PRCP-NORMAL,ANN-TMAX-AVGNDS-GRTH090,ANN-PRCP-AVGNDS-GE100HI,ANN-HTDD-NORMAL,ANN-CLDD-NORMAL`
returns TMAX 61.1 °F, precipitation 39.61 in, **10.1 days ≥90 °F**, 6.3 days ≥1 in rain, HDD 5,572, CDD 797. Daily summaries are available through the same API (`dataset=daily-summaries`).

### 4d. 311 as observed-hazard data (WPRDC `pittsburgh-311-data`, resource `5202679a-d243-402e-b82a-63189995a942`, **971,989 rows**, daily, CC-BY)
Fields: `subject, created_date_et, neighborhood, census_tract, latitude, longitude, geo_accuracy`. Filter with `filters={"subject":"…"}`. The codebook (`2de7cb02-…`) lists each subject's geo accuracy.

| subject | n (2015–) | geo | use |
|---|---|---|---|
| Catch Basins, Grates, and Sewers | 12,151 | EXACT | drainage stress |
| Sinkhole | 7,668 | EXACT | infrastructure failure |
| Water Main Break | 7,586 | **APPROX** | hood-level main-break density |
| Drainage – Street | 4,010 | EXACT | |
| Landslide | 1,182 | EXACT | **real landslide events** (NRI misses these) |
| Water Runoff in ROW | 671 | EXACT | |
| Flooding | 278 | EXACT | since 2018; basement or surface flooding |
| Vacant Buildings | 6,666 | EXACT | condition (§5) |
| Illegal Dumping | 8,474 | APPROX | condition (§5) |

- **CDC Heat & Health Tracker** (`ephtracking.cdc.gov/Applications/heatTracker/`, 200) is county-level, so context only.
- **Pittsburgh Climate Action Plan 3.0** targets GHG **−50 % by 2030 and −80 % by 2050 vs 2003**, plus 50 % energy and water reduction by 2030 ([CAP 3.0 PDF](https://s3.us-west-2.amazonaws.com/hdp.us.prod.app.pgh-engage.files/6415/9726/1598/7101_Pittsburgh_Climate_Action_Plan_3.0.pdf); [city page](https://www.pittsburghpa.gov/Business-Development/City-Planning/Sustainability/Climate-Action-Plan)). Use these to frame the Climate score.

---

## 5. Safety and neighborhood condition

| Source | n / freshness | fields | recommendation |
|---|---|---|---|
| **City crashes** `${PGH}/CrashData_17_21/FeatureServer/0` (layer name "CrashData_17_25") | **34,547 pts, 2017–2025** (2025: 3,297) | `CRASH_YEAR, MAX_SEVERI` (Fatal 178 · Suspected Serious 1,023 …), `PED_COUNT, BICYCLE, PEDESTRIAN, hood, domi_class` | ★ KSI (killed or seriously injured) crashes per road-km, by neighborhood |
| `${PGH}/2026_HIN_Crashes__2021_2025_/FeatureServer/44` | 5,892 | PennDOT flags | |
| High Injury Network, WPRDC `high-injury-network` / `${PGH}/High_Injury_Network` | 111 segments | `Count_FatalCrash, Count_PedestrianCrash, Traffic_Calming…` | ★ distance to HIN |
| County crashes, WPRDC `2c13021f-…` | 248,810 rows, through 2024 | full PennDOT schema, `DEC_LAT/LONG`. CC0 | only if you need the suburbs |
| **Condemned / dead-end properties**, WPRDC `condemned-properties` `0a963f26-…` | **3,569**, updated daily | `parcel_id, property_type, latest_inspection_result, create_date, lat/lon, neighborhood`. CC-BY | ★ condition. Also an **opportunity** flag (redevelopable lot) |
| PLI/DOMI/ES violations `70c06278-…` | 643,994 | `parcel_id, violation_description, investigation_date, status`. CC0 | open violations per 100 parcels, by hood |
| Fire incidents `8d76ac6b-…` | 10,730, **last updated 2025-09** | `incident_type, type_description, alarms, census_tract` | building-fire rate by tract (use sparingly) |
| Police blotter, WPRDC `police-incident-blotter` | **datastore has 1 row; broken since 2025-10**. The city AGOL copy has 3,147 rows from 2023 | — | **do not use** |
| Arrests, WPRDC `arrest-data` | 66,485, archived 2025-04 | includes **AGE, GENDER, RACE** | **do not use** |

### Responsible use
1. **No crime or arrest data in any score.** Arrest data measures where policing happens, not where harm happens. Pittsburgh's blotter is also stale (broken since 2025-10). Crime layers correlate closely with the HOLC-redlined, majority-Black neighborhoods (Hill District, Homewood, Beltzhoover). If a "where to build" score used them, it would steer investment away from the places Track 3's equity goal is meant to serve.
2. **Measure physical, fixable conditions instead:** traffic KSI crashes and the HIN (a street-design problem the city is funding), condemned and vacant buildings, and open code violations. Show these as "needs investment" signals, not as deterrents.
3. **Neighborhood level only.** Never show a safety or condition value at parcel level, except the parcel's *own* condemned or lead status, and label that as a remediation need. Suppress neighborhoods with fewer than 10 events. Always normalize (per road-km, per 100 parcels) and show the multi-year trend.
4. **Condition must never lower the Equity or "build here" score of a disinvested neighborhood without saying why.** Apply it as a *cost/readiness* modifier with a visible note, e.g. "3 condemned structures on block: demolition budget needed; also city acquisition opportunity". It is fine to *raise* priority for public subsidy there.
5. Any safety metric gets an info tooltip covering its source, date, what it measures and what it doesn't.

---

## 6. Noise, rail and highway proximity

- **BTS National Transportation Noise Map 2022** (released May 2026): `https://tiles.arcgis.com/tiles/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Noise_2022_CONUS_aviation_rail_road/MapServer`. Separate `_road`, `_rail` and `_aviation` services also exist.
  - It is **TilesOnly, PNG8, LODs 0–12** (z12 is 38 m/px). There is no identify or export.
  - **Values come from the palette.** Legend colors, verified by decoding: `(255,193,7)` 45–49.9 dB · `(255,128,0)` 50–54.9 · `(255,0,0)` 55–59.9 · `(255,51,153)` 60–69.9 · `(163,0,204)` 70–79.9 · `(82,0,204)` 80–89.9 · `(0,0,255)` ≥90 · transparent is <45.
  - Tile `/tile/12/1544/1137` (Downtown) returned 200 with exactly those colors.
  - BTS says it is "not for individual locations": it is a screening proxy, 24-h LAeq. Public domain (USDOT).
  - About 12 tiles cover the city.
- The Esri `USA_Transportation_Noise___Rail_Road_and_Aviation_2020` ImageServer is also TilesOnly (identify returns 400). Skip it.
- Rail: `${PGH}/Railroads/FeatureServer/0` (1,080 lines; `descriptio`: "Rail Lines, In Use" 458, "PAT T Line" 107, "Rail Lines, Old" 40) and `Rail_Buffer_HalfMile` (1 polygon). Highways: `domi_class='Principal Arterial'` and `State_Roads`, as in §2.

```ts
// Noise dB class at a lon/lat from NTAD z12 tiles (bun add pngjs)
import { PNG } from "pngjs";
const NOISE = "https://tiles.arcgis.com/tiles/xOi1kZaI0eWDREZv/arcgis/rest/services/NTAD_Noise_2022_CONUS_aviation_rail_road/MapServer/tile/12";
const PAL: Record<string, number> = { "255,193,7": 47.5, "255,128,0": 52.5, "255,0,0": 57.5, "255,51,153": 65, "163,0,204": 75, "82,0,204": 85, "0,0,255": 90 };
const cache = new Map<string, PNG>();
export async function noiseDb(lon: number, lat: number) {
  const n = 2 ** 12, fx = (lon + 180) / 360 * n, fy = (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * n;
  const key = `${Math.floor(fy)}/${Math.floor(fx)}`;
  if (!cache.has(key)) cache.set(key, PNG.sync.read(Buffer.from(await (await fetch(`${NOISE}/${key}`)).arrayBuffer())));
  const png = cache.get(key)!, px = Math.floor((fx % 1) * 256), py = Math.floor((fy % 1) * 256), i = (py * 256 + px) * 4;
  return png.data[i + 3] === 0 ? 40 : PAL[`${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`] ?? null; // 40 = "<45 dB"
}
```

---

## 7. Factor → metric → source → score

| Factor | Metric (grain) | Source | Score |
|---|---|---|---|
| Lead service line | public or private side lead / galvanized / unknown (parcel) | PWSA service line layer (§1a) or WPRDC `lead-risk` (§1b) | Infrastructure, Equity |
| Water main access | m to nearest hydrant (parcel) | `Fire_Hydrants_PGH` (§1g) | Infrastructure |
| Street access / extension | m to nearest improved centerline; fronts IFC-noncompliant road; steps-only access (parcel) | `PavementPublic`, `Noncompliant_IFC_Roads`, steps (§1h) | Infrastructure |
| Sewer capacity | combined vs separate; typical-year CSO events and MG of sewershed (parcel ← polygon) | PWSA `Sewersheds` (§1d) | Infrastructure, Climate |
| Stormwater load | billed impervious ft², ERUs (parcel) | PWSA `Parcels_view` (§1c) | Climate |
| Planned investment | PWSA water/sewer project within 100 m (parcel) | `PWSA_Project_Locations`, `PWSA_2026_v5` (§1f) | Infrastructure (+ readiness) |
| Water-system failures | 311 main breaks, sinkholes, catch-basin requests per km² (hood) | 311 (§4d) | Infrastructure |
| PM2.5 | 2022 annual mean µg/m³ (tract) | EPA FAQSD (§2) | Climate/Health, Equity |
| Traffic and diesel exposure | `PTRAF`, `DSLPM`, `NO2` percentiles (tract); m to arterial or truck route (parcel) | EJScreen tract CSV, `PavementPublic`, AADTT (§2) | Climate/Health |
| Industrial sources | m to nearest open TRI facility; HAP tons/yr within 1 km (parcel) | WPRDC TRI, ACHD emissions inventory (§2) | Climate/Health, Equity |
| Transport CO₂ | household VMT/day × EPA factor (tract) | BTS LATCH (§3a) | Climate |
| Operating energy by typology | $/unit/yr by building type (county) and tract energy burden | DOE LEAD 2022 (§3b) | Climate, Equity |
| Embodied carbon by typology | kgCO₂e/m² × m²/unit | Jungclaus 2024; CLF 2025 (§3c) | Climate |
| Flood / heat / winter risk | NRI `IFLD_RISKS`, `HWAV_RISKS`, `EAL_VALT` (tract) | FEMA NRI (§4a) | Climate |
| Future heat | days >90 °F historic vs 2050 (city headline) | CMRA (§4b), NOAA normals (§4c) | Climate (context) |
| Observed landslides and flooding | 311 landslide and flooding requests per km² (hood) | 311 (§4d) | Climate |
| Traffic safety | KSI crashes per road-km; m to High Injury Network (hood / parcel) | city crash layer, HIN (§5) | Safety |
| Building condition | condemned + vacant-building requests + open violations per 100 parcels (hood) | WPRDC condemned, PLI violations, 311 (§5) | Safety (as readiness), Equity |
| Noise | modeled dB class (parcel) | BTS NTAD 2022 tiles (§6) | Climate/Health |
| Rail proximity | m to in-use rail (parcel) | `Railroads` (§6) | Climate/Health |

---

## 8. What to ship in 36 h (about 8 metrics) vs later

**Ship now** (all are one fetch plus a join; each takes under 10 min to build):
1. **Lead service line flag** (WPRDC `lead-risk` CSV, join on PIN). The demo line: "this lot has a lead line; replacement comes with redevelopment."
2. **Distance to nearest hydrant** plus **distance to improved street** (the infrastructure-extension proxy, which catches paper streets).
3. **Sewershed CSO events** (`TY_EVENTS`, combined vs separate) from PWSA `Sewersheds`.
4. **PM2.5 tract annual mean** (FAQSD 2022). Precompute it once and commit the 400-row JSON; don't re-download 530 MB in CI.
5. **FEMA NRI inland-flood and heat-wave scores** by tract. The city-wide CMRA "9 → 35 days >90 °F by 2050" is a headline, not a score.
6. **Typology carbon card:** LEAD $/unit by building type (local and sourced) plus embodied ranges, plus LATCH household VMT by tract. This is what makes typology tradeoffs transparent.
7. **Traffic safety:** KSI crashes per road-km by neighborhood and a distance-to-HIN flag.
8. **Building condition:** condemned + 311 vacant-building + open-violation rate by neighborhood, used as a readiness modifier per the responsible-use rules above.

**Later:** noise tiles (the recipe works, but it adds about 12 tile fetches and a pngjs dependency), TRI and ACHD emissions proximity, PWSA project proximity, billed impervious from `Parcels_view`, 311 landslide and sinkhole densities, ALCOSAN outfalls map layer, IFC-noncompliant frontage, EJScreen traffic and diesel percentiles, CDC PLACES asthma.

**Don't use:** police blotter or arrests (stale, and biased as explained above), CNT H+T (license), AQS/AirNow/PurpleAir APIs (keys), AirToxScreen block files (156 MB for little gain), and the NRI landslide score (understates local risk).

## Down / changed (2026-09-26)
- `hazards.fema.gov/nri/*` returns 403 and redirects to RAPT. Use the ArcGIS tract service.
- WPRDC `police-incident-blotter` datastore holds 1 row (last resource update 2025-10-09).
- `transportation.gov` and `bts.gov` noise pages return 403 to curl. The tile services work.
- The CDC Heat Tracker path is case-sensitive: `/Applications/heatTracker/` works and `/HeatTracker/` gives 404.
- The EPA AirToxScreen 2019 AGOL service returns no layer fields.
