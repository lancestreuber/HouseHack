# Data sources (Pittsburgh / Allegheny County)

Probed 2026-09-26. Markers: **[V]** = queried and returned data; **[S]** = from a search snippet; **[U]** = not verified.

`C` = `https://services1.arcgis.com/YZCmUqbcsUpOKfj7/arcgis/rest/services` (City of Pittsburgh ArcGIS Online org, ~977 services).

## Access summary

**No account needed:** everything below except the following.

**Needs a free account or key:**

| Source | Status |
|---|---|
| Census API (ACS) | Keyless calls now redirect to "Missing Key" [V] |
| HUD USER API | Returns "Unauthenticated" without a token [V]. Income-limit xlsx files are an alternative; curl got an empty HTTP 202, so these may need a browser. |
| LLM provider API key | Needed for any runtime LLM features |

**Paid, avoided:** Regrid, Zoneomics, Google geocoding.

**Browser-only:** eCode360 (zoning code text) returns a Cloudflare 403 to curl and WebFetch but loads in a real browser [V]. pittsburghpa.gov PDFs sometimes return 403 to curl (Akamai).

## Parcel core

| Data | Endpoint | Key | Notes |
|---|---|---|---|
| Assessments [V] | WPRDC resource `65855e14-549e-4992-b5be-d629afc676fa` | `PARID` (16 chars, no dashes) | 585k rows, TAXYEAR 2026. No owner name. Use `datastore_search` with URL-encoded `filters`. **`datastore_search_sql` with WHERE returns 403.** Bulk CSV is 435 MB. |
| Parcel polygons [V] | `https://gisdata.alleghenycounty.us/arcgis/rest/services/OPENDATA/Parcels/MapServer/0` | `PIN` | Query by PIN or by point. Max 1,000 records per request. Bulk zip is 115 MB (WPRDC `allegheny-county-parcel-boundaries1`). The PASDA mirror is down. |
| Parcel centroids + geo IDs [V] | WPRDC `3fab7152-3f11-4788-8372-4c33f86ea813` | PIN | Tract and block-group GEOIDs, neighborhood |
| Owner name [V] | `https://realestate.alleghenycounty.us/GeneralInfo?ID=<PARID>` | | Plain HTML with no captcha. Scrape gently and cache. Terms not reviewed. |
| Address → parcel [V] | Census geocoder `onelineaddress` → county parcels point query | | Both free |
| Sales [V] | WPRDC `5bbe6c55-bce6-4edb-9d04-68edeb6bf7b1` | PARID | 504k rows. `SALECODE='0'` means valid. **`16` = "building not yet assessed"**, meaning a new-construction sale (6,657 rows). |
| Residential lot dimensions [V] | `C/Parcels_Exp_02052025_Residential_Lot_Dimensions/FeatureServer/0` | | 105k parcels with Parcel_Width, Parcel_Len, zone_short (2025) |
| ETHOS Lot Suitability [V] | `C/ETHOS_Lot_Suitability/FeatureServer/0` | pin | 142,806 parcels (Dec 2024). The City's own vacant-lot reuse model: SteepSlope fraction, Vacant, Housing suitability, Best_Suit. Prior art and a possible input. |

## Title, ownership, distress (WPRDC, all [V])

| Dataset | Resource | Parcel key |
|---|---|---|
| Tax liens | 65d0d259-3e58-49d3-bebb-80dc75f61245 | pin |
| County delinquency | 96e9d6b2-3e1a-4a0c-8ef6-23a049c263d8 | parcel_id |
| City delinquency | ed0d1550-c300-4114-865c-82dc7c23235b | pin |
| City-owned properties | e1dcee82-9179-4306-8167-5891915b62a7 | pin |
| Condemned / dead-end | 0a963f26-eb4b-4325-bbbc-3ddf6a871410 | parcel_id |
| PLI/DOMI/ES violations | 70c06278-92c5-4040-ab28-17671866f81c | parcel_id |
| Conservatorship filings | fd64c179-b5af-4263-9275-fb581705d878 | pin |

**City-owned vacant parcels [V]:** `C/ParcelsPublicCityVacant/FeatureServer/0` has 5,786 parcels (edited 2026-09-01).
- `current_status`: Available for Sale 3,260 / Hold for Study 1,836 / Sale Pending 489.
- `inventory_type`: Public Sale 2,480 / URA Transfer 1,419 / Land Bank Transfer 117.

Pittsburgh Land Bank: no API found.

## Zoning [V]
- **Base districts:** `C/PGHWebZoning/FeatureServer/0`. Field `zon_new` (e.g. `R1D-M`, `RM-H`, `H`, `LNC`). The `municode` field links to eCode360. WPRDC `zoning` has a 3.5 MB GeoJSON.
- **Overlays:**
  - `C/PGHWebZoningOverlays/0` is a combined layer whose values are free text and need regex parsing.
  - Single-purpose layers: `InclusionaryHousingOverlayDistrict`, `Riverfront_IPOD`, `PGHWebCHDHistoricDistricts` (21), `HeightReductionZone_ZoningOverlay`, `PGHWebParkingReductionOverlay`, `PGHWebRCO` (45 RCOs).
- **Code text:** hand-transcribed tables are in [zoning-code/](zoning-code/).
- **Outside the city:** no countywide zoning layer. The PRT registry lists some municipal layers; these returned records:

| Municipality | Layer |
|---|---|
| Penn Hills | `services5.arcgis.com/DllnbBENKfts6TQD/.../Zoning/FeatureServer/1` |
| Bethel Park | `services7.../ptmAvweveinujaUS/.../Public_View___Zoning_and_Parcels_and_Addresses/4` |
| Monroeville | `services9.../8FOQ9nDvQJjqML1o/.../Monroeville_Zoning_view/0` |
| Mt Lebanon | `services8.../4sXEsxQJTWBlSKA1/.../BasemapFeatureService_ReadOnl/9` |
| Whitehall | `services8.../A3O49kUB98Moka4Y/.../MasterFeatureService_ReadOnlyView/24` |
| Dormont | `services6.../pIIoxuHIRX225O2N/.../MasterFeatureService_PublicView/7` |
| Moon | `services8.../g8yM34Z7IOCI3L3m/.../Zoning/2` |
| McCandless | `services1.../q8sarOko6mCDwiGm/.../McCandless_Zoning/1` |
| Franklin Park | `services9.../Dk5rlrQSwBJZ7C1H/.../Zoning/0` |

  Each municipality has its own code text, which is not transcribed.
- **National Zoning Atlas:** mapping the Pittsburgh metro, with a report due fall 2026. Downloadable data is [U].

## Environmental and site constraints [V]
| Layer | Endpoint | Notes |
|---|---|---|
| Landslide-prone | `C/PGHWebLandslideProne/FeatureServer/0` | The county version (7,242 polygons, with REDBED/CREEP/etc. flags) is at `services1.arcgis.com/vdNDkVykv9vEWFX4/.../Landslide_Prone_Areas/FeatureServer/0` |
| Slope ≥25% | `C/PGHWebSlope25/FeatureServer/0` | Polygons have holes. **Intersect with the parcel polygon, not its centroid.** |
| Undermined | `C/PGHWebUndermined/FeatureServer/0` | `C/Parcels_On_Mines` has 25,821 pre-joined parcels |
| Flood | FEMA NFHL `https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28` | FLD_ZONE, SFHA_TF. The city also has `FEMA_2026` (description only read). |
| PA DEP eMapPA | `https://gis.dep.pa.gov/depgisprd/rest/services/emappa/eMapPA_External_Extraction/MapServer/{id}` | Useful layer ids: 17–22 Act 2 media; 118/119 storage tanks; 47 mined area; 50/51 abandoned mine land; 54/58/62/63 wells. **DEP needs JSON geometry with a spatialReference.** |
| Act 2 / AUL | `emappa/eMapPA_External/MapServer/31` (soil) and `/29` (groundwater); `AUL_NEW/AUL/MapServer/0` | |
| EPA | `https://geopub.epa.gov/arcgis/rest/services/EMEF/efpoints/MapServer` | Layer 0 Superfund, 5 Brownfields |
| Wetlands | `https://fwspublicservices.wim.usgs.gov/wetlandsmapservice/rest/services/Wetlands/MapServer/0` | |
| Soils | USDA SDA POST `https://SDMDataAccess.sc.egov.usda.gov/Tabular/post.rest` | |
| **3DEP 1 m elevation** | `https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer` | See below |

**3DEP slope classes:** `computeStatisticsHistograms` over the parcel polygon, with the polygon in `outSR=26917` (UTM; Web Mercator distorts slope) and a Slope→Remap rendering rule. This gives m² in the <15 / 15–25 / 25–40 / >40% classes.
- Tested once: 60% of the parcel was over 25% slope.
- About 1 in 4 calls failed, so retry.
- A citywide run of about 140k calls is untested and probably too slow. Fall back to ETHOS `SteepSlope`.

## Infrastructure
- **Sewer lines [V]:** county AGOL `Pittsburgh_Sewers/FeatureServer/0`. **2012 export, dated.**
- **Sewersheds [V]:** `C/PGHWebSewersheds` (cso_shed, sewertype). The PWSA `Sewersheds` layer has CSO volume/events/RANK, a proxy for sewer stress.
- **Lead service lines [V]:** `services5.arcgis.com/jAsbh6V9IpseXByp/arcgis/rest/services/PGH2O_Water_Service_Line_Material/FeatureServer/0`.
- **Not public:**
  - water mains (PWSA)
  - sewer/treatment capacity (PWSA/ALCOSAN) — capacity is determined through the DEP Sewage Facilities Planning Module
  - electric hosting capacity (Duquesne Light) [U]

  These gaps should be stated as limitations.
- **Transit [V]:**
  - GTFS: `https://www.rideprt.org/developerresources/GTFS.zip`
  - WPRDC stops `d6e6ed6e-9220-4a0e-9796-e72d83ce8e7a`, with trips per day

## Permits and outcomes
- **PLI permits [V]:** WPRDC `f4d1177a-f597-4c32-8cbf-7885f56253f6`. 65k rows, 2019-06 → 2026-09.
- **OneStopPGH [V]:** `https://pghbridgis.pittsburghpa.gov/hosting/rest/services/Hosted/OSPI_H/FeatureServer/0`. 330k records with `parc_num`, `type`, `type_work_desc`, `issue_date`, and a `workflows` JSON of dated steps. Queries are slow (~11 s).
- **Picking out new construction:** use `type='BUILDING'` and `type_work_desc` = `NEW CONSTRUCTION` **or** `New Construction`. Recoded in 2025, so union both values. Multifamily is often coded "Commercial", so filter by `work_desc`.
- **Demolitions:** 1,297.
- **ZBA decisions [V, sample only]:** per-case PDFs under `pittsburghpa.gov/files/assets/city/v/1/dcp/documents/zoning-board-of-adjustment/`.
  - Labeled fields: hearing and decision dates, case number, address, lot/block, district, requested relief with code sections, decision.
  - Filenames are inconsistent, so crawl per-meeting pages.
  - Estimated 150–200 cases a year [U].
  - The CDN blocks curl.
- **HUD LIHTC [V, stale]:** 215 Allegheny projects. The latest real YR_PIS is 2019.
- **Pro-Housing Pittsburgh [V]:** `prohousingpgh/pittsburgh_iz` is a hand-built CSV of 109 buildings with 20+ units since 2012, with zoning and CO dates. CC BY-NC.

## Market, affordability, geography
- **HUD FY2026 income limits [V]** (Pittsburgh HMFA, from HUD xlsx):

  | Measure | Amount |
  |---|---|
  | AMI | $110,400 |
  | 4-person 30% | $33,100 |
  | 4-person 50% | $55,200 |
  | 4-person 80% | $88,300 |

- **QCT / DDA 2026 [V]:**
  - `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0`
  - `.../Difficult_Development_Areas_2026/FeatureServer/0`
  - Opportunity Zones: `.../Opportunity_Zones/FeatureServer/13` (2010 tracts)
- **Zillow ZORI by ZIP [V]:** `https://files.zillowstatic.com/research/public_csvs/zori/Zip_zori_uc_sfrcondomfr_sm_month.csv`
- **Walkability [V]:** EPA `https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex/MapServer/0`
- **LODES jobs [V]:** `https://lehd.ces.census.gov/data/lodes/LODES8/pa/wac/pa_wac_S000_JT00_2023.csv.gz`
- **Neighborhoods / tracts [V]:** `C/PGHWebNeighborhoods`; TIGERweb tracts
- **PHFA 2025–26 QAP [V]:**
  - Max basis per unit $320k (9%) / $380k (4%)
  - Developer fee caps
  - Development cost limits (general requirements ≤6%, overhead 2%, profit 6%, contingency 5%/10%)

## Freshness warning
Many city layers were last edited in 2023. Check `editingInfo` and show data-as-of dates in the UI.
